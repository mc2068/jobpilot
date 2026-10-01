# Memory — Feature 12 Job Details Page (Phase 4 started)

Last updated: 2026-10-01 (open questions closed)

## What was built

- **12 Job Details Page — Full UI**, this session. Not committed.
  - `app/find-jobs/[id]/page.tsx`: loads one job of the signed-in user (`.limit(1)`, not `.single()`), renders the page. `not-found.tsx` beside it is the "Job not found" page.
  - `components/job-details/`: `JobInfo` (header card + four info cards), `JobInfoCard`, `MatchScore` (AI reasoning + skills card), `SkillTag`, `JobDescription` (Adzuna snippet + "Jobs by Adzuna" credit), `CompanyResearch` (empty state only), `JobActions` (Apply Now).
  - `lib/job-details.ts` (`isJobId`, `formatJobType`, `getSafeUrl`, `ADZUNA_URL`, `MISSING_VALUE`), `getJobDetailsPath` in `lib/routes.ts`, the `JobDetails` type in `types/index.ts`.
  - `JobsTable` rows now link to the details page (the company name link's `::after` covers the row). `JobsPagination` imports `ADZUNA_URL` from `lib/job-details.ts`.
- **08, 09, 10 and 11 are still uncommitted** in the working tree (built in earlier sessions). Their decisions and test lists are in progress-tracker.md.
- Context files updated (outside the repo): progress-tracker.md, ui-registry.md, architecture.md.

## Decisions made

- **The design wins over the plan** (`designs/job-details.png`): the score is a pill badge ("85% Match Score", green at `MATCH_THRESHOLD` or above, grey below), not `MatchScoreBar`. Missing skills are purple (`accent`) tags.
- The page is 780px wide. The design's navbar (user icon, Sign out) was not built; `signOut` is still not wired to any UI.
- **Research Company is a stub**: a button with no handler, and the card always shows the empty state. 13 wires it and reads `company_research`.
- The description is `about_role` (the Adzuna snippet) only. Responsibilities, requirements, benefits and about-company are not rendered because nothing fills those columns.
- View Job Post uses `source_url`; Apply Now uses `external_apply_url` then `source_url`. A link only renders if it starts with http(s) (`getSafeUrl`).
- A bad id, an unknown id and another user's job all call `notFound()`; a failed read shows the page-level load error.
- **Back to Jobs restores the list view.** `JobsTable` links to `/find-jobs/<id>?q=&match=&sort=&page=` (`buildJobDetailsHref` in `lib/job-search.ts`); the details page re-parses them with `parseJobFilters` and links back via `buildFindJobsHref`. The 404 page still goes to plain `/find-jobs`. Not yet checked in a browser.
- Carried over and still in force:
  - The jobs list state lives in the URL (`?q=&match=&sort=&page=`); default sort is Match Score (confirmed by the user).
  - Text AI model is Claude Haiku 4.5 via `lib/anthropic.ts`; the Stagehand model is decided in 13.
  - The user chose to wait for an `ANTHROPIC_API_KEY`: no stand-in scorer; job search answers 503 until then.
  - Schema changes are migration files only; no dedupe of jobs across searches.
  - Tailwind v4 (the "use 3.4" line in AGENTS.md doesn't apply).
- **Closed 2026-10-01:**
  - No test runner for now; manual test lists in progress-tracker.md stay the check.
  - `.claude` and `.agents` stay in `.gitignore`; project skills are not committed.
  - RLS policies stay as they are (`profiles` no delete, `agent_logs` no update/delete) until something needs them.
  - Keep the OpenTelemetry server logs and their four packages.
  - PostHog reverse proxy: add before launch, not now.
  - Git: commit 08–12 on `feature/02-auth` only. Push and merge to `main` wait until the signed-in tests have run.

## Problems solved

- `PageProps<"/find-jobs/[id]">` failed type-check until `npx next typegen` generated the route types.
- A visual check without a session: a temporary unprotected route with the design's data, screenshotted with headless Chrome (`chrome.exe --headless=new --screenshot=...`) against `next dev -p 3100`; delete the route afterwards (done).
- Still true from before:
  - Build and run from `C:\dev\jobpilot` (lowercase), or `next build` fails with a workStore InvariantError.
  - Context files live at `C:\Users\SBS\OneDrive\Bureau\assets\jobpilotzip\context\context\`, designs in `designs/*.png`.
  - Throwaway TypeScript scripts: put the script inside `C:\dev\jobpilot` and run `node --env-file=.env.local --import <hook file> script.ts`, with a hook that maps `@/` via `registerHooks` from `node:module`.
  - PostgREST syntax can be checked signed out: a well-formed query answers `42501`, a malformed one `PGRST100`.

## Current state

- **Passing:** type-check, lint, `next build`.
- **Not verified: 12 on the real route.** The components match the design at 1418px in headless Chrome, and signed out `/find-jobs/<uuid>` redirects to /login. Not seen: a real job loading, a table row click, the 404 page in a browser, narrow screens (the check at 390px was only a quick look and showed horizontal overflow in the headless render, possibly an artefact of the window size — re-check on a phone-width browser).
- **Not verified from earlier features:** every Claude call (07 extraction, 08 generation, 10 scoring), a search that saves jobs, 11 filters against real rows, real profile save and upload, PostHog events with a real login, cross-user RLS.
- `ANTHROPIC_API_KEY` is still missing from `.env.local`. The Adzuna keys are set.
- **Git:** `57b5557` was the latest commit before this session. 08–12 are being committed on `feature/02-auth` (see git log). The branch is unpushed and unmerged on purpose.
- The claude.ai PostHog connector is not authorized, so live events can't be queried from a session.
- An InsForge user API key was pasted into chat in an earlier session: [REDACTED_API_KEY]. It may be worth rotating.

## Next session starts with

1. Add `ANTHROPIC_API_KEY` to `.env.local` when available, then work through the signed-in test lists for 06, 07, 08, 10, 11 and 12 in progress-tracker.md (Notes section). While at it, check the job details page at phone width.
2. Start **13 Company Research Agent** (build-plan.md): `POST /api/agent/research` with `{ jobId }`, `agent/research.ts`, `lib/browserbase.ts`, `lib/stagehand.ts`, wire the Research Company button, render the 9-field dossier in `CompanyResearch.tsx`, fire `company_researched`. Needs `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` (and `OPENAI_API_KEY` if Stagehand stays on GPT-4o), so check which are set. Load the `claude-api` skill before the synthesis call and the Browserbase / Stagehand skills first. Decide the Stagehand model.

## Open questions

- Which model for the Stagehand browser agent? Decide in 13.
- Before production: add the deployed `/callback` URL to InsForge's allowed redirect list, set `NEXT_PUBLIC_APP_URL`, and add the PostHog reverse proxy.
- Rotate the InsForge user API key that was pasted into chat earlier (the user has not decided).
