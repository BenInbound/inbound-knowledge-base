# Supabase Setup Guide

Since Docker isn't running, we'll set up Supabase using the cloud dashboard and apply migrations directly.

## Step 1: Create Supabase Project (5 minutes)

1. **Go to Supabase Dashboard**:
   - Visit https://supabase.com/dashboard
   - Sign in or create account

2. **Create New Project**:
   - Click "New Project"
   - **Organization**: Select or create "Inbound" organization
   - **Name**: `inbound-knowledge-base`
   - **Database Password**: Generate strong password and **SAVE IT SECURELY**
   - **Region**: `Europe West (eu-west-1)` (closest to Norway)
   - **Pricing Plan**: Free
   - Click "Create new project"

3. **Wait for Provisioning** (~2 minutes):
   - Database is being created
   - You'll see "Setting up project..." status

## Step 2: Get Project Credentials

Once the project is ready:

1. **Get Project Reference**:
   - In dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Copy the `YOUR_PROJECT_REF` value

2. **Get API Credentials**:
   - Go to **Settings** (left sidebar)
   - Click **API**
   - Copy these values:
     - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
     - **anon public key**: Long JWT starting with `eyJ...`

## Step 3: Configure Environment Variables

Create `.env.local` file in project root:

```bash
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security Note**: Never commit `.env.local` to git!

## Step 4: Apply Database Migration

We have two options: SQL Editor or Link & Push

### Option A: Using SQL Editor (Easiest - No Docker Required)

1. **Open SQL Editor**:
   - In Supabase Dashboard, click **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Copy Migration SQL**:
   - Open `supabase/migrations/20251016000001_initial_schema.sql`
   - Copy the entire contents

3. **Run Migration**:
   - Paste SQL into the editor
   - Click **Run** (or Ctrl/Cmd + Enter)
   - You should see "Success. No rows returned"

4. **Verify Tables Created**:
   - Click **Database** > **Tables** (left sidebar)
   - You should see all tables:
     - profiles
     - categories
     - articles
     - article_categories
     - questions
     - answers
     - import_jobs

### Option B: Link Project & Push (Requires Docker)

If you want to use Docker later for local development:

```bash
# Start Docker Desktop first

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push --linked
```

## Step 5: Configure Auth Settings

1. **Enable Email Auth**:
   - Go to **Authentication** > **Providers**
   - Make sure **Email** is enabled
   - Disable any other providers you don't want (Google, GitHub, etc.)

2. **Configure Email Templates** (Optional):
   - Go to **Authentication** > **Email Templates**
   - Customize confirmation and invite emails with Inbound branding

3. **Set Site URL**:
   - Go to **Authentication** > **URL Configuration**
   - **Site URL**: `http://localhost:3000` (for dev) or your production URL
   - **Redirect URLs**: Add `http://localhost:3000/**` and your production URLs

## Step 6: Verify Auth Hook

The email domain restriction (@inbound.no only) is enforced by a trigger in the migration.

**Test it works**:
1. Go to **Authentication** > **Users**
2. Try to add a test user with non-@inbound.no email
3. It should be rejected

## Step 7: Create Test User

Create a test user with @inbound.no email:

### Method 1: Dashboard (Easiest)

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. **Email**: `test@inbound.no`
4. **Password**: `TestPassword123!`
5. **Auto Confirm User**: ✅ (check this - skips email verification)
6. Click **Create user**

### Method 2: Supabase CLI

```bash
# If you have Supabase CLI linked
supabase auth signup --email test@inbound.no --password TestPassword123!
```

### Method 3: Through Your App

Once the app auth is built, use the signup form.

## Step 8: Seed Development Data

1. **Open SQL Editor**
2. **Copy Seed SQL**:
   - Open `supabase/seed.sql`
   - Copy the entire contents
3. **Run Seed**:
   - Paste and run in SQL Editor
   - This creates sample categories

**Note**: Sample articles require a real user ID. After creating a test user:
1. Get the user's ID from **Authentication** > **Users**
2. Replace `USER_ID_HERE` in the commented section of `seed.sql`
3. Uncomment and run those statements

## Step 9: Verify Setup

### Check Database

1. **Tables Exist**:
   - Go to **Database** > **Tables**
   - Should see: profiles, categories, articles, etc.

2. **Seed Data Loaded**:
   - Click **categories** table
   - Should see 11 sample categories

### Check Auth

1. **Test User Created**:
   - Go to **Authentication** > **Users**
   - Should see test@inbound.no user

### Test from App

Create a quick test file `lib/supabase/test.ts`:

```typescript
import { createClient } from './client'

export async function testConnection() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return false
  }

  console.log('Categories:', data)
  return true
}
```

## Step 10: Optional - Local Development with Docker

If you want to run Supabase locally later:

1. **Install Docker Desktop**:
   - Download from https://www.docker.com/products/docker-desktop
   - Install and start it

2. **Initialize Local Supabase**:
   ```bash
   supabase init
   ```

3. **Start Local Instance**:
   ```bash
   supabase start
   ```

4. **Access Local Services**:
   - Studio: http://localhost:54323
   - API: http://localhost:54321
   - DB: localhost:54322

5. **Use Local in Development**:
   Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
   ```

## Troubleshooting

### "Auth hook prevents user creation"

This is expected! Only @inbound.no emails are allowed.

**Solution**: Use `test@inbound.no` or any `*@inbound.no` email.

### "Cannot connect to Supabase"

1. Check `.env.local` has correct URL and anon key
2. Restart Next.js dev server: `pnpm dev`
3. Verify project is "Active" in Supabase Dashboard

### "Migration failed"

1. Check for syntax errors in SQL
2. Verify you're running in the correct database
3. Try running migration in smaller chunks

### "RLS policy blocks query"

Row Level Security is enabled. Make sure:
1. User is authenticated (logged in)
2. Policy allows the operation (check data-model.md for policies)

## Next Steps

Once Supabase is set up:

1. ✅ Environment variables configured
2. ✅ Database schema applied
3. ✅ Test user created
4. ⏳ Build authentication UI (login/signup pages)
5. ⏳ Build article viewing pages
6. ⏳ Build category navigation

Continue to `/speckit.tasks` to generate implementation tasks!
