# ServEase Supabase Setup

ServEase uses Supabase for PostgreSQL database storage, authentication, and Row Level Security.

## Database Features

The Supabase backend includes:

- User profiles
- Role-based access
  - Admin
  - Staff
  - Customer
- Services
- Staff profiles
- Appointments
- Payments
- Audit logs
- Row Level Security policies
- Automatic customer profile creation
- Admin authorization helper functions

## Database Schema

The complete database schema is located in:

```text
supabase/schema.sql
````

The schema contains:

* Tables
* Relationships
* Constraints
* Authentication triggers
* Helper functions
* RLS policies
* Seed services

## Creating a New Supabase Project

1. Create a new project at Supabase.

2. Open:

```text
SQL Editor
```

3. Create a new query.

4. Copy the contents of:

```text
schema.sql
```

5. Run the SQL script.

This will create the ServEase database structure.

## Authentication

ServEase uses Supabase Authentication.

When a new user signs up, the database trigger automatically creates a corresponding row in:

```text
public.profiles
```

New accounts are assigned the default role:

```text
customer
```

Admin and staff roles should be assigned by an authorized administrator.

## Environment Variables

The frontend requires the following environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Create:

```text
client/.env
```

Do not commit `.env` files to GitHub.

## Row Level Security

Row Level Security is enabled on the main tables.

Customers can:

* View their own profile
* View their own appointments
* Create appointments
* Cancel/update eligible appointments
* View payments connected to their appointments
* View staff assigned to their appointments
* Create audit records for their own actions

Staff can:

* View their own staff profile
* View appointments assigned to them
* Update assigned appointments

Admins can:

* View customers
* Manage staff
* Manage services
* Manage appointments
* Manage payments
* View audit logs

## Audit Logging

ServEase records important business actions in:

```text
public.audit_logs
```

Examples include:

* Booking status changes
* Customer cancellations
* Staff assignment
* Staff unassignment
* Payment creation
* Payment status changes

## Seed Services

The schema currently includes example services such as:

* Basic Consultation
* Standard Service
* Premium Service
* Home Service Consultation

These can be changed later through the ServEase Admin interface.

## Security Notes

Never expose Supabase secret/service-role keys in the frontend.

Only the Supabase publishable key should be used by the React client.

Administrative authorization is enforced using Supabase Row Level Security and the `is_admin()` database helper.

---

ServEase
Full-Stack Business Operations Platform

````

Then save it.

After that, run:

```powershell
git add supabase/README.md
git commit -m "docs: add Supabase setup guide"
git push
````
