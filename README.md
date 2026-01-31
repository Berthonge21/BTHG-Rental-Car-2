# BTHG Rental Car API

A multi-agency car rental platform backend built with NestJS, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** NestJS 10.x
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with refresh tokens
- **Documentation:** Swagger/OpenAPI
- **Package Manager:** pnpm
- **Monorepo:** Turborepo

## Project Structure

```
BTHG-Rental-Car-2/
├── apps/
│   └── api/                    # NestJS Backend API
│       └── src/
│           ├── common/         # Shared utilities, decorators, filters
│           ├── config/         # App configuration
│           ├── modules/        # Feature modules
│           │   ├── auth/       # Authentication & authorization
│           │   ├── agencies/   # Agency management
│           │   ├── cars/       # Car management
│           │   ├── rentals/    # Rental management
│           │   ├── users/      # User profile management
│           │   ├── admin/      # Agency admin dashboard
│           │   └── super-admin/# Platform-wide management
│           └── prisma/         # Database service
├── packages/
│   └── database/               # Shared Prisma schema & client
└── docs/                       # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

```bash
# Clone the repository
git clone https://github.com/Berthonge21/BTHG-Rental-Car-2.git
cd BTHG-Rental-Car-2

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your database credentials

# Push schema to database
pnpm db:push

# Seed admin users (optional)
cd packages/database && npx ts-node seed-admin.ts
```

### Running the API

```bash
# Development mode
pnpm dev:api

# Production build
pnpm build
cd apps/api && node dist/main.js
```

The API will be available at `http://localhost:4000/api/v1`

### Swagger Documentation

Access the interactive API documentation at: `http://localhost:4000/api/docs`

## Environment Variables

```env
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
DATABASE_URL="postgresql://user:password@localhost:5432/automobelite"
JWT_SECRET="your-super-secret-key"
CORS_ORIGINS="http://localhost:3000"
SWAGGER_ENABLED=true
```

## API Endpoints

### Authentication (6 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Client login | Public |
| POST | `/auth/admin/login` | Admin/SuperAdmin login | Public |
| POST | `/auth/register` | Register new client | Public |
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

### Cars (6 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/cars` | List all cars | Public |
| GET | `/cars/:id` | Get car details | Public |
| GET | `/cars/:id/availability` | Check car availability | Public |
| POST | `/cars` | Create new car | Admin |
| PUT | `/cars/:id` | Update car | Admin |
| DELETE | `/cars/:id` | Delete car | Admin |

### Rentals (5 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/rentals` | List user's rentals | Client |
| GET | `/rentals/:id` | Get rental details | Client |
| POST | `/rentals` | Create new rental | Client |
| PATCH | `/rentals/:id` | Update rental | Client |
| DELETE | `/rentals/:id` | Cancel rental | Client |

### Users (2 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users/me` | Get user profile | Client |
| PATCH | `/users/me` | Update user profile | Client |

### Admin Dashboard (3 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/dashboard` | Agency dashboard stats | Admin |
| GET | `/admin/rentals` | List agency rentals | Admin |
| PATCH | `/admin/rentals/:id` | Update rental status | Admin |

### Super Admin (6 endpoints)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/super-admin/dashboard` | Global platform stats | SuperAdmin |
| GET | `/super-admin/agencies` | List all agencies | SuperAdmin |
| GET | `/super-admin/rentals` | List all rentals | SuperAdmin |
| GET | `/super-admin/users` | List all admin users | SuperAdmin |
| POST | `/super-admin/users` | Create admin user | SuperAdmin |
| PATCH | `/super-admin/users/:id/agency` | Assign admin to agency | SuperAdmin |

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Regular client | Book rentals, manage own profile |
| `admin` | Agency administrator | Manage agency cars, view/update agency rentals |
| `superAdmin` | Platform administrator | Full access, manage agencies and admin users |

## Authentication

The API uses JWT-based authentication with access and refresh tokens.

### Request Headers

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token:** Valid for 1 hour
- **Refresh Token:** Valid for 7 days

### Example Login Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John",
    "firstname": "Doe",
    "role": "user"
  }
}
```

## Data Models

### Client
```typescript
{
  id: number
  name: string
  firstname: string
  email: string
  telephone: string
  numPermis: string      // Driver's license number
  address: string
  city: string
  image?: string
  role: 'user'
  status: 'activate' | 'deactivate'
}
```

### Agency
```typescript
{
  id: number
  name: string
  address: string
  email: string
  telephone: string
  responsibleId: number  // Admin user ID
  image?: string
  status: 'activate' | 'deactivate'
}
```

### Car
```typescript
{
  id: number
  agencyId: number
  brand: string
  model: string
  year: number
  mileage: number
  price: number          // Price per day
  registration: string
  fuel: string
  door: number
  gearBox: string
  description?: string
  image?: string
}
```

### Rental
```typescript
{
  id: number
  clientId: number
  carId: number
  startDate: Date
  endDate: Date
  startTime: Date
  endTime: Date
  total: number          // Auto-calculated if not provided
  status: 'reserved' | 'ongoing' | 'completed' | 'cancelled'
}
```

## Response Formats

### Paginated List Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/rentals",
  "method": "POST",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Business Rules

### Rental Creation
- Start date must be in the future
- End date must be after start date
- Car must be available for the requested dates
- Total is auto-calculated: `car.price × number_of_days`

### Rental Cancellation
- Only `reserved` rentals can be cancelled by clients
- `ongoing` or `completed` rentals cannot be cancelled

### Revenue Tracking
- Revenue is only counted for `completed` rentals
- Monthly revenue tracks completions within the current month

### Agency Isolation
- Admins can only manage cars/rentals for their assigned agency
- SuperAdmins have access to all agencies

## Test Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | superadmin@automobelite.com | Admin@123 |
| Admin | admin@automobelite.com | Admin@123 |

## Scripts

```bash
# Development
pnpm dev:api          # Start API in dev mode with hot reload

# Build
pnpm build            # Build all packages

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio

# Linting
pnpm lint             # Run ESLint
```

## License

Private - All rights reserved

## Author

BTHG Development Team
