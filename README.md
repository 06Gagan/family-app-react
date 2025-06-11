# Family App React

This repository contains the React front end and Supabase Edge Functions for FamilySync.

## Setup

1. Install dependencies **before running any npm script**:
   ```bash
   npm install
   ```
   You can also run `./setup.sh` to install dependencies automatically.
2. Copy the example environment file and provide your own values:
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment variables

### React application

- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – public anon key used by the client
- `VITE_GEMINI_API_KEY` – Google Gemini API key

### Supabase functions

When running or deploying functions from the `supabase/functions` directory the following variables are required by the Supabase CLI:

- `SUPABASE_URL` – your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – service role key for admin tasks
- `GEMINI_API_KEY` – Gemini API key used by server functions

## Commands

Before running `npm run lint`, `npm run build`, or any other npm script, make sure dependencies have been installed with `npm install` (or by running `./setup.sh`).

### React app

Start development:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Supabase functions

Serve a function locally:
```bash
supabase functions serve generate-meal-plan
supabase functions serve generate-shopping-list
supabase functions serve invite-member
```

Deploy functions to your Supabase project:
```bash
supabase functions deploy generate-meal-plan
supabase functions deploy generate-shopping-list
supabase functions deploy invite-member
```

### Reset the database

The SQL script at `supabase/sql/reset-schema.sql` drops any existing tables and
recreates them with all constraints, triggers, and RLS policies. Run it whenever
you need a fresh local database.

Using the Supabase CLI:
```bash
supabase db execute supabase/sql/reset-schema.sql
```

Or with `psql`:
```bash
psql "$SUPABASE_DB_URL" -f supabase/sql/reset-schema.sql
```
