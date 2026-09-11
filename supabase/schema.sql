-- ============================================================
-- ServEase Database Schema
-- PostgreSQL / Supabase
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- ENUMS
-- ============================================================

create type public.user_role as enum (
  'admin',
  'staff',
  'customer'
);


-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null default '',

  role public.user_role not null default 'customer',

  phone text,

  avatar_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- SERVICES
-- ============================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  description text,

  price numeric(10,2) not null default 0,

  duration_minutes integer not null default 60,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- STAFF PROFILES
-- ============================================================

create table public.staff_profiles (
  id uuid primary key
    references public.profiles(id)
    on delete cascade,

  position text,

  bio text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- APPOINTMENTS
-- ============================================================

create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  staff_id uuid
    references public.staff_profiles(id)
    on delete set null,

  service_id uuid not null
    references public.services(id)
    on delete restrict,

  appointment_date date not null,

  appointment_time time not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'confirmed',
        'completed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- PAYMENTS
-- ============================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  appointment_id uuid not null
    references public.appointments(id)
    on delete cascade,

  amount numeric(10,2) not null,

  payment_method text,

  payment_status text not null default 'pending'
    check (
      payment_status in (
        'pending',
        'paid',
        'failed',
        'refunded'
      )
    ),

  paid_at timestamptz,

  created_at timestamptz not null default now()
);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references public.profiles(id)
    on delete set null,

  action text not null,

  entity_type text,

  entity_id uuid,

  details jsonb,

  created_at timestamptz not null default now()
);


-- ============================================================
-- NEW USER PROFILE TRIGGER
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    'customer'
  );

  return new;

end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


-- ============================================================
-- ADMIN HELPER
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
enable row level security;

alter table public.services
enable row level security;

alter table public.staff_profiles
enable row level security;

alter table public.appointments
enable row level security;

alter table public.payments
enable row level security;

alter table public.audit_logs
enable row level security;


-- ============================================================
-- PROFILE POLICIES
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);


create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
);


create policy "Customers can view staff assigned to their appointments"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments
    where appointments.staff_id = profiles.id
      and appointments.customer_id = auth.uid()
  )
);


-- ============================================================
-- SERVICE POLICIES
-- ============================================================

create policy "Authenticated users can view active services"
on public.services
for select
to authenticated
using (
  is_active = true
);


create policy "Admins can manage services"
on public.services
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ============================================================
-- STAFF PROFILE POLICIES
-- ============================================================

create policy "Staff can view their own staff profile"
on public.staff_profiles
for select
to authenticated
using (
  id = auth.uid()
);


create policy "Admins can view staff profiles"
on public.staff_profiles
for select
to authenticated
using (
  public.is_admin()
);


create policy "Admins can manage staff profiles"
on public.staff_profiles
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ============================================================
-- APPOINTMENT SELECT POLICIES
-- ============================================================

create policy "Customers can view their own appointments"
on public.appointments
for select
to authenticated
using (
  customer_id = auth.uid()
);


create policy "Staff can view assigned appointments"
on public.appointments
for select
to authenticated
using (
  staff_id = auth.uid()
);


create policy "Admins can view all appointments"
on public.appointments
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- APPOINTMENT INSERT / UPDATE POLICIES
-- ============================================================

create policy "Customers can create appointments"
on public.appointments
for insert
to authenticated
with check (
  customer_id = auth.uid()
);


create policy "Customers can update their own pending appointments"
on public.appointments
for update
to authenticated
using (
  customer_id = auth.uid()
  and status = 'pending'
)
with check (
  customer_id = auth.uid()
);


create policy "Staff can update assigned appointments"
on public.appointments
for update
to authenticated
using (
  staff_id = auth.uid()
)
with check (
  staff_id = auth.uid()
);


create policy "Admins can manage all appointments"
on public.appointments
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ============================================================
-- PAYMENT POLICIES
-- ============================================================

create policy "Customers can view payments for their appointments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments
    where appointments.id = payments.appointment_id
      and appointments.customer_id = auth.uid()
  )
);


create policy "Admins can view all payments"
on public.payments
for select
to authenticated
using (
  public.is_admin()
);


create policy "Admins can manage payments"
on public.payments
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ============================================================
-- AUDIT LOG POLICIES
-- ============================================================

create policy "Authenticated users can create audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
);


create policy "Admins can view audit logs"
on public.audit_logs
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- SEED SERVICES
-- ============================================================

insert into public.services (
  name,
  description,
  price,
  duration_minutes,
  is_active
)
values

(
  'Basic Consultation',
  'Initial consultation and service assessment.',
  500.00,
  30,
  true
),

(
  'Standard Service',
  'Standard appointment service package.',
  1000.00,
  60,
  true
),

(
  'Premium Service',
  'Extended premium service package with additional support.',
  1800.00,
  90,
  true
),

(
  'Home Service Consultation',
  'On-site consultation service.',
  750.00,
  45,
  true
);


-- ============================================================
-- END OF SERVEASE SCHEMA
-- ============================================================