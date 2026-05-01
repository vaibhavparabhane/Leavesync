# NexusPulse Frontend

Modern, enterprise-grade leave management system frontend built with Next.js 15, TypeScript, and Material-UI following MVC architecture.

## 🎯 Overview

NexusPulse Frontend is a responsive, type-safe React application that provides an intuitive interface for managing employee leaves, holidays, and attendance tracking with role-based access control.

## ✨ Features

### For Employees
- 📊 Dashboard with leave statistics
- 📅 Interactive attendance calendar
- 📝 Apply for leave with validation
- 📋 View leave history with filters
- 🔔 Real-time leave status updates

### For HR/Managers
- 👥 Team leave management
- ✅ Approve/reject leave requests
- 📊 Dashboard with team analytics
- 🎯 Apply leave on behalf of employees
- 📈 Team leave reports

### For Admins
- 🏢 Holiday management
- 📅 Assign holidays to employees
- 🔧 Leave type configuration
- 👤 User management
- ⚙️ Policy management
- 📊 Manual balance adjustments

## 🏗️ Architecture

### MVC Pattern (Frontend)

```
┌─────────────────────────────────────┐
│   VIEW (React Components)           │
│   - UI Rendering                    │
│   - User Interactions               │
│   - Pages & Components              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   CONTROLLER (Controllers)          │
│   - API Orchestration               │
│   - Error Handling                  │
│   - Response Processing             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   SERVICE (Services)                │
│   - API Calls                       │
│   - Business Logic                  │
│   - Data Transformation             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   MODEL (TypeScript Interfaces)    │
│   - Data Types                      │
│   - Type Safety                     │
└─────────────────────────────────────┘
=======
# NexusPulse Frontend - Next.js Application

Modern, responsive leave management system frontend built with Next.js 15, TypeScript, and Material-UI following MVC architecture.

## 🏗️ Architecture

**MVC Pattern:**
```
Views (React Components) → Controllers → Services → Models
     ↓                         ↓            ↓         ↓
  UI Layer              Orchestration   Business   Data Types
                                         Logic
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── admin/        # Admin pages
│   │   ├── employee/     # Employee pages
│   │   └── hr/           # HR pages
│   ├── forbidden/        # Access denied page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Login page
│
├── components/            # React components
│   ├── common/           # Reusable components
│   ├── DashboardLayout.tsx
│   ├── ErrorBoundary.tsx
│   └── ProtectedRoute.tsx
│
├── controllers/           # MVC Controllers
│   ├── AdminController.ts
│   ├── HRController.ts
│   └── LeaveController.ts
│
├── services/              # API Services
│   ├── AuthService.ts
│   ├── HRService.ts
│   └── LeaveService.ts
│
├── models/                # TypeScript Models
│   ├── Leave.ts
│   └── User.ts
│
├── context/               # React Context
│   └── AuthContext.tsx
│
├── config/                # Configuration
│   ├── api.config.ts
│   ├── constants.ts
│   └── security.config.ts
│
├── utils/                 # Utilities
│   ├── api.ts            # Axios instance
│   ├── apiCache.ts       # API caching
│   ├── apiRetry.ts       # Retry logic
│   ├── csrfManager.ts    # CSRF protection
│   ├── errorHandler.ts   # Error handling
│   ├── inputSanitizer.ts # Input sanitization
│   ├── logger.ts         # Logging
│   └── validator.ts      # Validation
│
├── theme/                 # Material-UI theme
│   └── theme.ts
│
└── middleware.ts          # Next.js middleware
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

1. **Navigate to frontend directory**
```bash
cd nexus-frontend
```

2. **Install dependencies**
=======
nexus-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── hr/            # HR pages
│   │   │   └── employee/      # Employee pages
│   │   ├── layout.tsx
│   │   └── page.tsx           # Login page
│   ├── components/            # React components (Views)
│   │   ├── DashboardLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── common/
│   ├── controllers/           # Orchestration layer
│   │   ├── LeaveController.ts
│   │   ├── HRController.ts
│   │   └── AdminController.ts
│   ├── services/              # Business logic
│   │   ├── AuthService.ts
│   │   ├── LeaveService.ts
│   │   └── HRService.ts
│   ├── models/                # TypeScript interfaces
│   │   ├── User.ts
│   │   └── Leave.ts
│   ├── utils/                 # Utilities
│   │   ├── api.ts
│   │   ├── apiCache.ts
│   │   └── errorHandler.ts
│   ├── context/               # React Context
│   │   └── AuthContext.tsx
│   ├── config/                # Configuration
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running

### Installation

1. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Create .env.local (optional)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🎨 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Material-UI | 7.3.7 | Component library |
| Axios | 1.13.5 | HTTP client |
| date-fns | 4.1.0 | Date utilities |
| Emotion | 11.14.0 | CSS-in-JS |

## 👤 Default Users

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@example.com | password123 |
| HR | hr@example.com | password123 |
| Admin | admin@example.com | password123 |

## 🔒 Security Features

-  JWT Authentication
-  Role-Based Access Control (RBAC)
-  Protected Routes
-  CSRF Protection
-  Input Sanitization
-  XSS Prevention
-  Secure HTTP Headers
-  Token Refresh
-  Session Management

## 📱 Responsive Design

-  Mobile-first approach
-  Tablet optimized
-  Desktop optimized
-  Material-UI responsive components
-  Adaptive layouts

## 🎯 Key Features

### Authentication
- Secure login with JWT
- Auto token refresh
- Session persistence
- Role-based redirects

### Dashboard
- Real-time statistics
- Leave balance overview
- Pending approvals
- Team insights

### Leave Management
- Apply leave with validation
- View leave history
- Filter and sort
- Status tracking
- Calendar view

### Calendar
- Color-coded events
- Holiday markers
- Leave visualization
- Month navigation
- Interactive UI

### Admin Features
- Holiday management
- Leave type configuration
- Employee management
- Policy settings
- Manual adjustments

## 🔄 API Integration

### Base Configuration
```typescript
// src/config/api.config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

### API Structure
```typescript
// Controllers handle orchestration
LeaveController.fetchLeaveRecords()
  ↓
// Services make API calls
LeaveService.getMyLeaves()
  ↓
// Utils handle HTTP
api.get('/leaves/my')
```

## 🎨 Theming

### Custom Theme
```typescript
// src/theme/theme.ts
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});
```

## 🌐 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📦 Build & Deploy

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### API Connection Error
```bash
# Check backend is running
curl http://localhost:5000/health

# Verify API URL in config
echo $NEXT_PUBLIC_API_URL
```

### Authentication Issues
```bash
# Clear browser storage
localStorage.clear()
sessionStorage.clear()
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## 📚 Documentation

- [Backend API](../nexus-backend/README.md)
- [MVC Architecture](../nexus-backend/MVC_ARCHITECTURE.md)
- [Security Guide](../nexus-backend/SECURITY_ENHANCEMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Material-UI for beautiful components
=======
2. **Configure environment**
```bash
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

3. **Run development server**
```bash
npm run dev
# App runs on http://localhost:3000
```

## 🔑 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 👤 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | emp1@nexus.com | emp123 |
| HR | hr@nexus.com | hr123 |
| Admin | admin@nexus.com | admin123 |

## 🎨 Features by Role

### Employee Dashboard
- View leave balance
- Apply for leave
- View leave history
- Check attendance calendar
- Track leave statistics

### HR Dashboard
- Approve/reject leaves
- View team leaves
- Apply leave on behalf
- Manage employee balances
- View dashboard statistics

### Admin Dashboard
- All HR features
- Manage holidays
- Assign holidays to employees
- Manage leave types
- Configure system settings

## 🏛️ MVC Architecture Details

### Models (TypeScript Interfaces)
```typescript
// src/models/Leave.ts
export interface LeaveBalance {
  leave_type_id: string;
  leave_type: string;
  total_quota: number;
  used_days: number;
  remaining_days: number;
}
```

### Views (React Components)
```typescript
// src/app/dashboard/employee/page.tsx
export default function EmployeeDashboard() {
  // UI rendering only
  // Delegates to controllers
}
```

### Controllers (Orchestration)
```typescript
// src/controllers/LeaveController.ts
export class LeaveController {
  static async fetchLeaveBalance() {
    // Orchestrates API calls
    // Handles caching
    // Error handling
  }
}
```

### Services (Business Logic)
```typescript
// src/services/LeaveService.ts
export class LeaveService {
  static calculateWorkingDays() {
    // Business logic
    // Calculations
    // Validations
  }
}
```

## 🔐 Authentication Flow

1. User enters credentials
2. AuthService calls backend API
3. Backend returns JWT + user data
4. Token stored in sessionStorage + cookies
5. Cookies used by middleware for route protection
6. SessionStorage used by components for user data
7. Redirect to role-specific dashboard

```

### ProtectedRoute (Client-Side)
```typescript
// src/components/ProtectedRoute.tsx
// Checks user roles
// Redirects unauthorized users to /forbidden
```

## 🎯 Key Components

### AuthContext
- Manages authentication state
- Provides login/logout functions
- Handles user session

### DashboardLayout
- Common layout for all dashboards
- Role-based navigation
- Responsive sidebar

### API Utilities
- Axios instance with interceptors
- JWT token management
- CSRF protection
- Error handling
- Retry logic
- Caching

### Request Flow
```
Component → Controller → API → Backend
                ↓
            Cache Check
                ↓
            Error Handler
                ↓
            Response
```

## 🎨 UI/UX Features

- Material-UI components
- Responsive design
- Dark/Light theme support
- Loading states
- Error boundaries
- Toast notifications
- Form validation
- Date pickers with disabled dates
- Color-coded calendars

```

## 📦 Key Dependencies

- **Next.js 15.x** - React framework
- **React 18.x** - UI library
- **TypeScript 5.x** - Type safety
- **Material-UI 5.x** - Component library
- **Axios** - HTTP client
- **date-fns** - Date utilities

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
<<<<<<< HEAD
**Last Updated:** February 2024
=======
**Node:** 18+  
**Framework:** Next.js 15.x
