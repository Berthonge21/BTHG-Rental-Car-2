# Building a TypeScript SDK from Scratch

A complete step-by-step guide to building a TypeScript SDK for your REST API. This tutorial explains every concept in detail so even beginners can follow along.

## Table of Contents

1. [What is an SDK?](#1-what-is-an-sdk)
2. [Why Build an SDK?](#2-why-build-an-sdk)
3. [Prerequisites](#3-prerequisites)
4. [Project Setup](#4-project-setup)
5. [Understanding the Folder Structure](#5-understanding-the-folder-structure)
6. [Step 1: Initialize the Package](#step-1-initialize-the-package)
7. [Step 2: Configure TypeScript](#step-2-configure-typescript)
8. [Step 3: Configure the Build Tool](#step-3-configure-the-build-tool)
9. [Step 4: Create Type Definitions](#step-4-create-type-definitions)
10. [Step 5: Create the API Client](#step-5-create-the-api-client)
11. [Step 6: Create API Modules](#step-6-create-api-modules)
12. [Step 7: Export Everything](#step-7-export-everything)
13. [Step 8: Build the SDK](#step-8-build-the-sdk)
14. [Step 9: Use the SDK](#step-9-use-the-sdk)
15. [Advanced Topics](#advanced-topics)
16. [Complete Code Reference](#complete-code-reference)

---

## 1. What is an SDK?

**SDK** stands for **Software Development Kit**. Think of it as a toolbox that makes it easier for developers to interact with your API.

### Without an SDK (Raw HTTP Requests)

```typescript
// Every time you want to call the API, you write this:
const response = await fetch('http://localhost:4000/api/v1/cars', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const cars = await response.json();
```

### With an SDK

```typescript
// Much cleaner and easier:
const cars = await api.cars.list();
```

The SDK handles:
- Building the correct URL
- Adding authentication headers
- Parsing the response
- Type safety (knowing what data you'll get back)
- Error handling

---

## 2. Why Build an SDK?

| Benefit | Explanation |
|---------|-------------|
| **Type Safety** | TypeScript tells you exactly what data you'll receive |
| **Autocomplete** | Your IDE suggests available methods and parameters |
| **Consistency** | Same code works on web, mobile, and server |
| **Less Errors** | No typos in URLs or missing headers |
| **Easier Maintenance** | Change API logic in one place |
| **Better DX** | Developer Experience is much improved |

---

## 3. Prerequisites

Before starting, make sure you have:

- **Node.js 18+** installed ([download](https://nodejs.org))
- **A code editor** (VS Code recommended)
- **Basic TypeScript knowledge** (variables, functions, types)
- **An existing REST API** to connect to

Check your Node.js version:
```bash
node --version
# Should show v18.x.x or higher
```

---

## 4. Project Setup

### 4.1 Create the SDK Folder

In your project, create a folder for the SDK:

```bash
mkdir -p packages/sdk
cd packages/sdk
```

### 4.2 Why "packages" Folder?

In a **monorepo** (multiple packages in one repository), we organize code into a `packages` folder. This lets us:
- Keep the SDK separate from the API
- Share the SDK between web and mobile apps
- Version and publish the SDK independently

---

## 5. Understanding the Folder Structure

Here's what we'll create:

```
packages/sdk/
├── src/                    # Source code (TypeScript)
│   ├── client.ts           # Main API client class
│   ├── modules/            # API endpoint modules
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── cars.ts         # Car endpoints
│   │   ├── rentals.ts      # Rental endpoints
│   │   ├── agencies.ts     # Agency endpoints
│   │   ├── users.ts        # User endpoints
│   │   ├── admin.ts        # Admin endpoints
│   │   └── super-admin.ts  # Super admin endpoints
│   ├── types/              # TypeScript type definitions
│   │   ├── common.ts       # Shared types (pagination, etc.)
│   │   ├── auth.ts         # Auth-related types
│   │   ├── car.ts          # Car types
│   │   ├── rental.ts       # Rental types
│   │   ├── agency.ts       # Agency types
│   │   ├── user.ts         # User types
│   │   ├── admin.ts        # Admin types
│   │   └── index.ts        # Re-export all types
│   ├── errors.ts           # Custom error classes
│   └── index.ts            # Main entry point
├── dist/                   # Compiled JavaScript (generated)
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
└── tsup.config.ts          # Build tool configuration
```

### What Each File Does

| File/Folder | Purpose |
|-------------|---------|
| `src/` | Contains all TypeScript source code |
| `client.ts` | The main class that users import |
| `modules/` | Each file handles one API resource (cars, rentals, etc.) |
| `types/` | TypeScript interfaces describing data shapes |
| `errors.ts` | Custom error classes for better error handling |
| `index.ts` | Entry point that exports everything public |
| `dist/` | Compiled JavaScript (created by build) |
| `package.json` | NPM package configuration |
| `tsconfig.json` | TypeScript compiler settings |
| `tsup.config.ts` | Build tool settings |

---

## Step 1: Initialize the Package

### 1.1 Create package.json

Create the file `packages/sdk/package.json`:

```json
{
  "name": "@bthgrentalcar/sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for BTHG Rental Car API",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  },
  "keywords": [
    "sdk",
    "api",
    "rental",
    "car"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

### 1.2 Understanding package.json Fields

Let's break down each important field:

```json
{
  "name": "@bthgrentalcar/sdk"
}
```
- **name**: The package name. The `@bthgrentalcar/` prefix is a "scope" (like a namespace)
- Users will install with: `npm install @bthgrentalcar/sdk`

```json
{
  "version": "0.1.0"
}
```
- **version**: Follows [Semantic Versioning](https://semver.org/)
- `0.1.0` = Initial development version
- `1.0.0` = First stable release

```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```
- **main**: Entry point for CommonJS (`require()`)
- **module**: Entry point for ES Modules (`import`)
- **types**: TypeScript type definitions

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```
- **exports**: Modern way to define entry points
- Supports both `import` and `require` syntax

```json
{
  "files": ["dist"]
}
```
- **files**: Only include `dist/` folder when publishing
- Keeps the package small (no source code)

### 1.3 Install Dependencies

```bash
cd packages/sdk
pnpm install
# or: npm install
# or: yarn install
```

### 1.4 Why Axios?

We use **Axios** as our HTTP client instead of `fetch` because:

| Feature | Axios | Fetch |
|---------|-------|-------|
| Request/Response interceptors | ✅ Built-in | ❌ Manual |
| Automatic JSON parsing | ✅ Built-in | ❌ Manual |
| Error handling | ✅ Better | ❌ Basic |
| Request cancellation | ✅ Easy | ⚠️ Complex |
| Timeout support | ✅ Built-in | ❌ Manual |
| Upload progress | ✅ Built-in | ❌ Not available |

---

## Step 2: Configure TypeScript

### 2.1 Create tsconfig.json

Create the file `packages/sdk/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.2 Understanding Key Options

| Option | Value | What It Does |
|--------|-------|--------------|
| `target` | `ES2020` | Compile to modern JavaScript |
| `module` | `ESNext` | Use modern ES modules |
| `declaration` | `true` | Generate `.d.ts` type files |
| `strict` | `true` | Enable all strict type checks |
| `esModuleInterop` | `true` | Better compatibility with CommonJS |
| `outDir` | `./dist` | Where to put compiled files |
| `rootDir` | `./src` | Where source files are |

---

## Step 3: Configure the Build Tool

### 3.1 What is tsup?

**tsup** is a zero-config bundler for TypeScript. It:
- Compiles TypeScript to JavaScript
- Creates both CommonJS and ES Module versions
- Generates type definition files
- Is much faster than alternatives

### 3.2 Create tsup.config.ts

Create the file `packages/sdk/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
});
```

### 3.3 Understanding tsup Options

| Option | Value | What It Does |
|--------|-------|--------------|
| `entry` | `['src/index.ts']` | The main file to compile |
| `format` | `['cjs', 'esm']` | Output both CommonJS and ES Modules |
| `dts` | `true` | Generate TypeScript declaration files |
| `splitting` | `false` | Don't split into multiple files |
| `sourcemap` | `true` | Generate source maps for debugging |
| `clean` | `true` | Delete `dist/` before each build |
| `minify` | `false` | Don't minify (keep readable) |

---

## Step 4: Create Type Definitions

Types are the foundation of our SDK. They describe the shape of data we send and receive.

### 4.1 Create Common Types

Create `packages/sdk/src/types/common.ts`:

```typescript
/**
 * Status for entities (agencies, users, etc.)
 * - 'activate': Entity is active and operational
 * - 'deactivate': Entity is disabled/suspended
 */
export type Status = 'activate' | 'deactivate';

/**
 * User roles in the system
 * - 'user': Regular client who can book rentals
 * - 'admin': Agency administrator
 * - 'superAdmin': Platform administrator
 */
export type UserRole = 'user' | 'admin' | 'superAdmin';

/**
 * Rental status progression
 * reserved -> ongoing -> completed
 *         \-> cancelled
 */
export type RentalStatus = 'reserved' | 'ongoing' | 'completed' | 'cancelled';

/**
 * Query parameters for paginated endpoints
 *
 * @example
 * // Get page 2 with 20 items per page
 * const query: PaginationQuery = { page: 2, limit: 20 };
 */
export interface PaginationQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Metadata returned with paginated responses
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Is there a previous page? */
  hasPrevious: boolean;
  /** Is there a next page? */
  hasNext: boolean;
}

/**
 * Standard paginated response wrapper
 *
 * @template T - The type of items in the data array
 *
 * @example
 * // Response for a list of cars
 * const response: PaginatedResponse<Car> = {
 *   data: [{ id: 1, brand: 'Toyota', ... }],
 *   meta: { page: 1, limit: 10, total: 50, ... }
 * };
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}
```

### 4.2 Create Auth Types

Create `packages/sdk/src/types/auth.ts`:

```typescript
import type { UserRole, Status } from './common';

/**
 * Data required to log in
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Data required to register a new client
 */
export interface RegisterDto {
  name: string;
  firstname: string;
  email: string;
  password: string;
  telephone: string;
  numPermis: string;  // Driver's license number
  address: string;
  city: string;
}

/**
 * Data returned after successful login
 */
export interface AuthResponse {
  /** JWT access token (short-lived, ~1 hour) */
  accessToken: string;
  /** JWT refresh token (long-lived, ~7 days) */
  refreshToken: string;
  /** The authenticated user's data */
  user: User;
}

/**
 * Represents a user in the system
 */
export interface User {
  id: number;
  name: string;
  firstname: string;
  email: string;
  telephone: string;
  role: UserRole;
  status: Status;
  image?: string;
  /** Only for admin users - their assigned agency */
  agencyId?: number;
  agency?: {
    id: number;
    name: string;
  };
}

/**
 * Request body for refreshing access token
 */
export interface RefreshTokenDto {
  refreshToken: string;
}
```

### 4.3 Create Car Types

Create `packages/sdk/src/types/car.ts`:

```typescript
import type { PaginationQuery } from './common';

/**
 * Data required to create a new car
 */
export interface CreateCarDto {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;         // Price per day
  registration: string;  // License plate
  fuel: string;          // 'petrol', 'diesel', 'electric', 'hybrid'
  door: number;          // Number of doors
  gearBox: string;       // 'manual', 'automatic'
  description?: string;
  image?: string;
  agencyId?: number;     // Required for super admin
}

/**
 * Data for updating an existing car
 * All fields are optional - only send what you want to change
 */
export interface UpdateCarDto {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  registration?: string;
  fuel?: string;
  door?: number;
  gearBox?: string;
  description?: string;
  image?: string;
}

/**
 * Query parameters for listing cars
 */
export interface CarQueryDto extends PaginationQuery {
  /** Filter by agency ID */
  agencyId?: number;
  /** Filter by brand (partial match) */
  brand?: string;
  /** Filter by fuel type */
  fuel?: string;
  /** Minimum price per day */
  minPrice?: number;
  /** Maximum price per day */
  maxPrice?: number;
}

/**
 * Represents a car in the system
 */
export interface Car {
  id: number;
  agencyId: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  registration: string;
  fuel: string;
  door: number;
  gearBox: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  Agency?: {
    id: number;
    name: string;
  };
}

/**
 * Request to check car availability
 */
export interface CheckAvailabilityDto {
  startDate: string;  // ISO date string: '2024-03-01'
  endDate: string;    // ISO date string: '2024-03-05'
}

/**
 * Response from availability check
 */
export interface AvailabilityResponse {
  available: boolean;
  conflictingDates?: string[];
}

/**
 * A single blocked date entry
 */
export interface BlockedDate {
  id: number;
  carId: number;
  date: string;
  reason?: string;
}

/**
 * Monthly availability calendar
 */
export interface AvailabilityCalendar {
  carId: number;
  year: number;
  month: number;
  blockedDates: BlockedDate[];
  rentals: {
    id: number;
    startDate: string;
    endDate: string;
    status: string;
  }[];
  stats: {
    totalDays: number;
    availableDays: number;
    rentalBlockedDays: number;
    manuallyBlockedDays: number;
  };
}

/**
 * Request to block dates
 */
export interface BlockDatesDto {
  dates: string[];    // Array of ISO date strings
  reason?: string;    // Optional reason for blocking
}
```

### 4.4 Create Rental Types

Create `packages/sdk/src/types/rental.ts`:

```typescript
import type { PaginationQuery, RentalStatus } from './common';
import type { Car } from './car';
import type { User } from './auth';

/**
 * Data required to create a rental
 */
export interface CreateRentalDto {
  carId: number;
  startDate: string;   // ISO date: '2024-03-01'
  endDate: string;     // ISO date: '2024-03-05'
  startTime: string;   // ISO datetime: '2024-03-01T09:00:00'
  endTime: string;     // ISO datetime: '2024-03-05T17:00:00'
  total?: number;      // Optional - auto-calculated if not provided
}

/**
 * Data for updating a rental
 */
export interface UpdateRentalDto {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * Data for admin to update rental status
 */
export interface UpdateRentalStatusDto {
  status: RentalStatus;
}

/**
 * Query parameters for listing rentals
 */
export interface RentalQueryDto extends PaginationQuery {
  status?: RentalStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Represents a rental in the system
 */
export interface Rental {
  id: number;
  clientId: number;
  carId: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  total: number;
  status: RentalStatus;
  createdAt: string;
  updatedAt: string;
  car?: Car;
  client?: Pick<User, 'id' | 'firstname' | 'name' | 'email' | 'telephone'>;
}
```

### 4.5 Create Agency Types

Create `packages/sdk/src/types/agency.ts`:

```typescript
import type { PaginationQuery, Status } from './common';

/**
 * Data required to create an agency
 */
export interface CreateAgencyDto {
  name: string;
  address: string;
  email: string;
  telephone: string;
  responsibleId: number;  // Admin user ID to assign
  image?: string;
  status?: Status;
}

/**
 * Data for updating an agency
 */
export interface UpdateAgencyDto {
  name?: string;
  address?: string;
  email?: string;
  telephone?: string;
  image?: string;
  status?: Status;
}

/**
 * Query parameters for listing agencies
 */
export interface AgencyQueryDto extends PaginationQuery {
  status?: Status;
  search?: string;  // Search in name, email
}

/**
 * Represents an agency
 */
export interface Agency {
  id: number;
  name: string;
  address: string;
  email: string;
  telephone: string;
  responsibleId: number;
  image?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agency statistics for dashboard
 */
export interface AgencyStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  totalRevenue: number;
}
```

### 4.6 Create Admin Types

Create `packages/sdk/src/types/admin.ts`:

```typescript
/**
 * Dashboard statistics for agency admin
 */
export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  completedRentals: number;
  totalRevenue: number;
  monthlyRevenue: number;
}
```

### 4.7 Create Super Admin Types

Create `packages/sdk/src/types/super-admin.ts`:

```typescript
import type { UserRole, Status } from './common';

/**
 * Global platform statistics
 */
export interface GlobalStats {
  totalAgencies: number;
  activeAgencies: number;
  totalCars: number;
  totalRentals: number;
  totalRevenue: number;
  totalUsers: number;
  totalAdmins: number;
}

/**
 * Data to create a new admin user
 */
export interface CreateAdminDto {
  name: string;
  firstname: string;
  email: string;
  password: string;
  telephone: string;
  role: 'admin' | 'superAdmin';
  agencyId?: number;  // Optional agency assignment
}

/**
 * Data to assign admin to agency
 */
export interface AssignAgencyDto {
  agencyId: number;
}
```

### 4.8 Create Types Index

Create `packages/sdk/src/types/index.ts` to re-export all types:

```typescript
// Re-export all types from a single location
// Users can import like: import { Car, Rental, User } from '@bthgrentalcar/sdk';

export * from './common';
export * from './auth';
export * from './car';
export * from './rental';
export * from './agency';
export * from './admin';
export * from './super-admin';
```

---

## Step 5: Create the API Client

The API client is the main class that users interact with.

### 5.1 Create Error Classes

First, create custom error classes in `packages/sdk/src/errors.ts`:

```typescript
/**
 * Base error for all API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';

    // This is needed for instanceof to work correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error for authentication failures (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error for permission denied (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error for resource not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error for validation failures (400)
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

### 5.2 Create the Main Client

Create `packages/sdk/src/client.ts`:

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from './errors';

// Import all modules (we'll create these next)
import { AuthModule } from './modules/auth';
import { CarsModule } from './modules/cars';
import { RentalsModule } from './modules/rentals';
import { AgenciesModule } from './modules/agencies';
import { UsersModule } from './modules/users';
import { AdminModule } from './modules/admin';
import { SuperAdminModule } from './modules/super-admin';

/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
  /** Base URL of the API (e.g., 'http://localhost:4000/api/v1') */
  baseURL: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Optional initial access token */
  accessToken?: string;
  /** Optional initial refresh token */
  refreshToken?: string;
  /** Callback when tokens are refreshed */
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  /** Callback when authentication fails completely */
  onAuthFailure?: () => void;
}

/**
 * Main API Client class
 *
 * @example
 * ```typescript
 * const api = new ApiClient({
 *   baseURL: 'http://localhost:4000/api/v1',
 * });
 *
 * // Login
 * const { accessToken, user } = await api.auth.loginAdmin(email, password);
 * api.setAccessToken(accessToken);
 *
 * // Now use authenticated endpoints
 * const cars = await api.cars.list();
 * ```
 */
export class ApiClient {
  /** The underlying Axios instance */
  private http: AxiosInstance;

  /** Current access token */
  private accessToken: string | null = null;

  /** Current refresh token */
  private refreshToken: string | null = null;

  /** Is a token refresh currently in progress? */
  private isRefreshing = false;

  /** Queue of requests waiting for token refresh */
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  /** Configuration options */
  private config: ApiClientConfig;

  // API Modules - these provide the actual methods
  public readonly auth: AuthModule;
  public readonly cars: CarsModule;
  public readonly rentals: RentalsModule;
  public readonly agencies: AgenciesModule;
  public readonly users: UsersModule;
  public readonly admin: AdminModule;
  public readonly superAdmin: SuperAdminModule;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.accessToken = config.accessToken || null;
    this.refreshToken = config.refreshToken || null;

    // Create Axios instance with base configuration
    this.http = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set up request interceptor (adds auth header)
    this.setupRequestInterceptor();

    // Set up response interceptor (handles errors, token refresh)
    this.setupResponseInterceptor();

    // Initialize all modules, passing the Axios instance
    this.auth = new AuthModule(this.http);
    this.cars = new CarsModule(this.http);
    this.rentals = new RentalsModule(this.http);
    this.agencies = new AgenciesModule(this.http);
    this.users = new UsersModule(this.http);
    this.admin = new AdminModule(this.http);
    this.superAdmin = new SuperAdminModule(this.http);
  }

  /**
   * Set the access token for authenticated requests
   * Call this after login or when restoring a session
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set the refresh token for token renewal
   */
  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  /**
   * Set both tokens at once
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated (has a token)
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Request interceptor: Adds Authorization header to every request
   */
  private setupRequestInterceptor(): void {
    this.http.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // If we have a token, add it to the request
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Response interceptor: Handles errors and automatic token refresh
   */
  private setupResponseInterceptor(): void {
    this.http.interceptors.response.use(
      // Success: just return the response
      (response) => response,

      // Error: handle different cases
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't retry refresh endpoint itself
          if (originalRequest.url?.includes('/auth/refresh')) {
            this.config.onAuthFailure?.();
            return Promise.reject(new UnauthorizedError('Session expired'));
          }

          // If we have a refresh token, try to refresh
          if (this.refreshToken) {
            // If already refreshing, queue this request
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.refreshQueue.push({
                  resolve: (token: string) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(this.http(originalRequest));
                  },
                  reject,
                });
              });
            }

            // Start refreshing
            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              // Call refresh endpoint
              const response = await this.http.post('/auth/refresh', {
                refreshToken: this.refreshToken,
              });

              const { accessToken, refreshToken } = response.data;

              // Update tokens
              this.accessToken = accessToken;
              this.refreshToken = refreshToken;

              // Notify callback if provided
              this.config.onTokenRefresh?.({ accessToken, refreshToken });

              // Process queued requests
              this.refreshQueue.forEach(({ resolve }) => resolve(accessToken));
              this.refreshQueue = [];

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.http(originalRequest);
            } catch (refreshError) {
              // Refresh failed, reject all queued requests
              this.refreshQueue.forEach(({ reject }) =>
                reject(new UnauthorizedError('Session expired'))
              );
              this.refreshQueue = [];
              this.clearTokens();
              this.config.onAuthFailure?.();
              return Promise.reject(new UnauthorizedError('Session expired'));
            } finally {
              this.isRefreshing = false;
            }
          }
        }

        // Convert Axios errors to our custom errors
        throw this.handleError(error);
      }
    );
  }

  /**
   * Convert Axios errors to typed SDK errors
   */
  private handleError(error: AxiosError): ApiError {
    const status = error.response?.status || 500;
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    const message = data?.message || data?.error || error.message || 'An error occurred';

    switch (status) {
      case 400:
        return new ValidationError(message, data);
      case 401:
        return new UnauthorizedError(message);
      case 403:
        return new ForbiddenError(message);
      case 404:
        return new NotFoundError(message);
      default:
        return new ApiError(message, status);
    }
  }
}
```

### 5.3 Understanding Interceptors

**Interceptors** are middleware for HTTP requests/responses:

```
Request Flow:
┌─────────────┐    ┌─────────────────────┐    ┌─────────────┐
│ Your Code   │───►│ Request Interceptor │───►│   Server    │
│ api.cars()  │    │ (adds Auth header)  │    │             │
└─────────────┘    └─────────────────────┘    └─────────────┘

Response Flow:
┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐
│   Server    │───►│ Response Interceptor │───►│ Your Code   │
│             │    │ (handles errors,     │    │ gets data   │
└─────────────┘    │  refreshes tokens)   │    └─────────────┘
                   └──────────────────────┘
```

---

## Step 6: Create API Modules

Each module handles one API resource. They all follow the same pattern.

### 6.1 Auth Module

Create `packages/sdk/src/modules/auth.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  User,
  RefreshTokenDto,
} from '../types';

/**
 * Authentication module
 * Handles login, registration, and token management
 */
export class AuthModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Login as a client (regular user)
   *
   * @param email - User's email
   * @param password - User's password
   * @returns Authentication tokens and user data
   *
   * @example
   * const { accessToken, user } = await api.auth.login('user@example.com', 'password123');
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  /**
   * Login as an admin or super admin
   *
   * @param email - Admin's email
   * @param password - Admin's password
   * @returns Authentication tokens and user data
   *
   * @example
   * const { accessToken, user } = await api.auth.loginAdmin('admin@example.com', 'password123');
   * // user.role will be 'admin' or 'superAdmin'
   */
  async loginAdmin(email: string, password: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/admin/login', {
      email,
      password,
    });
    return response.data;
  }

  /**
   * Register a new client account
   *
   * @param data - Registration data
   * @returns Authentication tokens and user data
   *
   * @example
   * const { accessToken, user } = await api.auth.register({
   *   name: 'Doe',
   *   firstname: 'John',
   *   email: 'john@example.com',
   *   password: 'SecurePass123',
   *   telephone: '+1234567890',
   *   numPermis: 'DL123456',
   *   address: '123 Main St',
   *   city: 'New York',
   * });
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  /**
   * Refresh the access token using a refresh token
   *
   * @param refreshToken - The refresh token from login
   * @returns New authentication tokens
   *
   * @example
   * const { accessToken, refreshToken } = await api.auth.refresh(oldRefreshToken);
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  /**
   * Get the current authenticated user's profile
   * Requires valid access token
   *
   * @returns Current user's data
   *
   * @example
   * const user = await api.auth.me();
   * console.log(`Logged in as ${user.firstname} ${user.name}`);
   */
  async me(): Promise<User> {
    const response = await this.http.get<User>('/auth/me');
    return response.data;
  }

  /**
   * Logout (client-side only)
   * Note: This just notifies the server. You should also clear tokens locally.
   *
   * @example
   * await api.auth.logout();
   * api.clearTokens();
   */
  async logout(): Promise<void> {
    await this.http.post('/auth/logout');
  }
}
```

### 6.2 Cars Module

Create `packages/sdk/src/modules/cars.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  Car,
  CarQueryDto,
  CreateCarDto,
  UpdateCarDto,
  CheckAvailabilityDto,
  AvailabilityResponse,
  AvailabilityCalendar,
  BlockDatesDto,
  PaginatedResponse,
} from '../types';

/**
 * Cars module
 * Handles car CRUD operations and availability management
 */
export class CarsModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List all cars with optional filtering and pagination
   *
   * @param query - Filter and pagination options
   * @returns Paginated list of cars
   *
   * @example
   * // Get first page of Toyota cars
   * const { data: cars, meta } = await api.cars.list({ brand: 'Toyota', page: 1 });
   */
  async list(query?: CarQueryDto): Promise<PaginatedResponse<Car>> {
    const response = await this.http.get<PaginatedResponse<Car>>('/cars', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get a single car by ID
   *
   * @param id - Car ID
   * @returns Car details
   *
   * @example
   * const car = await api.cars.get(123);
   * console.log(`${car.brand} ${car.model} - $${car.price}/day`);
   */
  async get(id: number): Promise<Car> {
    const response = await this.http.get<Car>(`/cars/${id}`);
    return response.data;
  }

  /**
   * Create a new car (Admin only)
   *
   * @param data - Car data
   * @returns Created car
   *
   * @example
   * const car = await api.cars.create({
   *   brand: 'Toyota',
   *   model: 'Camry',
   *   year: 2024,
   *   mileage: 0,
   *   price: 75,
   *   registration: 'ABC-1234',
   *   fuel: 'hybrid',
   *   door: 4,
   *   gearBox: 'automatic',
   * });
   */
  async create(data: CreateCarDto): Promise<Car> {
    const response = await this.http.post<Car>('/cars', data);
    return response.data;
  }

  /**
   * Update an existing car (Admin only)
   *
   * @param id - Car ID
   * @param data - Fields to update
   * @returns Updated car
   *
   * @example
   * const car = await api.cars.update(123, { price: 80 });
   */
  async update(id: number, data: UpdateCarDto): Promise<Car> {
    const response = await this.http.put<Car>(`/cars/${id}`, data);
    return response.data;
  }

  /**
   * Delete a car (Admin only)
   *
   * @param id - Car ID
   *
   * @example
   * await api.cars.delete(123);
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/cars/${id}`);
  }

  /**
   * Check if a car is available for specific dates
   *
   * @param id - Car ID
   * @param data - Date range to check
   * @returns Availability status
   *
   * @example
   * const { available, conflictingDates } = await api.cars.checkAvailability(123, {
   *   startDate: '2024-03-01',
   *   endDate: '2024-03-05',
   * });
   * if (!available) {
   *   console.log('Conflicts:', conflictingDates);
   * }
   */
  async checkAvailability(id: number, data: CheckAvailabilityDto): Promise<AvailabilityResponse> {
    const response = await this.http.get<AvailabilityResponse>(
      `/cars/${id}/availability`,
      { params: data }
    );
    return response.data;
  }

  /**
   * Get monthly availability calendar for a car
   *
   * @param id - Car ID
   * @param year - Year (e.g., 2024)
   * @param month - Month (1-12)
   * @returns Calendar with blocked dates and rentals
   *
   * @example
   * const calendar = await api.cars.getAvailabilityCalendar(123, 2024, 3);
   * console.log(`${calendar.stats.availableDays} days available in March`);
   */
  async getAvailabilityCalendar(id: number, year: number, month: number): Promise<AvailabilityCalendar> {
    const response = await this.http.get<AvailabilityCalendar>(
      `/cars/${id}/availability/calendar`,
      { params: { year, month } }
    );
    return response.data;
  }

  /**
   * Block dates for a car (Admin only)
   * Blocked dates cannot be rented
   *
   * @param id - Car ID
   * @param data - Dates to block
   *
   * @example
   * // Block car for maintenance
   * await api.cars.blockDates(123, {
   *   dates: ['2024-03-15', '2024-03-16', '2024-03-17'],
   *   reason: 'Scheduled maintenance',
   * });
   */
  async blockDates(id: number, data: BlockDatesDto): Promise<void> {
    await this.http.post(`/cars/${id}/availability/block`, data);
  }

  /**
   * Unblock previously blocked dates (Admin only)
   *
   * @param id - Car ID
   * @param dates - Dates to unblock
   *
   * @example
   * await api.cars.unblockDates(123, ['2024-03-15', '2024-03-16']);
   */
  async unblockDates(id: number, dates: string[]): Promise<void> {
    await this.http.post(`/cars/${id}/availability/unblock`, { dates });
  }
}
```

### 6.3 Rentals Module

Create `packages/sdk/src/modules/rentals.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  Rental,
  RentalQueryDto,
  CreateRentalDto,
  UpdateRentalDto,
  PaginatedResponse,
} from '../types';

/**
 * Rentals module
 * Handles rental CRUD operations for clients
 */
export class RentalsModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List current user's rentals
   *
   * @param query - Filter and pagination options
   * @returns Paginated list of user's rentals
   *
   * @example
   * const { data: rentals } = await api.rentals.list({ status: 'ongoing' });
   */
  async list(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get a specific rental by ID
   *
   * @param id - Rental ID
   * @returns Rental details
   *
   * @example
   * const rental = await api.rentals.get(456);
   */
  async get(id: number): Promise<Rental> {
    const response = await this.http.get<Rental>(`/rentals/${id}`);
    return response.data;
  }

  /**
   * Create a new rental (book a car)
   *
   * @param data - Rental data
   * @returns Created rental
   *
   * @example
   * const rental = await api.rentals.create({
   *   carId: 123,
   *   startDate: '2024-03-01',
   *   endDate: '2024-03-05',
   *   startTime: '2024-03-01T09:00:00',
   *   endTime: '2024-03-05T17:00:00',
   * });
   * console.log(`Total: $${rental.total}`);
   */
  async create(data: CreateRentalDto): Promise<Rental> {
    const response = await this.http.post<Rental>('/rentals', data);
    return response.data;
  }

  /**
   * Update a rental (only reserved rentals can be modified)
   *
   * @param id - Rental ID
   * @param data - Fields to update
   * @returns Updated rental
   *
   * @example
   * const rental = await api.rentals.update(456, {
   *   endDate: '2024-03-07', // Extend rental by 2 days
   * });
   */
  async update(id: number, data: UpdateRentalDto): Promise<Rental> {
    const response = await this.http.patch<Rental>(`/rentals/${id}`, data);
    return response.data;
  }

  /**
   * Cancel a rental (only reserved rentals can be cancelled)
   *
   * @param id - Rental ID
   *
   * @example
   * await api.rentals.cancel(456);
   */
  async cancel(id: number): Promise<void> {
    await this.http.delete(`/rentals/${id}`);
  }
}
```

### 6.4 Agencies Module

Create `packages/sdk/src/modules/agencies.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  Agency,
  AgencyQueryDto,
  CreateAgencyDto,
  UpdateAgencyDto,
  AgencyStats,
  Car,
  PaginatedResponse,
} from '../types';

/**
 * Agencies module
 * Handles agency CRUD and statistics
 */
export class AgenciesModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List all agencies
   */
  async list(query?: AgencyQueryDto): Promise<PaginatedResponse<Agency>> {
    const response = await this.http.get<PaginatedResponse<Agency>>('/agencies', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get agency by ID
   */
  async get(id: number): Promise<Agency> {
    const response = await this.http.get<Agency>(`/agencies/${id}`);
    return response.data;
  }

  /**
   * Create new agency (SuperAdmin only)
   */
  async create(data: CreateAgencyDto): Promise<Agency> {
    const response = await this.http.post<Agency>('/agencies', data);
    return response.data;
  }

  /**
   * Update agency (SuperAdmin only)
   */
  async update(id: number, data: UpdateAgencyDto): Promise<Agency> {
    const response = await this.http.put<Agency>(`/agencies/${id}`, data);
    return response.data;
  }

  /**
   * Delete agency (SuperAdmin only)
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/agencies/${id}`);
  }

  /**
   * Get agency's cars
   */
  async getCars(id: number): Promise<PaginatedResponse<Car>> {
    const response = await this.http.get<PaginatedResponse<Car>>(`/agencies/${id}/cars`);
    return response.data;
  }

  /**
   * Get agency statistics (Admin only)
   */
  async getStats(id: number): Promise<AgencyStats> {
    const response = await this.http.get<AgencyStats>(`/agencies/${id}/stats`);
    return response.data;
  }
}
```

### 6.5 Users Module

Create `packages/sdk/src/modules/users.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type { User } from '../types';

/**
 * Users module
 * Handles user profile operations
 */
export class UsersModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<User> {
    const response = await this.http.get<User>('/users/me');
    return response.data;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.http.patch<User>('/users/me', data);
    return response.data;
  }
}
```

### 6.6 Admin Module

Create `packages/sdk/src/modules/admin.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  DashboardStats,
  UpdateRentalStatusDto,
  Rental,
  RentalQueryDto,
  PaginatedResponse,
} from '../types';

/**
 * Admin module
 * Handles agency admin dashboard operations
 */
export class AdminModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get agency dashboard statistics
   */
  async getDashboard(): Promise<DashboardStats> {
    const response = await this.http.get<DashboardStats>('/admin/dashboard');
    return response.data;
  }

  /**
   * Get agency rentals
   */
  async getRentals(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/admin/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get rental details for admin
   */
  async getRental(id: number): Promise<Rental> {
    const response = await this.http.get<Rental>(`/admin/rentals/${id}`);
    return response.data;
  }

  /**
   * Update rental status (approve, start, complete, cancel)
   */
  async updateRentalStatus(id: number, data: UpdateRentalStatusDto): Promise<Rental> {
    const response = await this.http.patch<Rental>(`/admin/rentals/${id}`, data);
    return response.data;
  }
}
```

### 6.7 Super Admin Module

Create `packages/sdk/src/modules/super-admin.ts`:

```typescript
import type { AxiosInstance } from 'axios';
import type {
  GlobalStats,
  CreateAdminDto,
  AssignAgencyDto,
  User,
  Agency,
  Rental,
  RentalQueryDto,
  AgencyQueryDto,
  PaginatedResponse,
} from '../types';

/**
 * Super Admin module
 * Handles platform-wide management operations
 */
export class SuperAdminModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get global platform statistics
   */
  async getDashboard(): Promise<GlobalStats> {
    const response = await this.http.get<GlobalStats>('/super-admin/dashboard');
    return response.data;
  }

  /**
   * Get all agencies
   */
  async getAgencies(query?: AgencyQueryDto): Promise<PaginatedResponse<Agency>> {
    const response = await this.http.get<PaginatedResponse<Agency>>('/super-admin/agencies', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get all rentals across platform
   */
  async getRentals(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/super-admin/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get all admin users
   */
  async getUsers(): Promise<PaginatedResponse<User>> {
    const response = await this.http.get<PaginatedResponse<User>>('/super-admin/users');
    return response.data;
  }

  /**
   * Create a new admin user
   */
  async createUser(data: CreateAdminDto): Promise<User> {
    const response = await this.http.post<User>('/super-admin/users', data);
    return response.data;
  }

  /**
   * Assign admin to an agency
   */
  async assignAgency(userId: number, data: AssignAgencyDto): Promise<User> {
    const response = await this.http.patch<User>(`/super-admin/users/${userId}/agency`, data);
    return response.data;
  }
}
```

---

## Step 7: Export Everything

### 7.1 Create Main Entry Point

Create `packages/sdk/src/index.ts`:

```typescript
// Export the main client
export { ApiClient } from './client';
export type { ApiClientConfig } from './client';

// Export all types
export * from './types';

// Export error classes
export {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from './errors';

// Export modules (optional - for advanced users who want to extend)
export { AuthModule } from './modules/auth';
export { CarsModule } from './modules/cars';
export { RentalsModule } from './modules/rentals';
export { AgenciesModule } from './modules/agencies';
export { UsersModule } from './modules/users';
export { AdminModule } from './modules/admin';
export { SuperAdminModule } from './modules/super-admin';
```

### 7.2 Why Export Everything?

```typescript
// Users can import exactly what they need:
import { ApiClient, Car, Rental, ApiError } from '@bthgrentalcar/sdk';

// Or import just types:
import type { Car, CreateCarDto } from '@bthgrentalcar/sdk';
```

---

## Step 8: Build the SDK

### 8.1 Build Command

```bash
cd packages/sdk
pnpm build
```

### 8.2 What Gets Created

After building, you'll see:

```
packages/sdk/dist/
├── index.js          # CommonJS bundle (for require())
├── index.js.map      # Source map for debugging
├── index.mjs         # ES Module bundle (for import)
├── index.mjs.map     # Source map for debugging
├── index.d.ts        # TypeScript declarations
└── index.d.mts       # TypeScript declarations (ESM)
```

### 8.3 Verify the Build

```bash
# Check the output
ls -la dist/

# View the generated types (should show your interfaces)
head -50 dist/index.d.ts
```

---

## Step 9: Use the SDK

### 9.1 Install in Your Project

For local development (in the same monorepo):

```json
// In your web app's package.json
{
  "dependencies": {
    "@bthgrentalcar/sdk": "workspace:*"
  }
}
```

Or link with file path:

```json
{
  "dependencies": {
    "@bthgrentalcar/sdk": "file:../../packages/sdk"
  }
}
```

### 9.2 Basic Usage

```typescript
import { ApiClient } from '@bthgrentalcar/sdk';

// Create client instance
const api = new ApiClient({
  baseURL: 'http://localhost:4000/api/v1',
});

// Login
async function login() {
  const { accessToken, refreshToken, user } = await api.auth.loginAdmin(
    'admin@example.com',
    'password123'
  );

  // Store tokens
  api.setTokens(accessToken, refreshToken);

  console.log(`Welcome, ${user.firstname}!`);
}

// Use authenticated endpoints
async function getCars() {
  const { data: cars, meta } = await api.cars.list({ page: 1, limit: 10 });

  console.log(`Found ${meta.total} cars`);
  cars.forEach(car => {
    console.log(`- ${car.brand} ${car.model}: $${car.price}/day`);
  });
}
```

### 9.3 React/Next.js Integration

```typescript
// lib/api.ts
import { ApiClient } from '@bthgrentalcar/sdk';

export const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  onTokenRefresh: ({ accessToken, refreshToken }) => {
    // Save to localStorage or cookies
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  onAuthFailure: () => {
    // Redirect to login
    window.location.href = '/login';
  },
});

// Restore tokens on app start
const storedToken = localStorage.getItem('accessToken');
const storedRefresh = localStorage.getItem('refreshToken');
if (storedToken && storedRefresh) {
  api.setTokens(storedToken, storedRefresh);
}
```

### 9.4 With React Query

```typescript
// hooks/useCars.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CarQueryDto } from '@bthgrentalcar/sdk';

export function useCars(query?: CarQueryDto) {
  return useQuery({
    queryKey: ['cars', query],
    queryFn: () => api.cars.list(query),
  });
}

// Usage in component
function CarsPage() {
  const { data, isLoading, error } = useCars({ page: 1 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data.map(car => (
        <li key={car.id}>{car.brand} {car.model}</li>
      ))}
    </ul>
  );
}
```

---

## Advanced Topics

### A1. Error Handling

```typescript
import { ApiError, ValidationError, UnauthorizedError } from '@bthgrentalcar/sdk';

try {
  await api.cars.create({ /* invalid data */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof UnauthorizedError) {
    console.log('Please login first');
  } else if (error instanceof ApiError) {
    console.log(`Error ${error.statusCode}: ${error.message}`);
  }
}
```

### A2. TypeScript Benefits

```typescript
// IDE shows autocomplete for all car fields
const car = await api.cars.get(1);
car.brand  // ✅ TypeScript knows this exists
car.foo    // ❌ Error: Property 'foo' does not exist

// Type checking for create/update
await api.cars.create({
  brand: 'Toyota',
  model: 'Camry',
  year: 2024,
  // TypeScript tells you if you're missing required fields
});
```

### A3. Token Persistence Strategies

**Web (localStorage):**
```typescript
const api = new ApiClient({
  baseURL: '...',
  onTokenRefresh: ({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
});
```

**React Native (AsyncStorage):**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = new ApiClient({
  baseURL: '...',
  onTokenRefresh: async ({ accessToken, refreshToken }) => {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  },
});
```

---

## Complete Code Reference

All source files are available in the repository:

```
packages/sdk/
├── src/
│   ├── client.ts
│   ├── errors.ts
│   ├── index.ts
│   ├── modules/
│   │   ├── admin.ts
│   │   ├── agencies.ts
│   │   ├── auth.ts
│   │   ├── cars.ts
│   │   ├── rentals.ts
│   │   ├── super-admin.ts
│   │   └── users.ts
│   └── types/
│       ├── admin.ts
│       ├── agency.ts
│       ├── auth.ts
│       ├── car.ts
│       ├── common.ts
│       ├── index.ts
│       ├── rental.ts
│       └── super-admin.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## Summary

Building an SDK involves:

1. **Setting up the project** - package.json, TypeScript, build tool
2. **Defining types** - TypeScript interfaces for all data
3. **Creating the client** - Axios instance with interceptors
4. **Creating modules** - One module per API resource
5. **Exporting everything** - Single entry point
6. **Building** - Compile to JavaScript + type definitions
7. **Using** - Import and use in your applications

The result is a type-safe, developer-friendly way to interact with your API!

---

## Need Help?

- Check the [API Documentation](http://localhost:4000/api/docs)
- Review the [SDK Source Code](../packages/sdk)
- Open an issue on GitHub

Happy coding! 🚀
