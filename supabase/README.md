# Supabase

- `migrations/` – schema, RLS, indexes/storage, hardening (private helper schema), realtime Broadcast (apply with `supabase db push` or `supabase db reset` locally).
- `seed.sql` – dev data: alice@example.com / bob@example.com, password `password123`. Never run in production.
- `tests/` – RLS and constraint tests against a throwaway local Postgres 16 (`npm run test:db`, needs `psql` and a superuser; `stub_supabase.sql` fakes the `auth`/`storage`/`realtime` schemas).

Regenerate `src/lib/supabase/database.types.ts` after schema changes with `npm run gen:types` (needs the Supabase CLI and `SUPABASE_PROJECT_ID`).
- `functions/mcp/` – MCP server Edge Function (see the main README). Deploy with `supabase functions deploy mcp` (keep JWT verification on).
