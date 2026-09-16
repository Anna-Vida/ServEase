-- ============================================================
-- ServEase Phase 1 Security Guardrails
-- Date: 2026-09-17
--
-- Goals
-- 1. Prevent duplicate payment records for one appointment.
-- 2. Reject invalid payment amounts.
-- 3. Prevent staff double-booking, including overlapping services.
-- 4. Prevent active appointments from being scheduled in the past.
-- 5. Add indexes for common authorization / dashboard lookups.
--
-- This migration is intentionally compatible with the current frontend.
-- It does not yet remove the existing direct Supabase mutation flows.
-- ============================================================

begin;

-- ============================================================
-- PAYMENT GUARDS
-- ============================================================

create or replace function public.guard_payment_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.amount is null or new.amount <= 0 then
    raise exception using
      errcode = '23514',
      message = 'Payment amount must be greater than zero.';
  end if;

  if exists (
    select 1
    from public.payments p
    where p.appointment_id = new.appointment_id
      and p.id is distinct from new.id
  ) then
    raise exception using
      errcode = '23505',
      message = 'A payment record already exists for this appointment.';
  end if;

  if new.payment_status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  elsif new.payment_status <> 'paid' then
    new.paid_at := null;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_payment_write() from public;


drop trigger if exists payments_guard_write on public.payments;

create trigger payments_guard_write
before insert or update
on public.payments
for each row
execute function public.guard_payment_write();


-- ============================================================
-- APPOINTMENT SCHEDULING GUARDS
-- ============================================================

create or replace function public.guard_appointment_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$;
declare
  requested_duration integer;
  requested_start timestamp;
  requested_end timestamp;
begin
  -- Cancelled appointments no longer reserve a schedule slot.
  if new.status = 'cancelled' then
    return new;
  end if;

  requested_start := new.appointment_date::timestamp + new.appointment_time;

  if requested_start < now() then
    raise exception using
      errcode = '23514',
      message = 'Active appointments cannot be scheduled in the past.';
  end if;

  -- Unassigned pending appointments are allowed. Conflict detection begins
  -- once a staff member is assigned.
  if new.staff_id is null then
    return new;
  end if;

  select greatest(coalesce(s.duration_minutes, 60), 1)
    into requested_duration
  from public.services s
  where s.id = new.service_id;

  if requested_duration is null then
    raise exception using
      errcode = '23503',
      message = 'The selected service does not exist.';
  end if;

  requested_end := requested_start + make_interval(mins => requested_duration);

  if exists (
    select 1
    from public.appointments a
    join public.services existing_service
      on existing_service.id = a.service_id
    where a.staff_id = new.staff_id
      and a.id is distinct from new.id
      and a.status <> 'cancelled'
      and (
        new.appointment_date::timestamp + new.appointment_time
      ) < (
        a.appointment_date::timestamp
        + a.appointment_time
        + make_interval(
            mins => greatest(
              coalesce(existing_service.duration_minutes, 60),
              1
            )
          )
      )
      and (
        new.appointment_date::timestamp
        + new.appointment_time
        + make_interval(mins => requested_duration)
      ) > (
        a.appointment_date::timestamp + a.appointment_time
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'This staff member already has an overlapping appointment.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_appointment_schedule() from public;


drop trigger if exists appointments_guard_schedule on public.appointments;

create trigger appointments_guard_schedule
before insert or update of staff_id, service_id, appointment_date, appointment_time, status
on public.appointments
for each row
execute function public.guard_appointment_schedule();


-- ============================================================
-- PERFORMANCE / AUTHORIZATION INDEXES
-- ============================================================

create index if not exists appointments_customer_id_idx
  on public.appointments (customer_id);

create index if not exists appointments_staff_id_idx
  on public.appointments (staff_id)
  where staff_id is not null;

create index if not exists appointments_schedule_idx
  on public.appointments (appointment_date, appointment_time, status);

create index if not exists appointments_staff_schedule_idx
  on public.appointments (staff_id, appointment_date, appointment_time)
  where staff_id is not null and status <> 'cancelled';

create index if not exists payments_appointment_id_idx
  on public.payments (appointment_id);

create index if not exists payments_status_idx
  on public.payments (payment_status, created_at desc);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

commit;
