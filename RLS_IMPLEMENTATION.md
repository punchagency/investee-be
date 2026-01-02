# Implementing Row Level Security (RLS) in TypeORM

## Overview

The Supabase schema defines Row Level Security (RLS) policies that enforce access control at the database level. While TypeORM doesn't have built-in RLS support, we can implement similar security using PostgreSQL's RLS features.

## Key Differences: Supabase vs TypeORM

### Supabase Approach

- Uses `auth.uid()` - Supabase's built-in authentication
- Uses `auth.users` table for user metadata
- Uses `auth.jwt()` for service role checks

### TypeORM Approach

- Uses PostgreSQL session variables (`current_setting`)
- Sets context via middleware before each request
- Manually manages user authentication via JWT

## Implementation Steps

### 1. Apply RLS Policies to Database

Run the migration SQL file:

```bash
cd c:\Users\franc\punch-work\investee\investee-server

# Using psql
psql $DATABASE_URL -f src/migrations/add-rls-policies.sql

# Or using TypeORM migration (if configured)
npm run migration:run
```

### 2. Update Server to Set RLS Context

Add RLS middleware to your server after authentication:

**In `src/index.ts`:**

```typescript
import { setRLSContext } from "./middleware/rls.middleware";
import { authenticate } from "./middleware/auth.middleware";

// Apply to all API routes that need RLS
app.use("/api", authenticate); // First authenticate
app.use("/api", setRLSContext); // Then set RLS context
```

### 3. Understanding How It Works

```
User Request → Auth Middleware → RLS Middleware → Database Query
                    ↓                  ↓                ↓
              Sets req.user    Sets PG variables   RLS policies filter rows
```

**Example flow for viewing applications:**

1. User sends GET `/api/applications` with JWT
2. Auth middleware decodes JWT, sets `req.user = { userId: '123', role: 'user' }`
3. RLS middleware runs: `SET app.user_id = '123'`, `SET app.user_role = 'user'`
4. TypeORM queries: `SELECT * FROM loan_applications`
5. PostgreSQL RLS policy filters: Only returns applications where `userId = '123'` OR `role = 'admin'`

## RLS Policies Applied

### Loan Applications

- ✅ Users can only view/edit their own applications
- ✅ Admins can view/edit all applications
- ✅ Anonymous users can create applications (userId = NULL)

### Properties

- ✅ Everyone can view properties
- ✅ Only admins can manage properties

### Property Listings

- ✅ Everyone can view active listings
- ✅ Users can only edit their own listings
- ✅ Admins can manage all listings

### Property Watchlist

- ✅ Users can only see/manage their own watchlist items

### Property Offers

- ✅ Buyers can view their own offers
- ✅ Sellers can view offers on their listings
- ✅ Users can only update their own offers
- ✅ Sellers can update offer status on their listings

### Property Alerts

- ✅ Users can only manage their own alerts

### Vendors

- ✅ Everyone can view vendors
- ✅ Only admins can manage vendors

## Testing RLS Policies

### Test as Regular User

```bash
# Set user context manually in psql
SET app.user_id = 'some-uuid';
SET app.user_role = 'user';

# Try to query - should only see own data
SELECT * FROM loan_applications;
```

### Test as Admin

```bash
SET app.user_id = 'admin-uuid';
SET app.user_role = 'admin';

# Should see all data
SELECT * FROM loan_applications;
```

### Test Anonymous

```bash
SET app.user_id = '';
SET app.user_role = '';

# Can only create applications with userId = NULL
INSERT INTO loan_applications (..., user_id) VALUES (..., NULL);
```

## Alternative: Application-Level Access Control

If you prefer **not** to use database-level RLS, implement access control in your controllers/storage layer:

**Example in storage layer:**

```typescript
async getUserApplications(userId: string) {
  return await applicationRepository.find({
    where: { userId },
  });
}

async getAllApplications(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await applicationRepository.find();
  }
  return await applicationRepository.find({
    where: { userId },
  });
}
```

**Pros of Application-Level:**

- ✅ More explicit and easier to debug
- ✅ Works the same across all databases
- ✅ No need for complex SQL policies

**Cons:**

- ❌ Must remember to add checks everywhere
- ❌ More code to maintain
- ❌ Risk of forgetting to add checks (security holes)

**Pros of Database RLS:**

- ✅ Enforced at database level (can't forget)
- ✅ Works even with raw SQL queries
- ✅ Defense in depth (extra security layer)

**Cons:**

- ❌ More complex to set up
- ❌ Harder to debug
- ❌ PostgreSQL-specific

## Recommendation

**Use both approaches for maximum security:**

1. Implement RLS at database level (defense in depth)
2. Still add access control checks in your application code (clarity and explicit intent)

This gives you the best of both worlds - explicit application-level checks that are easy to understand, plus database-level enforcement as a safety net.

## Files Created

- `src/migrations/add-rls-policies.sql` - SQL migration for RLS policies
- `src/middleware/rls.middleware.ts` - Middleware to set PostgreSQL session variables
