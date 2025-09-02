# User Profiles Table Setup Instructions

This guide will help you set up the user profiles table in your Supabase database.

## Files Created

1. `/Users/rosavi/Development/jcapps/jcapps-frontend/create_profiles_table.sql` - Complete SQL script
2. `/Users/rosavi/Development/jcapps/jcapps-frontend/src/types/profiles.ts` - TypeScript types
3. `/Users/rosavi/Development/jcapps/jcapps-frontend/src/lib/profiles.ts` - Helper functions
4. `/Users/rosavi/Development/jcapps/jcapps-frontend/src/components/UserProfile.tsx` - React component example

## Execution Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the entire contents of `create_profiles_table.sql`
4. Click "Run" to execute all commands

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/rosavi/Development/jcapps/jcapps-frontend

# Run the SQL file
supabase db reset --db-url "your-database-url" < create_profiles_table.sql
```

### Option 3: Using psql (if you have direct database access)

```bash
psql "your-postgres-connection-string" -f create_profiles_table.sql
```

## What the SQL Script Does

1. **Creates the `profiles` table** with the required columns:
   - `id` (UUID, primary key, references auth.users.id)
   - `full_name` (text, nullable)
   - `created_at` (timestamp with timezone, defaults to NOW())
   - `updated_at` (timestamp with timezone, defaults to NOW())

2. **Enables Row Level Security (RLS)** to protect user data

3. **Creates RLS policies** that ensure:
   - Users can only view their own profile
   - Users can only insert their own profile
   - Users can only update their own profile
   - Users can only delete their own profile

4. **Creates a trigger function** (`handle_new_user`) that automatically creates a profile when a new user signs up

5. **Creates a trigger** (`on_auth_user_created`) that calls the function above

6. **Creates an update trigger** that automatically updates the `updated_at` timestamp

7. **Updates the existing user** (vinicius.vidica@gmail.com) to have full_name = 'Vinicius'

## Verification Steps

After running the SQL script, verify the setup:

1. Check that the `profiles` table exists
2. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
3. Check policies exist: `SELECT policyname FROM pg_policies WHERE tablename = 'profiles';`
4. Verify the user profile was created: `SELECT * FROM profiles WHERE id = 'e05a0db6-1d69-433f-9061-8dd69f9561d4';`

## Using in Your Application

Import and use the helper functions:

```typescript
import { getCurrentUserProfile, updateCurrentUserProfile } from './lib/profiles';

// Get current user's profile
const profile = await getCurrentUserProfile();

// Update current user's profile
const updatedProfile = await updateCurrentUserProfile({ 
  full_name: 'New Name' 
});
```

## Security Notes

- All database operations are protected by RLS policies
- Users can only access their own profile data
- The trigger automatically creates profiles for new users
- The `updated_at` field is automatically maintained

## Troubleshooting

- Make sure your Supabase project has authentication enabled
- Verify that the user ID 'e05a0db6-1d69-433f-9061-8dd69f9561d4' exists in `auth.users`
- Check the Supabase logs for any errors during execution