# HanapBahay Environment Variables Template
# INSTRUCTIONS: Copy the content below and paste it into your .env.local file

## Your .env.local should contain these 4 variables:

DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:6379/railway
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
EXPO_PUBLIC_API_URL=https://web-production-e66fb.up.railway.app

## How to get each value:

### DATABASE_URL
1. Go to: https://railway.app
2. Open your project
3. Click on: PostgreSQL service
4. Go to: "Connect" tab
5. Copy: DATABASE_URL

### EXPO_PUBLIC_SUPABASE_URL
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Copy: Project URL

### EXPO_PUBLIC_SUPABASE_ANON_KEY
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Under "Project API keys" copy: anon public key

### EXPO_PUBLIC_API_URL
You already have this:
https://web-production-e66fb.up.railway.app

## Important Rules:

⚠️ NO SPACES around the = sign
⚠️ NO QUOTES around values
⚠️ One variable per line
⚠️ No extra blank lines at the start

## Example of CORRECT format:

DATABASE_URL=postgresql://postgres:abc123@railway.app:5432/railway
EXPO_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
EXPO_PUBLIC_API_URL=https://web-production-e66fb.up.railway.app

## Example of WRONG format:

DATABASE_URL = postgresql://...  ❌ (spaces around =)
EXPO_PUBLIC_SUPABASE_URL="https://..."  ❌ (quotes around value)
SUPABASE_ANON_KEY=eyJ...  ❌ (missing EXPO_PUBLIC_ prefix)

## Test your configuration:

After updating .env.local, run:
```
node debug-env.js
```

This will show you if all variables are detected correctly.

Then run the full test:
```
node test-cloud-setup.js
```
