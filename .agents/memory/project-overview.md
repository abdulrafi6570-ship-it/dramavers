---
name: Twixtor Archive project overview
description: Key facts about the Rapptwix/Twixtor Archive drama streaming platform
---

## Artifacts
- `artifacts/twixtor-archive` — real React frontend, previewPath "/", port 18087
- `artifacts/api-server` — Express 5 backend, port 8080, prefix `/api`
- `artifacts/web` — accidental artifact I created, moved to previewPath "/web-old", ignore it

## Stack
- DB: PostgreSQL + Drizzle ORM; lib/db has all 17 schema tables
- Auth: Supabase (as of this session) replacing jsonwebtoken/bcrypt
- Storage: AWS S3 / Cloudflare R2 via `@aws-sdk/client-s3` (NOT Google Cloud Storage — the objectAcl.ts/objectStorage.ts scaffold files were deleted as unused)
- API contract: OpenAPI spec → Orval codegen → `lib/api-zod` (Zod schemas) + `lib/api-client-react` (React Query hooks)

## Admin account
- On first start, api-server seeds an admin user with default credentials (logged as INFO)

**Why:** User had a full existing project in a zip; extracted and integrated rather than rebuilt
