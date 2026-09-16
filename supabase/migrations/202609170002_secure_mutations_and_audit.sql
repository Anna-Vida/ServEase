-- ============================================================
-- ServEase Phase 1: Secure mutations and trusted audit logging
-- Date: 2026-09-17
--
-- This migration keeps the current frontend API compatible while moving
-- important authorization rules into PostgreSQL.
-- ============================================================

begin;

-- ============================================================
-- CURRENT ROLE HELPER
-- ============================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;


-- ============================================================
-- ROLE-SAFE APPOINTMENT UPDATE GUARD
-- ============================================================

create or replace function public.guard_appointment_update_by_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role;
begin
  -- Database administrators / trusted server contexts may not have an
  -- authenticated end-user id. Existing RLS still controls normal clients.
  if actor_id is null then
    return new;
  end if;

  select role
    into actor_role
  from public.profiles
  where id = actor_id;

  if actor_role is null then
    raise exception using
      errcode = '42501',
      message = 'Authenticated user does not have a ServEase profile.';
  end if;

  -- Admins keep full operational control.
  if actor_role = 'admin' then
    return new;
  end if;

  -- Customers may only cancel their own pending appointment. They cannot
  -- change service, schedule, staff assignment, notes, or ownership.
  if actor_role = 'customer' then
    if old.customer_id <> actor_id then
      raise exception using
        errcode = '42501',
        message = 'Customers can only update their own appointments.';
    end if;

    if old.status <> 'pending' or new.status <> 'cancelled' then
      raise exception using
        errcode = '42501',
        message = 'Customers may only cancel pending appointments.';
    end if;

    if new.customer_id is distinct from old.customer_id
      or new.staff_id is distinct from old.staff_id
      or new.service_id is distinct from old.service_id
      or new.appointment_date is distinct from old.appointment_date
      or new.appointment_time is distinct from old.appointment_time
      or new.notes is distinct from old.notes
    then
      raise exception using
        errcode = '42501',
        message = 'Customers cannot modify appointment details during cancellation.';
    end if;

    return new;
  end if;

  -- Staff may only change the status of appointments assigned to them.
  if actor_role = 'staff' then
    if old.staff_id is distinct from actor_id then
      raise exception using
        errcode = '42501',
        message = 'Staff can only update appointments assigned to them.';
    end if;

    if new.customer_id is distinct from old.customer_id
      or new.staff_id is distinct from old.staff_id
      or new.service_id is distinct from old.service_id
      or new.appointment_date is distinct from old.appointment_date
      or new.appointment_time is distinct from old.appointment_time
      or new.notes is distinct from old.notes
    then
      raise exception using
        errcode = '42501',
        message = 'Staff may only update appointment status.';
    end if;

    if old.status = 'cancelled' or old.status = 'completed' then
      raise exception using
        errcode = '23514',
        message = 'Completed or cancelled appointments cannot be reopened by staff.';
    end if;

    if old.status = 'pending' and new.status not in ('confirmed', 'cancelled') then
      raise exception using
        errcode = '23514',
        message = 'Pending appointments may only be confirmed or cancelled by staff.';
    end if;

    if old.status = 'confirmed' and new.status not in ('completed', 'cancelled') then
      raise exception using
        errcode = '23514',
        message = 'Confirmed appointments may only be completed or cancelled by staff.';
    end if;

    return new;
  end if;

  raise exception using
    errcode = '42501',
    message = 'This role cannot update appointments.';
end;
$$;

revoke all on function public.guard_appointment_update_by_role() from public;


drop trigger if exists appointments_guard_update_by_role
  on public.appointments;

create trigger appointments_guard_update_by_role
before update
on public.appointments
for each row
execute function public.guard_appointment_update_by_role();


-- ============================================================
-- TRUSTED AUDIT LOG RPC
-- ============================================================

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  audit_id uuid;
begin
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to create an audit event.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = actor_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Authenticated user does not have a ServEase profile.';
  end if;

  if p_action is null or length(trim(p_action)) = 0 or length(p_action) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Audit action must contain between 1 and 120 characters.';
  end if;

  if p_entity_type is not null and length(p_entity_type) > 80 then
    raise exception using
      errcode = '22023',
      message = 'Audit entity type cannot exceed 80 characters.';
  end if;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    actor_id,
    trim(p_action),
    nullif(trim(p_entity_type), ''),
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

revoke all on function public.log_audit_event(text, text, uuid, jsonb) from public;
grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;

-- Direct browser inserts are no longer trusted. Authenticated clients must use
-- log_audit_event(), which always derives user_id from auth.uid().
drop policy if exists "Authenticated users can create audit logs"
  on public.audit_logs;

commit;
