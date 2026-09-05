# BTHG Rental Car Platform

A multi-agency car rental management platform with NestJS backend, TypeScript SDK, and Next.js frontend.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [MVP Progress](#mvp-progress)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [SDK Package](#sdk-package)
- [Frontend Application](#frontend-application)
- [Test Credentials](#test-credentials)
- [Roadmap](#roadmap)

## Overview

BTHG Rental Car is a comprehensive car rental management platform supporting multiple agencies. The platform consists of:

- **Backend API** - NestJS REST API with JWT authentication
- **TypeScript SDK** - Shared SDK for web and mobile clients
- **Admin Dashboard** - Next.js frontend for agency administrators
- **Super Admin Dashboard** - Platform-wide management interface

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | Backend framework |
| Prisma | 5.x | ORM |
| PostgreSQL | 14+ | Database |
| JWT | - | Authentication |
| Swagger | - | API documentation |

### SDK
| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x | Type safety |
| Axios | 1.6.x | HTTP client |
| tsup | 8.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework |
| Chakra UI | 2.8.x | UI components |
| TanStack Query | 5.x | Data fetching |
| Zustand | 4.x | State management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Validation |

## Project Structure

```
BTHG-Rental-Car-2/
├── apps/
│   └── api/                      # NestJS Backend API
│       └── src/
│           ├── common/           # Decorators, filters, guards
│           ├── config/           # App & Swagger configuration
│           ├── modules/
│           │   ├── auth/         # Authentication (login, register, JWT)
│           │   ├── agencies/     # Agency CRUD & statistics
│           │   ├── cars/         # Car CRUD & availability
│           │   ├── rentals/      # Rental management
│           │   ├── users/        # User profile management
│           │   ├── admin/        # Agency admin dashboard
│           │   └── super-admin/  # Platform management
│           └── prisma/           # Database service
├── packages/
│   ├── database/                 # Prisma schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── seed.ts           # Seed data script
│   │   └── package.json
│   └── sdk/                      # TypeScript SDK
│       ├── src/
│       │   ├── client.ts         # API client
│       │   ├── modules/          # API modules
│       │   │   ├── auth.ts
│       │   │   ├── agencies.ts
│       │   │   ├── cars.ts
│       │   │   ├── rentals.ts
│       │   │   ├── users.ts
│       │   │   ├── admin.ts
│       │   │   └── super-admin.ts
│       │   ├── types/            # TypeScript types
│       │   └── index.ts
│       └── package.json
└── package.json                  # Root workspace config
```

### Frontend Repository (Separate)

```
bthg-rental-web/                  # Next.js Frontend
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login page
│   │   ├── (admin)/              # Admin dashboard
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── cars/
│   │   │       ├── rentals/
│   │   │       └── profile/
│   │   └── (super-admin)/        # Super admin dashboard
│   │       └── super-admin/
│   │           ├── dashboard/
│   │           ├── agencies/
│   │           ├── admins/
│   │           ├── rentals/
│   │           └── profile/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── forms/                # Form components
│   ├── hooks/                    # React Query hooks
│   ├── stores/                   # Zustand stores
│   └── lib/                      # Utilities
└── package.json
```

---

## MVP Progress

### ✅ Phase 1: Backend API (COMPLETE)

| Module | Status | Endpoints |
|--------|--------|-----------|
| Authentication | ✅ Complete | 7 endpoints |
| Agencies | ✅ Complete | 7 endpoints |
| Cars | ✅ Complete | 9 endpoints |
| Rentals | ✅ Complete | 5 endpoints |
| Users | ✅ Complete | 3 endpoints |
| Admin Dashboard | ✅ Complete | 4 endpoints |
| Super Admin | ✅ Complete | 7 endpoints |

**Total: 42 API endpoints**

### ✅ Phase 2: SDK Package (COMPLETE)

| Feature | Status |
|---------|--------|
| API Client with Axios | ✅ Complete |
| Auth module (login, register, refresh) | ✅ Complete |
| Agencies module (CRUD, stats) | ✅ Complete |
| Cars module (CRUD, availability) | ✅ Complete |
| Rentals module (CRUD, cancel) | ✅ Complete |
| Users module (profile) | ✅ Complete |
| Admin module (dashboard, rentals) | ✅ Complete |
| Super Admin module (agencies, users) | ✅ Complete |
| TypeScript types | ✅ Complete |
| Auto token refresh | ✅ Complete |
| Account deactivation/reactivation | ✅ Complete |

### ✅ Phase 3: Admin Frontend (COMPLETE)

| Page | Status | Features |
|------|--------|----------|
| Login | ✅ Complete | Admin/SuperAdmin authentication, deactivation alerts |
| Admin Dashboard | ✅ Complete | Stats cards, recent rentals |
| Cars List | ✅ Complete | Table, search, filters |
| Car Create/Edit | ✅ Complete | Form validation |
| Car Details | ✅ Complete | View car info |
| Car Availability | ✅ Complete | Calendar with range selection |
| Rentals List | ✅ Complete | Status filters, pagination |
| Rental Details | ✅ Complete | Status update actions |
| Profile | ✅ Complete | View/edit profile, danger zone |

### ✅ Phase 4: Super Admin Frontend (COMPLETE)

| Page | Status | Features |
|------|--------|----------|
| Dashboard | ✅ Complete | Global platform stats |
| Agencies List | ✅ Complete | All agencies table |
| Agency Create | ✅ Complete | Create with admin assignment |
| Agency Details | ✅ Complete | Edit, view stats, cars, admins |
| Admins List | ✅ Complete | All admin users table, status toggle |
| Admin Details | ✅ Complete | Assign/change agency, activate/deactivate |
| Create Admin | ✅ Complete | Create new admin user |
| All Rentals | ✅ Complete | Platform-wide rentals view |
| Profile | ✅ Complete | View/edit profile |

---

### ✅ Phase 5: Account Lifecycle Management (COMPLETE)

| Feature | Status | Description |
|---------|--------|-------------|
| Account Deactivation | ✅ Complete | Soft-delete with `deactivatedAt` timestamp |
| Login Gate | ✅ Complete | Block deactivated users at login and JWT validation |
| Active Rental Check | ✅ Complete | Prevent deactivation with ongoing/reserved rentals |
| Admin Self-Deactivation | ✅ Complete | Profile danger zone with confirmation |
| Client Self-Reactivation | ✅ Complete | Reactivate from login page (self-deactivated only) |
| SuperAdmin Status Mgmt | ✅ Complete | Activate/deactivate admins with agency sync |
| Query Filtering | ✅ Complete | Hide deactivated agency cars from clients |
| Cascade Delete Protection | ✅ Complete | Rental.client uses `onDelete: Restrict` |

---

## 🚧 Pending Features (Post-MVP)

### Phase 6: Client Portal (NOT STARTED)

| Feature | Priority | Description |
|---------|----------|-------------|
| Client Login | High | Client authentication page |
| Client Register | High | New client registration with validation |
| Browse Cars | High | Public car catalog with filters |
| Car Details | High | View car info, availability calendar |
| Book Rental | High | Multi-step booking wizard |
| My Rentals | High | View ongoing and past rentals |
| Cancel Rental | Medium | Cancel reserved rentals |
| Profile Management | Medium | Update profile, change password |

### Phase 7: Enhanced Features (NOT STARTED)

| Feature | Priority | Description |
|---------|----------|-------------|
| Email Verification | Medium | Verify email on registration |
| Password Reset | Medium | Forgot password flow |
| Notifications | Low | In-app notifications |
| Payment Integration | Low | Online payment processing |
| Parking Management | Low | Manage parking locations |
| Maintenance Tracking | Low | Vehicle maintenance records |
| Reports & Analytics | Low | Advanced reporting |
| Multi-language | Low | i18n support |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 1.22+
- PostgreSQL 14+

### Installation

```bash
# Clone the repository
git clone https://github.com/Berthonge21/BTHG-Rental-Car-2.git
cd BTHG-Rental-Car-2

# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your database credentials

# Push schema to database
yarn db:push

# Seed test data
yarn db:seed
```

### Running the Backend

```bash
# Development mode
yarn dev:api

# Production build
yarn build
```

- API: http://localhost:4000/api/v1
- Swagger Docs: http://localhost:4000/api/docs

### Running the Frontend

```bash
# Clone frontend repository
git clone https://github.com/Berthonge21/bthg-rental-web.git
cd bthg-rental-web

# Install dependencies
yarn install

# Start development server
yarn dev
```

- Frontend: http://localhost:3000

---

## API Endpoints

### Authentication (7 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Client login | Public |
| POST | `/auth/admin/login` | Admin/SuperAdmin login | Public |
| POST | `/auth/register` | Register new client | Public |
| POST | `/auth/reactivate` | Reactivate self-deactivated client account | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| GET | `/auth/me` | Get current user profile | Authenticated |
| POST | `/auth/logout` | Logout (client-side) | Authenticated |

### Agencies (7 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/agencies` | List all agencies | Public |
| GET | `/agencies/:id` | Get agency details | Public |
| POST | `/agencies` | Create new agency | SuperAdmin |
| PUT | `/agencies/:id` | Update agency | SuperAdmin |
| DELETE | `/agencies/:id` | Delete agency | SuperAdmin |
| GET | `/agencies/:id/cars` | List agency cars | Public |
| GET | `/agencies/:id/stats` | Get agency statistics | Admin |

### Cars (9 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/cars` | List all cars | Public |
| GET | `/cars/:id` | Get car details | Public |
| POST | `/cars` | Create new car | Admin |
| PUT | `/cars/:id` | Update car | Admin |
| DELETE | `/cars/:id` | Delete car | Admin |
| GET | `/cars/:id/availability` | Check car availability | Public |
| GET | `/cars/:id/availability/calendar` | Get availability calendar | Public |
| POST | `/cars/:id/availability/block` | Block dates | Admin |
| POST | `/cars/:id/availability/unblock` | Unblock dates | Admin |

### Rentals (5 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/rentals` | List user's rentals | Client |
| GET | `/rentals/:id` | Get rental details | Client |
| POST | `/rentals` | Create new rental | Client |
| PATCH | `/rentals/:id` | Update rental | Client |
| DELETE | `/rentals/:id` | Cancel rental | Client |

### Users (3 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users/me` | Get user profile | Authenticated |
| PATCH | `/users/me` | Update user profile | Authenticated |
| POST | `/users/me/deactivate` | Deactivate own account | Authenticated |

### Admin Dashboard (4 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/dashboard` | Agency dashboard stats | Admin |
| GET | `/admin/rentals` | List agency rentals | Admin |
| GET | `/admin/rentals/:id` | Get rental details | Admin |
| PATCH | `/admin/rentals/:id` | Update rental status | Admin |

### Super Admin (7 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/super-admin/dashboard` | Global platform stats | SuperAdmin |
| GET | `/super-admin/agencies` | List all agencies | SuperAdmin |
| GET | `/super-admin/rentals` | List all rentals | SuperAdmin |
| GET | `/super-admin/users` | List all admin users | SuperAdmin |
| POST | `/super-admin/users` | Create admin user | SuperAdmin |
| PATCH | `/super-admin/users/:id/agency` | Assign admin to agency | SuperAdmin |
| PATCH | `/super-admin/users/:id/status` | Activate/deactivate admin | SuperAdmin |

---

## SDK Package

### Installation

```bash
# In your project
npm install @bthgrentalcar/sdk
# or
yarn add @bthgrentalcar/sdk
```

### Usage

```typescript
import { ApiClient } from '@bthgrentalcar/sdk';

// Initialize client
const api = new ApiClient({
  baseURL: 'http://localhost:4000/api/v1',
});

// Authentication
const { accessToken, user } = await api.auth.loginAdmin(email, password);

// Set token for subsequent requests
api.setAccessToken(accessToken);

// Use API modules
const dashboard = await api.admin.getDashboard();
const cars = await api.cars.list({ page: 1, limit: 10 });
const rental = await api.admin.getRental(rentalId);
```

### Available Modules

| Module | Methods |
|--------|---------|
| `api.auth` | `login`, `loginAdmin`, `register`, `reactivateAccount`, `refresh`, `me`, `logout` |
| `api.agencies` | `list`, `get`, `create`, `update`, `delete`, `getCars`, `getStats` |
| `api.cars` | `list`, `get`, `create`, `update`, `delete`, `checkAvailability`, `getCalendar`, `blockDates`, `unblockDates` |
| `api.rentals` | `list`, `get`, `create`, `update`, `cancel` |
| `api.users` | `getProfile`, `updateProfile`, `deactivateAccount` |
| `api.admin` | `getDashboard`, `getRentals`, `getRental`, `updateRentalStatus` |
| `api.superAdmin` | `getDashboard`, `getAgencies`, `getRentals`, `getUsers`, `createUser`, `assignAgency`, `updateUserStatus` |

---

## Frontend Application

### Repository

https://github.com/Berthonge21/bthg-rental-web

### Features

- **Admin Portal**: Agency management, car fleet, rentals, availability, account deactivation
- **Super Admin Portal**: Platform oversight, agencies, admin users, status management
- **Modern UI**: Chakra UI with dark mode support
- **Type-Safe**: Full TypeScript with SDK integration
- **Responsive**: Mobile-friendly design

---

## Test Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | superadmin@bthgrentalcar.com | Admin@123 |
| Admin | admin@bthgrentalcar.com | Admin@123 |

---

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
DATABASE_URL="postgresql://user:password@localhost:5432/bthgrentalcar"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGINS="http://localhost:3000"
SWAGGER_ENABLED=true

# Supabase Storage — used for car photos and profile avatars (StorageModule).
# Find both under Project Settings > API in the Supabase dashboard. Uploads
# are disabled (with a clear error) until both are set.
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="replace-with-the-service_role-key"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Scripts

### Backend

```bash
yarn dev:api          # Start API in dev mode
yarn build            # Build all packages
yarn db:generate      # Generate Prisma client
yarn db:push          # Push schema to database
yarn db:seed          # Seed test data
yarn db:studio        # Open Prisma Studio
yarn lint             # Run ESLint
```

### Frontend

```bash
yarn dev              # Start dev server
yarn build            # Production build
yarn lint             # Run ESLint
```

---

## Roadmap

### MVP (COMPLETE)
- [x] Backend API with all core endpoints
- [x] TypeScript SDK package
- [x] Admin dashboard (cars, rentals, availability)
- [x] Super admin dashboard (agencies, admins)
- [x] Account deactivation & reactivation lifecycle
- [x] Login gate enforcement for deactivated accounts
- [x] SuperAdmin admin status management

### Upcoming - Client Portal
- [ ] Client authentication (login, register)
- [ ] Car browsing catalog
- [ ] Rental booking flow
- [ ] Rental history

### Upcoming - Enhanced Features
- [ ] Email verification
- [ ] Password reset
- [ ] Notifications system
- [ ] Payment integration

### Future - Advanced Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Multi-language support

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private - All rights reserved

## Author

BTHG Development Team
