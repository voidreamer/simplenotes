# Database Operations

Query and manage the Supabase PostgreSQL database.

## Usage
```
/db query      # Run a read query
/db migrate    # Run database migrations
/db users      # List users and their data
```

## Connection

Database URL is stored in environment variable `DATABASE_URL` (from ~/.zshrc).

**Schemas:**
- `public` - Production data
- `staging` - Staging data

## Common Queries

### List Users
```sql
SELECT DISTINCT owner_email, user_id FROM babies;
```

### Check User's Babies
```sql
SELECT * FROM babies WHERE owner_email = 'user@email.com';
```

### Update User ID (after auth migration)
```sql
UPDATE babies SET user_id = 'new-uuid' WHERE owner_email = 'user@email.com';
```

### Recent Activity
```sql
SELECT event_type, time, baby_id
FROM timeline_events
ORDER BY time DESC
LIMIT 20;
```

## Migrations

### Run Migrations Locally
```bash
cd backend
source ~/.zshrc  # Load DATABASE_URL
alembic upgrade head
```

### Check Migration Status
```bash
cd backend
alembic current
alembic history
```

### Create New Migration
```bash
cd backend
alembic revision --autogenerate -m "description"
```

## Supabase Dashboard
Access via: https://supabase.com/dashboard/project/ztgslfglskfmzakeizoq

- SQL Editor for direct queries
- Table Editor for data browsing
- Auth > Users for user management
