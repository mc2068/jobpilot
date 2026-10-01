# Memory — Feature 04 Database Schema (Phase 1 complete)

Last updated: 2026-10-01 (end of session)

## What was built

- **04 Database Schema, applied to the live InsForge backend, uncommitted.**
  - `migrations/20261001085529_initial-schema.sql`: `profiles`, `agent_runs`, `jobs`, `agent_logs` (columns exactly as architecture.md), indexes, check constraints, row level security, the `on_auth_user_created` trigger on `auth.users` (function `public.handle_new_user`), a backfill of existing users, and own-folder policies on `storage.objects` for the `resumes` bucket.
  - Private `resumes` bucket created with the CLI (`storage create-bucket resumes --private`). It is not part of the migration file.
- **InsForge CLI set up for this project.** Logged in, project linked (`.insforge/project.json`, gitignored), InsForge skills (`insforge`, `insforge-cli`, `insforge-debug`, `insforge-integrations`) and `find-skills` installed globally.
  - The link step added an InsForge block to `AGENTS.md` and ignore rules to `.gitignore` (`.insforge`, `.claude`, `.agents` and other agent folders).
- Context files updated (outside the repo): architecture.md, library-docs.md (storage section, array-form insert), progress-tracker.md.
- No app code, UI or TypeScript types were written for 04.

## Decisions made

- **Schema follows architecture.md column for column.** No "tailored fields", no dedupe column or unique constraint on `jobs`: repeat searches save repeat rows. The user explicitly rejected adding an `external_id` column.
- **Profile row is created by a database trigger at sign-up.** Every signed-in user has a `profiles` row, so 06 saves with an update, not an insert.
- **`user_id` foreign keys point at `profiles(id)`**, and `profiles.id` at `auth.users(id)`. Deletes cascade all the way down.
- **Narrower than "all four operations everywhere":** `profiles` has no delete policy; `agent_logs` is append-only (select + insert). The user was told and has not objected.
- **`agent_logs.run_id` is nullable** (company research logs have a job but no run). `jobs.job_type` has no check constraint (Adzuna's values vary).
- **`resumes` bucket is private.** Key is `{user_id}/resume.pdf`. No `getPublicUrl`: read with the SDK's `download()` as the signed-in user. `resume_pdf_url` stores the URL returned by `upload()`, which is not publicly openable.
- **Schema changes are migration files** created with `npx -y @insforge/cli db migrations new <name>` and applied with `db migrations up --all`. Load the `insforge-cli` skill first. No ad-hoc DDL.
- Carried over and still in force:
  - PostHog: init in `instrumentation-client.ts`; event names are typed unions (never call `posthog.capture` directly); server calls run inside `after()`; sign-out reset uses the `posthog_reset` cookie; env vars are `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`.
  - Tailwind v4 (the "use 3.4" line in AGENTS.md doesn't apply).
  - `@insforge/sdk` with its `/ssr` subpaths; `@insforge/ssr` does not exist. OAuth runs server-side with PKCE; the proxy is only an optimistic check.
  - No placeholder `/dashboard`: a successful login lands on a 404 until feature 14.
  - Dashboard follows the design and project-overview ("Jobs This Week", "Company Research Activity").
  - Score colours from ui-rules (80+ green, 60–79 blue, below 60 orange); missing-skill tags purple.
  - Research synthesis temperature 0.4; Find Jobs table per build-plan (SOURCE column, 20 per page).
  - recharts gets added to approved dependencies when first needed.

## Problems solved

- **A trigger on `auth.users` is allowed.** It is a documented InsForge pattern (`insforge-cli` skill, `references/auth.md`), so the fallback of pointing foreign keys at `auth.users` was not needed.
- **Neither SQL tool can impersonate a user.** `npx @insforge/cli db query` rejects `DO` blocks ("could not be parsed"), and the MCP `run-raw-sql` rejects `SET ROLE` / `set_config` ("Changing SQL session configuration is not allowed"). RLS can only be tested as a real signed-in user through the API.
- **Signed-out check that does work:** `curl` the REST endpoint `{INSFORGE_URL}/api/database/records/<table>` with the anon key as bearer; a correct setup returns 401 "permission denied".
- **InsForge storage policies** go on `storage.objects` (columns `bucket`, `key`, `uploaded_by`), use `auth.jwt() ->> 'sub'` and `storage.foldername(key)`, and need `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` because fresh projects ship with it off.
- **InsForge gives `anon` and `authenticated` broad default privileges on public tables.** The migration revokes them and grants back only what each table needs.
- **InsForge project memory (`insforge memory remember`) needs a paid plan.** It fails on this organisation; don't rely on it.
- Still true from before:
  - Build and run from `C:\dev\jobpilot` (lowercase), or `next build` fails with a workStore InvariantError.
  - `createBrowserClient()` fires a refresh request on creation; import `lib/insforge-client.ts` lazily where signed-out visitors can reach the code.
  - posthog-js drops events from headless Chrome; override the user agent and `navigator.webdriver`, and add `?__posthog_debug=true`.
  - `updateSession` blanks cookies instead of deleting them, so check the value.
  - Context files live at `C:\Users\SBS\OneDrive\Bureau\assets\jobpilotzip\context\context\`, designs in `designs/*.png`.

## Current state

- **Live backend:** four tables with RLS on, 15 owner-only policies, the trigger attached, the one existing account backfilled a profile, private `resumes` bucket present. All tables are empty apart from that one profile row.
- **Verified:** policy expressions read back from the database; signed-out API requests denied on all four tables and the bucket; check constraints reject a bad `source` and a `match_score` of 101; no test rows left behind.
- **Not verified:** one signed-in user against another user's rows and files (needs two real sessions). Also not exercised: the trigger firing on a brand-new sign-up (only the backfill ran).
- **Still not verified from 03:** `user_signed_in` and its `provider` property, the identify call after login, `oauth_sign_in_started`, and the `signOut` action (not wired to any button).
- **Nothing is committed.** The working tree on `feature/02-auth` holds all of 03, 04 (`migrations/`), the link-step edits to `AGENTS.md` and `.gitignore`, plus `memory.md` and `skills-lock.json`. The branch is unpushed and unmerged.
- No build, `tsc` or lint was run this session (no app code changed).
- The InsForge user API key was pasted into the chat this session: [REDACTED_API_KEY]. It may be worth rotating.
- The claude.ai PostHog connector is not authorized, so live events can't be queried from a session.

## Next session starts with

1. Commit the 03 and 04 work (decide first whether `skills-lock.json` and `memory.md` go in).
2. Log in once with Google or GitHub in a real browser and check PostHog live events for `oauth_sign_in_started`, `user_signed_in` (with `provider`) and an identified person.
3. Start **05 Profile Page — Full UI** (build-plan.md): mock data, no save logic. Read the context files and the profile design in `designs/` first; run `/architect` if anything is unclear.
4. When 05/06 give a page that reads data as a signed-in user, run the cross-user RLS check with two accounts.

## Open questions

- Merge `feature/02-auth` into `main` and push? It now carries 02, 03 and 04.
- Widen the policies? `profiles` has no delete and `agent_logs` no update/delete, which is narrower than the original plan.
- `.gitignore` now ignores `.claude` and `.agents`, so the project skills (`architect`, `remember`, `review`, …) won't be committed. Keep that, or un-ignore `.claude/skills`?
- Keep the OpenTelemetry server logs the PostHog wizard added, or drop them and their four packages?
- No reverse proxy for PostHog, so ad blockers will drop browser events. Worth adding before launch?
- For production: add the deployed `/callback` URL to InsForge's allowed redirect list and set `NEXT_PUBLIC_APP_URL`.
- The same value is called `ctaHref` in some homepage components and `primaryHref` in another (leftover from the 02 review).
