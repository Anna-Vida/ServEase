# ServEase

ServEase is a full-stack appointment management application for businesses that need one place to manage customers, staff, services, and bookings.

Live site: [**servease-iota.vercel.app**](https://servease-iota.vercel.app/)

The application currently supports three roles:

- **Customer**: create an account, sign in, view the customer dashboard, and book an appointment.
- **Staff**: access a protected staff dashboard.
- **Admin**: access a protected dashboard and review appointment bookings.

## Technology

- React 19, TypeScript, and Vite
- React Router for client-side routing
- Tailwind CSS and Lucide React for the interface
- Supabase Auth and PostgreSQL for authentication and application data
- Node.js, Express, Helmet, CORS, Morgan, and TypeScript for the API service

## Features

- Registration and login with Supabase Auth
- Automatic profile creation and role-based access control
- Protected and role-protected routes
- Customer, staff, and admin dashboards
- Customer appointment booking with active services, date, time, and notes
- Admin booking list with customer, service, schedule, status, and notes
- Express API root and health-check endpoints
- Responsive interface foundation

## Project Structure

```text
ServEase/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/app.ts
│   └── package.json
├── .gitignore
└── README.md
```

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project with Auth enabled
- Supabase tables and policies for `profiles`, `services`, and `appointments`

## Setup

Clone the repository and install dependencies for both applications:

```bash
git clone https://github.com/Anna-Vida/ServEase.git
cd ServEase

cd client
npm install
cd ../server
npm install
cd ..
```

Create `client/.env` with the public Supabase connection values:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env` files, service-role keys, or other secrets. Environment files are excluded by `.gitignore`.

## Run Locally

Start the frontend in one terminal:

```bash
cd client
npm run dev
```

The frontend is available at `http://localhost:5173`.

Start the API service in a second terminal:

```bash
cd server
npm run dev
```

The API is available at `http://localhost:5000`. Its health check is `GET /api/health`.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Sign in |
| `/register` | Public | Create an account |
| `/customer` | Authenticated | Customer dashboard |
| `/book` | Customer | Book an appointment |
| `/staff` | Staff | Staff dashboard |
| `/admin` | Admin | Admin dashboard |
| `/admin/bookings` | Admin | Review bookings |

## Build and Validation

```bash
cd client
npm run lint
npm run build

cd ../server
npm run build
```

## Roadmap

- Staff availability and appointment management
- Customer and service management screens
- Payment tracking and revenue reporting
- Search, filtering, and pagination
- Notifications, audit logs, and real-time updates
- Production deployment

## Author

**Anna Vida**

[GitHub profile](https://github.com/Anna-Vida)

## Status

ServEase is under active development.
