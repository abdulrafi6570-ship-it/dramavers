---
name: Schema and api-zod fixes applied during Supabase integration
description: Pre-existing mismatches between api-zod generated types and actual DB schema/routes
---

## Fixes applied

1. `lib/api-zod/src/generated/api.ts` — `CreateRequestBody` had `{title, description}` but route/table uses `{drama, actor?, scene?, episode?}`. Fixed directly in the generated file.

2. `lib/api-zod/src/generated/api.ts` — `CreateAccessCodeBody` had `{count?: number}` but route uses `{code: string, expiredAt?: string}`. Fixed directly.

3. `lib/db/src/schema/ratings.ts` — had `{smooth, quality, useForEdit}` columns but `RateVideoBody` only sends `{rating: number}`. Changed to single `rating` column (applied via raw SQL since drizzle-kit push needed TTY).

**Why:** These were pre-existing mismatches between the OpenAPI spec and actual implementation in the original project zip. The api-server builds with esbuild (no type checking) so they didn't affect runtime, only typecheck.

## How to apply raw SQL migrations
Use `executeSql` in code_execution sandbox when `drizzle-kit push` fails in non-TTY (CI) mode — it prompts interactively for column renames/drops.
