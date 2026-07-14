---
name: Supabase auth integration
description: How Supabase auth was integrated into the existing Twixtor Archive JWT system
---

## Pattern

- Backend: `supabaseAdmin.auth.getUser(token)` to verify tokens in `requireAuth` / `optionalAuth` middleware
- Local `users` table has `supabase_id` column linking to Supabase user ID
- Register: `supabaseAdmin.auth.admin.createUser({ email: "${username}@twixtor.app", password, email_confirm: true })` then `supabaseAnon.auth.signInWithPassword` to get session token
- Login: `supabaseAnon.auth.signInWithPassword({ email: "${username}@twixtor.app", password })` then find local user by `supabaseId`
- Frontend unchanged: stores Supabase access_token in localStorage as `twixtor_token` (same key)
- `setup-api.ts` in twixtor-archive calls `setAuthTokenGetter(() => localStorage.getItem("twixtor_token"))` — still works

**Why:** Minimal frontend disruption; existing localStorage token pattern preserved; Supabase JWT replaces locally-generated JWT

## Key files
- `artifacts/api-server/src/middlewares/auth.ts` — verifies Supabase JWT
- `artifacts/api-server/src/lib/supabase.ts` — exports `supabaseAdmin` (service role) and `supabaseAnon` (anon key)
- `artifacts/api-server/src/routes/auth.ts` — register/login via Supabase
- `lib/db/src/schema/users.ts` — has `supabaseId` column (nullable, unique)
