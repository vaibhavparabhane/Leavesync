# LeaveSync — Leave Management System

A full-stack, enterprise-grade leave management system built with **Next.js 16 + TypeScript** (frontend) and **Flask + PostgreSQL** (backend), following MVC architecture with role-based access control.

---

## Overview

LeaveSync is a responsive, type-safe leave management platform that allows employees to apply for leave, HR to manage approvals, and admins to configure holidays, leave types, and user permissions — all from a clean, modern SaaS-style dashboard.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Material-UI (MUI) | 7.3.7 | Component library |
| MUI X Date Pickers | 8.27.2 | Date picker components |
| Axios | 1.13.5 | HTTP client |
| date-fns | 4.1.0 | Date utilities |
| Emotion | 11.14.0 | CSS-in-JS styling |
| Jest | 29.7.0 | Unit testing |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| Flask | 3.1.2 | Web framework |
| SQLAlchemy | 2.0.45 | ORM |
| Flask-Migrate | 4.1.0 | Database migrations |
| Flask-JWT-Extended | 4.6.0 | JWT authentication |
| PostgreSQL | 14+ | Database |
| Marshmallow | 3.23.2 | Schema validation |
| Gunicorn | 23.0.0 | Production server |
| pytest | 9.0.2 | Testing |

---

## Project Structure

```
LEAVESYNC/
├── backend/
│   ├── app/
│   │   ├── constants/          # App-wide constants
│   │   ├── controllers/        # Request handlers
│   │   ├── decorators/         # Auth & role decorators
│   │   ├── models/             # SQLAlchemy models
│   │   ├── routes/             # API route definitions
│   │   ├── schemas/            # Marshmallow schemas
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helpers & utilities
│   │   ├── views/              # Response formatters
│   │   ├── config.py           # App configuration
│   │   ├── error_handlers.py   # Global error handlers
│   │   ├── extensions.py       # Flask extensions
│   │   └── __init__.py         # App factory
│   ├── migrations/             # Alembic migration files
│   ├── seeds/                  # Database seed scripts
│   │   ├── seed_master_data.py
│   │   ├── seed_users.py
│   │   ├── seed_permissions.py
│   │   └── seed_leave_ledger.py
│   ├── tests/                  # Backend tests
│   ├── .env                    # Environment variables (not committed)
│   ├── .env.example            # Environment variable template
│   ├── manage.py               # Flask CLI entry point
│   └── requirements.txt        # Python dependencies
│
└── frontend/
    ├── public/
    │   ├── logo.png            # App logo
    │   ├── icon.png            # App icon (favicon)
    │   └── google-logo.png     # Google login icon
    ├── src/
    │   ├── app/                # Next.js App Router pages
    │   │   ├── dashboard/
    │   │   │   ├── admin/      # Admin pages
    │   │   │   ├── hr/         # HR pages
    │   │   │   └── employee/   # Employee pages
    │   │   ├── forbidden/      # 403 access denied page
    │   │   ├── layout.tsx      # Root layout
    │   │   └── page.tsx        # Login page
    │   ├── components/         # Reusable React components
    │   │   ├── common/         # Shared UI components
    │   │   ├── DashboardLayout.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── controllers/        # MVC controllers (API orchestration)
    │   │   ├── LeaveController.ts
    │   │   ├── HRController.ts
    │   │   ├── AdminController.ts
    │   │   └── UserController.ts
    │   ├── services/           # Business logic layer
    │   │   ├── AuthService.ts
    │   │   ├── LeaveService.ts
    │   │   └── HRService.ts
    │   ├── models/             # TypeScript interfaces
    │   │   ├── Leave.ts
    │   │   └── User.ts
    │   ├── context/            # React Context providers
    │   │   └── AuthContext.tsx
    │   ├── config/             # App configuration
    │   │   ├── api.config.ts
    │   │   ├── constants.ts
    │   │   ├── security.config.ts
    │   │   ├── styles.ts
    │   │   └── typography.ts
    │   ├── utils/              # Utility functions
    │   │   ├── api.ts          # Axios instance + API methods
    │   │   ├── apiCache.ts     # Response caching
    │   │   ├── apiRetry.ts     # Retry logic
    │   │   ├── csrfManager.ts  # CSRF token management
    │   │   ├── errorHandler.ts # Error formatting
    │   │   ├── inputSanitizer.ts
    │   │   ├── validator.ts
    │   │   └── logger.ts
    │   ├── hooks/              # Custom React hooks
    │   │   ├── useDebounce.ts
    │   │   └── useFetch.ts
    │   ├── theme/
    │   │   └── theme.ts        # MUI theme configuration
    │   └── middleware.ts       # Next.js route middleware
    ├── .env.local              # Frontend env variables (not committed)
    ├── .env.example            # Frontend env template
    ├── package.json
    └── tsconfig.json
```

---

## Prerequisites

Make sure the following are installed before starting:

- **Node.js** 18 or higher — [Download](https://nodejs.org)
- **npm** 9+ (comes with Node.js)
- **Python** 3.11 or higher — [Download](https://python.org)
- **PostgreSQL** 14 or higher — [Download](https://postgresql.org)
- **uv** (Python package manager, optional but recommended) — `pip install uv`
- **Git** — [Download](https://git-scm.com)

---

## Backend Setup

### Step 1 — Navigate to the backend directory

```bash
cd LEAVESYNC/backend
```

### Step 2 — Create a Python virtual environment

```bash
# Using venv
python -m venv venv

# Activate on Windows
venv\Scripts\activate


### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Create the PostgreSQL database

Open your PostgreSQL client (psql or pgAdmin) and run:

```sql
CREATE DATABASE leavesync;
```

### Step 5 — Configure environment variables

```bash
cp .env.example .env
```

> Replace `yourpassword` with your actual PostgreSQL password.

```

```
### Step 6 — Run database migrations

```bash
flask db upgrade
```

### Step 7 — Seed the database with initial data

Run the seed scripts in this exact order:

```bash
# 1. Seed master data (leave types, locations, etc.)
python seeds/seed_master_data.py

# 2. Seed users (admin, HR, employee accounts)
python seeds/seed_users.py

# 3. Seed permissions
python seeds/seed_permissions.py

# 4. Seed leave ledger (initial leave balances)
python seeds/seed_leave_ledger.py
```

### Step 8 — Start the backend server

```bash
python manage.py
```

The backend API will be running at: `http://localhost:5000`

To verify it's working:

```bash
curl http://localhost:5000/health
```

---

## Frontend Setup

Open a **new terminal** and follow these steps.

### Step 1 — Navigate to the frontend directory

```bash
cd LEAVESYNC/frontend
```

### Step 2 — Install Node.js dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```


```

### Step 4 — Start the development server

```bash
npm run dev
```

The frontend will be running at: `http://localhost:3000`

---

## Environment Variables

### Backend — `.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/leavesync` |
| `SECRET_KEY` | Flask secret key | `your-secret-key` |
| `JWT_SECRET_KEY` | JWT signing key | `your-jwt-secret` |
| `FLASK_ENV` | Environment mode | `development` or `production` |
| `FLASK_APP` | Flask entry point | `manage.py` |
| `CORS_ORIGINS` | Allowed frontend origin | `http://localhost:3000` |

### Frontend — `.env.local`

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |

---

## Running the Application

Once both servers are running:

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Flask) | http://localhost:5000 |
| API Health Check | http://localhost:5000/health |
| Swagger API Docs | http://localhost:5000/apidocs |

---

## Login Credentials

After seeding the database, use these credentials to log in:

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexus.com | admin123 |
| HR | hr@nexus.com | hr123 |
| Employee | emp1@nexus.com | emp123 |

---

## Features by Role

### Employee
- View personal leave balance (total, used, remaining)
- Apply for leave with date picker and reason
- Select full-day or half-day (first half / second half)
- View leave application history with status
- Check attendance calendar with holidays marked
- Track leave statistics on dashboard

### HR
- View dashboard with team leave statistics
- Approve or reject pending leave requests
- View all team leave history with filters
- Apply leave on behalf of an employee
- Manage employee leave balances
- View pending approvals count

### Admin
- All HR features
- Create and manage holidays
- Assign holidays to specific employees by location
- Create and configure leave types with yearly quotas
- Create new user accounts
- Edit existing user details
- Manage role permissions
- Manually adjust employee leave balances

---

## Architecture

LeaveSync follows the **MVC pattern** on both frontend and backend.

### Frontend MVC

```
View (React Pages/Components)
        ↓
Controller (LeaveController, HRController, AdminController)
        ↓  ← handles caching, retries, error formatting
Service (LeaveService, HRService, AuthService)
        ↓  ← business logic, calculations, validations
Utils/API (api.ts — Axios instance)
        ↓
Backend REST API
```

### Backend MVC

```
Routes (Flask Blueprints)
        ↓
Controllers (request handling, input validation)
        ↓
Services (business logic, rules enforcement)
        ↓
Models (SQLAlchemy ORM — User, Leave, Holiday, etc.)
        ↓
PostgreSQL Database
```

---

## API Overview

All API endpoints are prefixed with the base URL (`http://localhost:5000`).

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/login` | Login and get JWT token | No |
| POST | `/auth/logout` | Logout and invalidate token | Yes |
| GET | `/leaves/my` | Get current user's leaves | Yes |
| POST | `/leaves/apply` | Apply for leave | Yes |
| GET | `/leaves/my/balance` | Get leave balance | Yes |
| GET | `/leaves/my/stats` | Get leave statistics | Yes |
| GET | `/leaves/types` | Get all leave types | Yes |
| GET | `/leaves/pending` | Get pending approvals | HR/Admin |
| POST | `/leaves/:id/approve` | Approve a leave | HR/Admin |
| POST | `/leaves/:id/reject` | Reject a leave | HR/Admin |
| GET | `/holidays` | Get holidays | Yes |
| POST | `/holidays` | Create a holiday | Admin |
| GET | `/employees` | Get all employees | HR/Admin |
| GET | `/employees/:id/balance` | Get employee balance | HR/Admin |
| POST | `/employees/:id/balance` | Update employee balance | Admin |
| GET | `/dashboard/stats` | Get dashboard statistics | Yes |

Full interactive API documentation is available at: `http://localhost:5000/apidocs`

---

## Authentication Flow

1. User submits email and password on the login page
2. Frontend calls `POST /auth/login` via `AuthService`
3. Backend validates credentials and returns a JWT token + user data
4. Token is stored in `sessionStorage` and as a cookie
5. Cookie is used by Next.js middleware for server-side route protection
6. `sessionStorage` is used by React components for user data
7. All subsequent API requests include `Authorization: Bearer <token>` header
8. On token expiry or 401 response, user is automatically redirected to login
9. On logout, token is cleared from both `sessionStorage` and cookies

---

## Security Features

- JWT-based authentication with expiry
- Role-Based Access Control (RBAC) — Employee / HR / Admin
- Protected routes via Next.js middleware (server-side)
- Client-side route protection via `ProtectedRoute` component
- CSRF token generation and validation on state-changing requests
- Input sanitization on all form fields
- XSS prevention via sanitized outputs
- Secure HTTP headers
- Session ID tracking for single-tab login enforcement
- Automatic redirect to `/forbidden` on unauthorized access

---

## Available Scripts

### Frontend

```bash
# Start development server
npm run dev

# Run unit tests
npm test

```
### Backend

```bash
# Start development server
python manage.py

# Run database migrations
flask db upgrade

# Create a new migration
flask db migrate -m "description"

# Downgrade migration
flask db downgrade

# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/
```

```


```


```

