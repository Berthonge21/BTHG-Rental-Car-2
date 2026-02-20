# @berthonge21/sdk — Complete Reference

The BTHG Rental Car TypeScript SDK. A typed HTTP client that wraps all API endpoints.
Published on GitHub Packages as `@berthonge21/sdk`.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [The Problem We Solved](#2-the-problem-we-solved)
3. [Local File vs GitHub Packages](#3-local-file-vs-github-packages)
4. [One-Time Setup](#4-one-time-setup)
5. [Installing in a Project](#5-installing-in-a-project)
6. [Initializing the Client](#6-initializing-the-client)
7. [Modules & Methods](#7-modules--methods)
8. [Error Handling](#8-error-handling)
9. [Publishing a New Version](#9-publishing-a-new-version)
10. [Setting Up a New Machine](#10-setting-up-a-new-machine)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture

```
BTHG-Rental-Car-2/
  packages/sdk/
    src/
      client.ts          ← BthgClient class, token storage classes
      errors.ts          ← ApiError, NetworkError
      index.ts           ← Public exports
      modules/
        auth.ts          ← Login, register, me, logout, reactivate
        cars.ts          ← List, get, availability, block dates, CRUD
        rentals.ts       ← List, get, create, update, cancel
        agencies.ts      ← List, get, stats, CRUD
        users.ts         ← Profile, update, deactivate
        admin.ts         ← Dashboard, rental management
        super-admin.ts   ← Global stats, user/agency management
      types/
        common.ts        ← Enums, PaginatedResponse, MessageResponse
        auth.ts          ← LoginDto, RegisterDto, AuthResponse
        car.ts           ← Car, CreateCarDto, CarAvailability
        rental.ts        ← Rental, CreateRentalDto, RentalStatus
        agency.ts        ← Agency, CreateAgencyDto, AgencyStats
        user.ts          ← UserProfile, UpdateProfileDto
        admin.ts         ← DashboardStats
        super-admin.ts   ← GlobalStats, AdminUser
    dist/                ← Compiled output (what gets published)
    package.json
    .npmrc

bthg-rental-web/
  .npmrc                 ← Points @berthonge21 scope to GitHub Packages
  package.json           ← "@berthonge21/sdk": "^1.0.0"
  src/lib/api.ts         ← Single SDK instance used across the app
```

---

## 2. The Problem We Solved

### What happened

The web app had this in `package.json`:

```json
"@berthonge21/sdk": "file:../BTHG-Rental-Car-2/packages/sdk"
```

A `file:` path creates a symlink from `node_modules/@berthonge21/sdk` to the local
backend folder. The SDK's `package.json` points `main` and `types` at `dist/index.js`.

**The error:**
```
Module not found: Can't resolve '@berthonge21/sdk'
```

**Root cause:** The SDK had never been built — `dist/` did not exist. Node could not
resolve `dist/index.js` so the module resolved to nothing.

### How we fixed it (temporarily, while still on `file:`)

**Step 1 — Build the SDK:**
```bash
cd ~/Documents/BTHG-Rental-Car-2/packages/sdk
yarn build
# Generates dist/index.js, dist/index.mjs, dist/index.d.ts
```

**Step 2 — Add a TypeScript path alias** in `tsconfig.json` so TypeScript reads
the raw source instead of `dist/`:
```json
"paths": {
  "@/*": ["./src/*"],
  "@berthonge21/sdk": ["./node_modules/@berthonge21/sdk/src/index.ts"]
}
```

This was a workaround. After switching to the published package, the path alias
was removed — `dist/` now always exists.

---

## 3. Local File vs GitHub Packages

| | `file:../path/to/sdk` | `^1.0.0` from GitHub Packages |
|---|---|---|
| Works offline | Yes | No (needs internet on first install) |
| Works on Vercel/CI | **No** — path doesn't exist | Yes |
| Needs `yarn build` for types | Yes (or tsconfig hack) | No — `dist/` is bundled |
| Instant type updates | Yes (via tsconfig hack) | After publish + `yarn upgrade` |
| Version pinning | No | Full semver: `^1.0.0`, `~1.2.0` |
| Works on teammate machines | No — requires same folder structure | Yes |

**Rule of thumb:**
- Use `file:` only during initial development before the package exists anywhere.
- Switch to published version as soon as you push to GitHub/Vercel.

---

## 4. One-Time Setup

These steps are done once, ever. They are already complete for this project.

### 4.1 GitHub token scopes required

Your GitHub token (from `gh auth token`) needs these scopes:
- `repo` — push code
- `workflow` — push GitHub Actions workflow files
- `read:packages` — install from GitHub Packages
- `write:packages` — publish to GitHub Packages

**Add missing scopes:**
```bash
# Add workflow scope (needed to push .github/workflows/ files)
gh auth refresh -h github.com -s workflow
# Opens browser → enter the displayed code at github.com/login/device

# Add packages scopes
gh auth refresh -h github.com -s read:packages,write:packages
# Opens browser → enter the displayed code at github.com/login/device

# Verify current scopes
gh auth status
```

### 4.2 SDK package.json — publishConfig

```json
{
  "name": "@berthonge21/sdk",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/Berthonge21/BTHG-Rental-Car-2.git",
    "directory": "packages/sdk"
  }
}
```

### 4.3 SDK .npmrc

File: `packages/sdk/.npmrc`
```
@berthonge21:registry=https://npm.pkg.github.com
```
Tells npm which registry to use when publishing `@berthonge21/*` packages.

### 4.4 GitHub Actions publish workflow

File: `.github/workflows/publish-sdk.yml`

Triggers automatically when you push a tag starting with `sdk/v`.
Uses `GITHUB_TOKEN` (built-in, no secret needed) to authenticate.

### 4.5 Web app .npmrc

File: `bthg-rental-web/.npmrc`
```
@berthonge21:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```
- `NPM_TOKEN` must be set in your environment (see section 10).
- This file is committed to git — the token is read from the environment, not hardcoded.

### 4.6 First publish

```bash
cd ~/Documents/BTHG-Rental-Car-2

# Commit the publishConfig + workflow
git add packages/sdk/package.json packages/sdk/.npmrc .github/workflows/publish-sdk.yml
git commit -m "feat: configure SDK publishing to GitHub Packages"
git push origin main

# Create and push the tag → triggers the publish workflow
git tag sdk/v1.0.0
git push origin sdk/v1.0.0

# Watch the workflow live
gh run list --repo Berthonge21/BTHG-Rental-Car-2
gh run watch <run-id> --repo Berthonge21/BTHG-Rental-Car-2
```

### 4.7 Switch web app from file: to published

```bash
# In bthg-rental-web/package.json, change:
"@berthonge21/sdk": "file:../BTHG-Rental-Car-2/packages/sdk"
# to:
"@berthonge21/sdk": "^1.0.0"

# Remove the tsconfig path alias hack (no longer needed)
# In tsconfig.json, remove:
"@berthonge21/sdk": ["./node_modules/@berthonge21/sdk/src/index.ts"]

# Reinstall (NPM_TOKEN must be set in your terminal)
NPM_TOKEN=$(gh auth token) yarn install
```

---

## 5. Installing in a Project

### Prerequisites

You need a GitHub token with `read:packages` scope set as `NPM_TOKEN`.

```bash
# Get your token
gh auth token

# Set it in your shell (add to ~/.zshrc for persistence)
export NPM_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Reload shell
source ~/.zshrc
```

### Install the package

```bash
yarn add @berthonge21/sdk
# or
npm install @berthonge21/sdk
```

The `.npmrc` file at the project root tells yarn/npm to look at GitHub Packages
for the `@berthonge21` scope.

---

## 6. Initializing the Client

The SDK is initialized once in `src/lib/api.ts` and reused everywhere.

```typescript
import { createBthgClient, LocalStorageTokenStorage } from '@berthonge21/sdk';

const api = createBthgClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  tokenStorage: new LocalStorageTokenStorage(), // stores tokens in localStorage
  onUnauthorized: () => {
    // Called when a 401 is received AND token refresh fails
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
      window.location.href = '/admin/login';
    } else {
      window.location.href = '/login';
    }
  },
});

export default api;
```

### Token Storage options

| Class | Use case |
|---|---|
| `LocalStorageTokenStorage` | Web browser (default) |
| `MemoryTokenStorage` | Server-side rendering, unit tests |
| Custom class | Mobile apps, secure storage (implement `TokenStorage` interface) |

```typescript
// Custom token storage example
import type { TokenStorage } from '@berthonge21/sdk';

class SecureStorage implements TokenStorage {
  getAccessToken() { return SecureStore.getItemAsync('access_token'); }
  getRefreshToken() { return SecureStore.getItemAsync('refresh_token'); }
  setTokens(access, refresh) {
    SecureStore.setItemAsync('access_token', access);
    SecureStore.setItemAsync('refresh_token', refresh);
  }
  clearTokens() {
    SecureStore.deleteItemAsync('access_token');
    SecureStore.deleteItemAsync('refresh_token');
  }
}
```

### Debug mode

```typescript
const api = createBthgClient({
  baseUrl: '...',
  debug: true, // logs every request/response to the console
});
```

---

## 7. Modules & Methods

All modules are accessed via `api.<module>.<method>()`.

### auth

```typescript
// Client login → returns { accessToken, refreshToken, user }
const session = await api.auth.login({ email, password });

// Admin / super-admin login
const session = await api.auth.loginAdmin({ email, password });

// Register new client
const session = await api.auth.register({
  firstname, name, email, password,
  telephone, numPermis, address, city,
});

// Get current authenticated user
const user = await api.auth.me();

// Reactivate a deactivated client account (returns new session)
const session = await api.auth.reactivateAccount({ email, password });

// Logout
await api.auth.logout();
```

### cars

```typescript
// List cars (public — no auth needed)
const { data, meta } = await api.cars.list({
  page: 1, limit: 12,
  brand: 'Toyota', fuel: 'essence',
  transmission: 'automatique', agencyId: 5,
});

// Get single car
const car = await api.cars.get(42);

// Check availability for date range
const availability = await api.cars.checkAvailability(42, '2026-03-01', '2026-03-07');
// { available: true, blockedDates: [], conflictingRentals: [] }

// Get monthly availability calendar (admin only)
const calendar = await api.cars.getAvailabilityCalendar(42, 2026, 3);

// Block specific dates (admin only)
await api.cars.blockDates(42, ['2026-03-10', '2026-03-11']);

// Unblock dates (admin only)
await api.cars.unblockDates(42, ['2026-03-10']);

// Create car (admin only)
const car = await api.cars.create({ brand, model, year, price, agencyId, ... });

// Update car (admin only)
const car = await api.cars.update(42, { price: 150 });

// Delete car (admin only)
await api.cars.delete(42);
```

### rentals

```typescript
// List own rentals (client)
const { data, meta } = await api.rentals.list({ page: 1, limit: 10, status: 'reserved' });

// Get single rental
const rental = await api.rentals.get(17);

// Create rental
const rental = await api.rentals.create({
  carId: 42,
  startDate: '2026-03-01',
  endDate: '2026-03-07',
});

// Update rental (reserved status only)
const rental = await api.rentals.update(17, { startDate: '2026-03-02' });

// Cancel rental
await api.rentals.cancel(17);
```

### users

```typescript
// Get own profile
const profile = await api.users.getProfile();

// Update profile
const profile = await api.users.updateProfile({
  firstname: 'John', telephone: '+1234567890',
});

// Self-deactivate account (cannot have active rentals)
await api.users.deactivateAccount();
```

### agencies

```typescript
// List all agencies
const { data, meta } = await api.agencies.list({ page: 1, limit: 20 });

// Get single agency
const agency = await api.agencies.get(3);

// Get cars of an agency
const { data } = await api.agencies.getCars(3, { page: 1 });

// Get agency stats (admin only)
const stats = await api.agencies.getStats(3);

// Create agency (super-admin only)
const agency = await api.agencies.create({ name, city, address, telephone });

// Update agency (super-admin only)
const agency = await api.agencies.update(3, { city: 'Paris' });

// Delete agency (super-admin only)
await api.agencies.delete(3);
```

### admin

```typescript
// Dashboard stats for the admin's agency
const stats = await api.admin.getDashboard();
// { totalRentals, activeRentals, revenue, totalCars, ... }

// List agency rentals
const { data, meta } = await api.admin.getRentals({ status: 'reserved', page: 1 });

// Get single rental
const rental = await api.admin.getRental(17);

// Update rental status
const rental = await api.admin.updateRentalStatus(17, { status: 'ongoing' });
// status options: 'reserved' | 'ongoing' | 'completed' | 'cancelled'
```

### superAdmin

```typescript
// Global dashboard (all agencies)
const stats = await api.superAdmin.getDashboard();

// List all agencies
const { data, meta } = await api.superAdmin.getAgencies({ page: 1 });

// List all rentals across agencies
const { data, meta } = await api.superAdmin.getRentals({ page: 1 });

// List all admin users
const { data, meta } = await api.superAdmin.getUsers({ page: 1 });

// Create admin user
const admin = await api.superAdmin.createUser({
  firstname, name, email, password, telephone,
});

// Assign admin to an agency
const admin = await api.superAdmin.assignAgency(userId, { agencyId: 3 });

// Activate or deactivate an admin account
const admin = await api.superAdmin.updateUserStatus(userId, { status: 'deactivate' });
const admin = await api.superAdmin.updateUserStatus(userId, { status: 'activate' });
```

### Client utility methods

```typescript
// Manually store tokens (e.g. after login)
await api.setTokens(accessToken, refreshToken);

// Clear tokens (e.g. on logout)
await api.clearTokens();

// Check if user is logged in (has an access token in storage)
const loggedIn = await api.isAuthenticated(); // boolean
```

---

## 8. Error Handling

The SDK throws `ApiError` for HTTP errors and `NetworkError` for connection failures.

```typescript
import { ApiError, NetworkError } from '@berthonge21/sdk';

try {
  const rental = await api.rentals.create({ carId: 42, startDate, endDate });
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.statusCode);   // 400, 401, 403, 404, 500...
    console.log(error.message);      // First error message string
    console.log(error.errors);       // All validation messages (array)

    // Convenience booleans
    error.isUnauthorized   // statusCode === 401
    error.isForbidden      // statusCode === 403
    error.isNotFound       // statusCode === 404
    error.isValidationError // statusCode === 400
    error.isServerError    // statusCode >= 500
  }

  if (error instanceof NetworkError) {
    // No internet, server down, CORS error, etc.
    console.log('Cannot reach the server');
  }
}
```

### Pattern used in the app (React / toast)

```typescript
} catch (error) {
  toast({
    title: 'Failed',
    description: error instanceof ApiError ? error.message : 'An error occurred',
    status: 'error',
  });
}
```

---

## 9. Publishing a New Version

### Every time you change the SDK

```bash
# 1. Make changes in packages/sdk/src/

# 2. Bump the version in packages/sdk/package.json
#    Follow semantic versioning:
#      Patch (1.0.0 → 1.0.1) — bug fix
#      Minor (1.0.0 → 1.1.0) — new method, backwards compatible
#      Major (1.0.0 → 2.0.0) — breaking change (renamed method, removed field)

# 3. Build locally to verify it compiles without errors
cd ~/Documents/BTHG-Rental-Car-2
yarn workspace @berthonge21/sdk build
# or
cd packages/sdk && yarn build

# 4. Commit everything
git add packages/sdk
git commit -m "feat(sdk): add rental cancellation endpoint"
git push origin main

# 5. Tag the commit to trigger the publish workflow
git tag sdk/v1.1.0
git push origin sdk/v1.1.0
# GitHub Actions builds and publishes automatically

# 6. Watch the publish workflow
gh run list --repo Berthonge21/BTHG-Rental-Car-2 --limit 3
gh run watch <run-id> --repo Berthonge21/BTHG-Rental-Car-2
```

### After publishing — update the web app

```bash
cd ~/Documents/bthg-rental-web

# Update to the new version
NPM_TOKEN=$(gh auth token) yarn add @berthonge21/sdk@^1.1.0

# Commit the updated package.json and yarn.lock
git add package.json yarn.lock
git commit -m "chore: upgrade @berthonge21/sdk to v1.1.0"
```

---

## 10. Setting Up a New Machine

Every developer or CI environment that installs the project needs `NPM_TOKEN`.

### Local machine (developer)

```bash
# 1. Clone both repos
git clone https://github.com/Berthonge21/bthg-rental-web.git
git clone https://github.com/Berthonge21/BTHG-Rental-Car-2.git

# 2. Authenticate GitHub CLI
gh auth login
# Select: GitHub.com → HTTPS → Login with a web browser

# 3. Add required scopes
gh auth refresh -h github.com -s read:packages,write:packages,workflow

# 4. Set NPM_TOKEN in your shell (add to ~/.zshrc)
echo 'export NPM_TOKEN=$(gh auth token)' >> ~/.zshrc
source ~/.zshrc

# 5. Install web app dependencies
cd bthg-rental-web
NPM_TOKEN=$(gh auth token) yarn install
```

### Vercel (production)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `NPM_TOKEN`
   - **Value:** your GitHub token (run `gh auth token` to get it)
   - **Environment:** Production + Preview + Development
3. Redeploy — Vercel will now be able to pull `@berthonge21/sdk` during build

### GitHub Actions CI (if you add tests later)

Add this secret to the repo: Settings → Secrets → Actions → New repository secret
- **Name:** `NPM_TOKEN`
- **Value:** your GitHub token

Then in your workflow:
```yaml
- name: Install dependencies
  run: yarn install
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 11. Troubleshooting

### `Module not found: Can't resolve '@berthonge21/sdk'`

```bash
# If using file: dependency — SDK was never built
cd ~/Documents/BTHG-Rental-Car-2/packages/sdk
yarn build

# If using published version — .npmrc or NPM_TOKEN missing
cat bthg-rental-web/.npmrc     # must have @berthonge21:registry line
echo $NPM_TOKEN                # must not be empty
NPM_TOKEN=$(gh auth token) yarn install
```

### `permission_denied: The token provided does not match expected scopes`

```bash
# Token is missing read:packages scope
gh auth refresh -h github.com -s read:packages
# Follow browser flow, then:
NPM_TOKEN=$(gh auth token) yarn install
```

### `refusing to allow an OAuth App to create or update workflow`

```bash
# Token is missing workflow scope (needed to push .github/workflows/ files)
gh auth refresh -h github.com -s workflow
# Follow browser flow, then retry the push
```

### `remote: Permission denied to Berthonge-Geek`

```bash
# Git is using a cached credential from the wrong account
git credential-osxkeychain erase <<EOF
protocol=https
host=github.com
EOF
# Then push again — enter Berthonge21 credentials when prompted
```

### Publish workflow failed

```bash
# See the full logs
gh run list --repo Berthonge21/BTHG-Rental-Car-2 --limit 5
gh run view <run-id> --repo Berthonge21/BTHG-Rental-Car-2 --log

# Re-run the workflow without pushing a new tag
gh workflow run publish-sdk.yml --repo Berthonge21/BTHG-Rental-Car-2
```

### Version already exists on GitHub Packages

GitHub Packages does not allow republishing the same version.
Bump the version in `package.json` and create a new tag.

```bash
# Check what versions are published
gh api /users/Berthonge21/packages/npm/%40berthonge21%2Fsdk/versions \
  --jq '.[].metadata.container.tags'
```

---

## Quick Reference Card

```bash
# ─── BUILD ──────────────────────────────────────────────
cd ~/Documents/BTHG-Rental-Car-2/packages/sdk
yarn build                          # compile src/ → dist/
yarn dev                            # watch mode

# ─── PUBLISH ────────────────────────────────────────────
# 1. Bump version in packages/sdk/package.json
# 2. Commit + push main
git tag sdk/vX.Y.Z
git push origin sdk/vX.Y.Z         # triggers GitHub Actions

# ─── WATCH WORKFLOW ─────────────────────────────────────
gh run list --repo Berthonge21/BTHG-Rental-Car-2 --limit 3
gh run watch <run-id> --repo Berthonge21/BTHG-Rental-Car-2

# ─── UPDATE WEB APP ─────────────────────────────────────
NPM_TOKEN=$(gh auth token) yarn add @berthonge21/sdk@^X.Y.Z

# ─── TOKEN SCOPES ───────────────────────────────────────
gh auth status                      # see current scopes
gh auth refresh -h github.com -s read:packages,write:packages,workflow

# ─── GET TOKEN VALUE ────────────────────────────────────
gh auth token                       # prints your current token
```
