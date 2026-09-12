# ServEase

ServEase is a full-stack business operations and appointment management platform designed to help service-based businesses manage customers, staff, services, bookings, payments, and operational activity from one system.

The application provides dedicated workflows for **customers, staff, and administrators**, with authentication, role-based access control, analytics, audit logging, and email notifications.

**Live Frontend:** https://servease-iota.vercel.app/

**Repository:** https://github.com/Anna-Vida/ServEase

---

## Overview

ServEase was built as a full-stack portfolio project focused on practical business workflows rather than a simple CRUD application.

The system supports three user roles:

### Customer

Customers can:

- Register and sign in securely
- View their appointment dashboard
- Browse active services
- Create appointment requests
- View assigned staff
- Track appointment status
- View payment information
- Cancel eligible pending appointments
- Receive booking confirmation emails

### Staff

Staff members can:

- Access a protected staff dashboard
- View appointments assigned to them
- Track pending, confirmed, and completed appointments
- Update appointment status
- View customer and service information

### Administrator

Administrators can:

- View operational dashboard analytics
- Manage bookings
- Assign and unassign staff
- Update booking statuses
- Manage customers
- Manage staff records
- Create and update services
- Activate or deactivate services
- Record and update payments
- View revenue information
- Review system audit logs
- Search and filter operational records

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- Helmet
- CORS
- Morgan
- Resend

### Database and Authentication

- Supabase
- PostgreSQL
- Supabase Auth
- PostgreSQL Row Level Security

### Testing and CI

- Vitest
- React Testing Library
- Supertest
- GitHub Actions

### Deployment

- Vercel — frontend
- Supabase — authentication and PostgreSQL database

---

## Key Features

### Authentication and Authorization

ServEase uses Supabase Auth for account authentication and a profile-based role system for authorization.

Protected routes restrict access based on the authenticated user's role:

- Customer
- Staff
- Admin

PostgreSQL Row Level Security provides an additional database-level authorization layer.

---

### Appointment Management

Customers can create appointment requests using active services stored in Supabase.

Each appointment contains:

- Customer
- Service
- Appointment date
- Appointment time
- Notes
- Assigned staff
- Booking status

Supported appointment statuses include:

- Pending
- Confirmed
- Completed
- Cancelled

Administrators can manage booking status and staff assignments, while staff can update appointments assigned to them.

---

### Service Management

Administrators can:

- Create services
- Edit service information
- Set service price
- Set service duration
- Activate services
- Deactivate services

Customers only see active services when creating appointments.

---

### Staff Management

ServEase maintains separate staff profiles linked to authenticated user profiles.

Administrators can view:

- Staff name
- Position
- Contact information
- Bio
- Account status

Bookings can be assigned or unassigned from active staff members.

---

### Customer Management

Administrators can search and review registered customer profiles, including:

- Customer name
- Contact number
- Account identifier
- Registration date

---

### Payment Tracking

Administrators can record payments associated with appointments.

Payment information includes:

- Appointment
- Customer
- Service
- Amount
- Payment method
- Payment status
- Payment date

Supported payment statuses include:

- Pending
- Paid
- Failed
- Refunded

---

### Admin Analytics

The administrator dashboard provides live data from the application database, including:

- Total bookings
- Total customers
- Active staff
- Paid revenue
- Booking status distribution
- Monthly revenue trends
- Today's appointments

Charts are rendered using Recharts.

---

### Audit Logging

ServEase records important administrative and operational actions.

Examples include:

- Booking status changes
- Customer cancellations
- Staff assignments
- Staff unassignments
- Payment creation
- Payment status changes
- Service creation
- Service updates
- Service activation and deactivation

Audit records contain the authenticated user, action type, affected entity, metadata, and timestamp.

---

## Email Notifications

ServEase integrates with the **Resend API** through the Express backend.

When a customer successfully creates an appointment:

1. Supabase creates the appointment.
2. The frontend receives the generated booking ID.
3. The authenticated Supabase session token is sent to the Express API.
4. The backend verifies the user through Supabase.
5. The backend confirms that the booking belongs to the authenticated customer.
6. Trusted booking information is loaded from the database.
7. Resend sends a branded ServEase booking confirmation email.

The browser does not provide trusted customer or booking details directly to the email provider.

Email delivery failure does not roll back a successfully created appointment. The integration is covered by mocked tests; live email delivery has not yet been verified.

### Email Security

The integration uses:

- Supabase authentication tokens
- Customer ownership validation
- Row Level Security
- Backend environment variables
- Server-side Resend API calls

The Resend API key and webhook secret stay on the backend. The frontend uses the Supabase public/publishable key and the signed-in user's access token.

> During development, the Resend testing domain can only deliver email to the email address associated with the Resend account. A verified domain is required for unrestricted production delivery.

---

## Automated Testing

ServEase includes automated frontend and backend tests.

### Frontend

Frontend tests use:

- Vitest
- React Testing Library
- jsdom

Current tests cover interface rendering and booking-related functionality.

### Backend

Backend tests use:

- Vitest
- Supertest

Tests cover:

- API health endpoint
- API root endpoint
- Protected notification endpoint
- Missing authentication
- Invalid booking requests
- Booking ownership flow
- Mocked email delivery
- Webhook protection

External Supabase and Resend calls are mocked during automated tests.

Current local test suite:

```text
Frontend: 8 tests
Backend:  8 tests
Total:   16 tests
```

---

## Continuous Integration

ServEase includes a GitHub Actions workflow located at:

```text
.github/workflows/ci.yml
```

The workflow is configured to run automatically on pushes and pull requests to `main`.

### Frontend CI

```text
Install dependencies
        ↓
Run lint
        ↓
Run tests
        ↓
Build production frontend
```

### Backend CI

```text
Install dependencies
        ↓
Run API tests
        ↓
Build TypeScript backend
```

The workflow is configured, and local tests and builds pass. GitHub-hosted execution is currently blocked by an account billing issue; a successful hosted run has not yet been verified.

---

## Database

The Supabase PostgreSQL database includes the following primary tables:

```text
profiles
services
staff_profiles
appointments
payments
audit_logs
```

### Security

Row Level Security is enabled to restrict database operations based on the authenticated user's identity and role.

Examples include:

- Customers accessing their own appointments
- Staff accessing appointments assigned to them
- Administrators managing operational data
- Customers viewing their own payment information
- Administrative access to audit logs

Database schema documentation is available in:

```text
supabase/
```

---

## Project Structure

```text
ServEase/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── client/
│   ├── src/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── test/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   ├── README.md
│   └── schema.sql
│
└── README.md
```

---

## Application Routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | User login |
| `/register` | Public | Customer registration |
| `/customer` | Customer | Customer dashboard |
| `/book` | Customer | Appointment booking |
| `/staff` | Staff | Staff dashboard |
| `/admin` | Admin | Admin analytics dashboard |
| `/admin/bookings` | Admin | Booking management |
| `/admin/customers` | Admin | Customer management |
| `/admin/staff` | Admin | Staff management |
| `/admin/services` | Admin | Service management |
| `/admin/payments` | Admin | Payment management |
| `/admin/audit-logs` | Admin | Audit log viewer |

---

## Local Setup

### Requirements

Install:

- Node.js 24 (matches CI)
- npm
- Git

You also need:

- Supabase project
- Resend account

---

### Clone the Repository

```bash
git clone https://github.com/Anna-Vida/ServEase.git
cd ServEase
```

---

### Install Frontend Dependencies

```bash
cd client
npm install
```

---

### Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## Environment Variables

### Frontend

Create:

```text
client/.env
```

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_URL=http://localhost:5000
```

---

### Backend

Create:

```text
server/.env
```

Example:

```env
PORT=5000

SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

RESEND_API_KEY=your_resend_api_key

NOTIFICATION_WEBHOOK_SECRET=your_secure_webhook_secret
```

Never commit real environment files or API keys.

Safe templates are provided through `.env.example` files.

---

## Running Locally

Open two terminals.

### Frontend

```bash
cd client
npm run dev
```

Default development URL:

```text
http://localhost:5173
```

Vite may automatically use another port if 5173 is already occupied.

### Backend

```bash
cd server
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health endpoint:

```text
GET /api/health
```

---

## Running Tests

### Frontend

```bash
cd client
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Backend

```bash
cd server
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## Production Builds

### Frontend

```bash
cd client
npm run build
```

### Backend

```bash
cd server
npm run build
```

---

## Deployment Status

### Frontend

The React frontend is deployed on Vercel:

https://servease-iota.vercel.app/

The Vercel project is connected to GitHub, allowing new frontend deployments after updates are pushed to the configured production branch.

### Backend

The Express backend currently runs locally during development and is prepared for separate cloud deployment.

A production backend deployment will be required for features such as Resend email notifications to work from the live Vercel frontend.

---

## Current Development Status

### Completed

- Authentication
- Role-based authorization
- Customer dashboard
- Staff dashboard
- Admin dashboard
- Appointment booking
- Booking management
- Staff assignment
- Customer management
- Staff management
- Service management
- Payment tracking
- Revenue analytics
- Audit logging
- Responsive interface
- Supabase Row Level Security
- Booking confirmation email integration (live delivery pending verification)
- Authenticated Express notification API
- Frontend unit/component tests
- Backend API tests
- GitHub Actions CI configuration
- Vercel frontend deployment

### Planned Improvements

- Deploy Express backend to the cloud
- Verify a custom email domain
- Expand automated test coverage
- Strengthen appointment cancellation security
- Prevent duplicate payment records
- Add route-level code splitting and performance optimization
- Add additional third-party integrations
- Production security review

---

## Security Notes

ServEase currently uses:

- Supabase Auth
- Role-based route protection
- PostgreSQL Row Level Security
- Authenticated Express API routes
- Booking ownership validation
- Environment-based secret management
- Helmet security headers
- Protected server-to-server webhook endpoint

Environment files and API credentials are excluded from version control.

---

## Author

**Anna Patricia B. Vida**

GitHub: https://github.com/Anna-Vida

LinkedIn: https://www.linkedin.com/in/annavida12/

---

## License

This project was developed as a portfolio and learning project.

---

## Project Status

ServEase is under active development and continues to receive improvements in testing, security, API integration, performance, and cloud deployment.