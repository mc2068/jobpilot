# Memory — Features 14 to 16 Dashboard (Phase 5, one feature left)

Last updated: 2026-10-01 (end of session)

## What was built

- **14 Dashboard Page — Full UI.** `/dashboard` exists, so login no longer lands on a 404.
  - `app/dashboard/page.tsx`: navbar, optional profile banner, stats bar, Recent Activity beside the research chart, then the area chart and the distribution chart.
  - `components/dashboard/`: `StatsBar`, `StatCard`, `RecentActivity`, `ChartCard`, `DashboardBarChart` and `DashboardAreaChart` (the only Client Components), `ChartTooltip`, `ProfileBanner`.
  - `lib/dashboard-charts.ts` (class, margin, grid and axis settings shared by the charts); token `--color-chart-axis` in `app/globals.css`; types `DashboardStat`, `StatTrend`, `ActivityEntry`, `ActivityTone`, `ChartPoint` in `types/index.ts`.
  - New package: `recharts` 3.10.
- **15 Stats Bar — Real Data.** Migration `migrations/20261001162018_dashboard-stats.sql` adds `public.get_dashboard_stats()` and **is applied to the live backend**. `lib/dashboard-stats.ts` (`DASHBOARD_STATS_RPC`, `parseDashboardStats`, `buildDashboardStats`) builds the four cards and their trend badges.
- **16 Recent Activity — Real Data.** `lib/dashboard-activity.ts` (`buildRecentActivity`, column lists, `RECENT_ACTIVITY_LIMIT = 5`). The page queries `agent_runs` (completed runs) and `jobs` (researched jobs) and merges them.
- Context files updated for all three (outside the repo): progress-tracker.md, ui-registry.md, architecture.md, library-docs.md (new Recharts section), ui-tokens.md, code-standards.md, build-plan.md.

## Decisions made

- **The design wins over build-plan for 14:** the fourth stat card is Jobs This Week and the blue chart is Company Research Activity.
- **Charts are recharts**, sized with the `responsive` prop and CSS classes (no `ResponsiveContainer`), colours as `var(--color-*)`, axis text styled by class, tooltip as a component (no inline styles). The hover tooltip is an addition; the design shows none.
- **Stats come from one database function**, because this backend refuses PostgREST aggregates. It is `SECURITY INVOKER`, filters on `auth.uid()`, takes no arguments, and only `authenticated` may execute it.
- **Trend badges are computed, never mock.** Total: this week's jobs as a percentage of the total a week ago. Average: change in points against the average over jobs older than 7 days. With no job older than 7 days there is no badge, only a plain note. Red (`down`) and grey (`flat`) badge styles were added; the design only has green.
- "This week" is the last 7 days, rolling. Companies Researched counts researched jobs, not distinct companies.
- **Activity:** five entries; searches are `completed` runs dated by `completed_at` (green dot), research is a job with `company_research->>researchedAt` (blue dot). Failed runs are left out. The purple mock tone was removed from `ActivityTone`. Entries are not links.
- The profile banner (no design) is a compact version of the profile page's attention banner, shown only under 100%, from the real profile.
- Still in force from before: pages are read with the Browserbase Fetch API, not Stagehand; every AI call is Claude Haiku 4.5 via `AI_MODEL`; jobs list state lives in the URL; schema changes are migration files only; Tailwind v4; no test runner; `.claude` and `.agents` stay git-ignored; push and merge to `main` wait for the signed-in tests.

## Problems solved

- PostgREST aggregates (`select=match_score.avg()`) answer PGRST123 "Use of aggregate functions is not allowed". Use `select("id", { count: "exact" })` for a count, or a function plus `insforge.database.rpc(name)` for anything else.
- A Postgres `numeric` comes back as a string from the CLI's `db query`; PostgREST should send a number. `parseDashboardStats` accepts both.
- A jsonb path works in select (with an alias), in `.not(path, "is", null)` and in `.order(path)`: `company_research->>researchedAt`.
- Signed out, the backend answers a parse error for bad query syntax and "permission denied" for valid syntax. That is how a query shape can be checked without a session (curl with the anon key from `.env.local`).
- Headless Chrome with `--virtual-time-budget` catches the recharts area chart mid-animation. To screenshot its final shape, set `isAnimationActive={false}` for that run only.
- A bash heredoc holding Python with backticks breaks. Write the script with the file tool and run it (this bit again this session).
- A dev server is usually already running on port 3000 from the user's side; use it. Visual checks go through a temporary unprotected copy of the page (for example `app/preview-dashboard/`), removed afterwards.
- Still true from before:
  - Build and run from `C:\dev\jobpilot` (lowercase), or `next build` fails with a workStore InvariantError.
  - Context files live at `C:\Users\SBS\OneDrive\Bureau\assets\jobpilotzip\context\context\`, designs in `designs/*.png`.
  - Throwaway TypeScript checks: put a `.mts` script and a hook file inside `C:\dev\jobpilot`, run `node --import ./hook.mjs script.mts`, where the hook maps `@/` to `.ts` files with `registerHooks` from `node:module`. Delete both afterwards.
  - `PageProps<...>` route types need `npx next typegen` after adding a route.

## Current state

- **Passing:** type-check, lint, `next build` (`/dashboard` is listed). Signed out, `/dashboard` redirects to /login.
- **Checked for 14:** the page against `designs/dashboard.png` in headless Chrome at 1440px, and once at 600px.
- **Checked for 15:** the migration is listed as applied; the function returns one row of zeros with the admin key and "permission denied" signed out; the same SQL over four sample rows; the card logic on sample rows.
- **Checked for 16:** the merge logic on sample rows; the live backend accepts both query shapes.
- **Not verified for 14 to 16:** anything on the real route while signed in. No card or activity entry has been seen with real data (`jobs` and `agent_runs` are empty), nor the active Dashboard nav item, the profile banner, the chart tooltips, or the empty and error states in a browser. `get_dashboard_stats()` has never been called by a signed-in user.
- **Still mock:** the three charts (`MOCK_RESEARCH_ACTIVITY`, `MOCK_JOBS_OVER_TIME`, `MOCK_SCORE_DISTRIBUTION` and their `ticks` in `app/dashboard/page.tsx`).
- **Not verified from earlier features:** every Claude call (07, 08, 10, 13), a search that saves jobs, 11 filters against real rows, 12 on the real route, real profile save and upload, PostHog events with a real login, cross-user RLS.
- `ANTHROPIC_API_KEY` is still missing from `.env.local`. The Adzuna keys and `BROWSERBASE_API_KEY` are set.
- **Git:** on `feature/02-auth`. 13 is commit `1ef2633`. **14, 15 and 16 are not committed**: modified `app/globals.css`, `package.json`, `package-lock.json`, `types/index.ts`, `memory.md`; new `app/dashboard/`, `components/dashboard/`, `lib/dashboard-charts.ts`, `lib/dashboard-stats.ts`, `lib/dashboard-activity.ts`, `migrations/20261001162018_dashboard-stats.sql`. The branch is unpushed and unmerged on purpose.
- The claude.ai PostHog connector is not authorized, so live events can't be queried from a session.
- An InsForge user API key was pasted into chat in an earlier session: [REDACTED_API_KEY]. It may be worth rotating.

## Next session starts with

1. Commit 14 to 16 if the user wants (they have not asked yet).
2. **17 Analytics Charts — PostHog Data** (build-plan.md, the last feature): replace the three mock chart arrays with PostHog queries for the signed-in user (`job_found` by day, `job_found` by `matchScore` range, `company_researched` by day). Run `/architect` first: reading events back from PostHog needs a server-side query API and a personal API key that the project does not have yet (only the public project token is in `.env.local`), and the y-axis `ticks` must be computed from the data. Each chart needs an empty state.
3. Add `ANTHROPIC_API_KEY` to `.env.local` when available, then work through the signed-in test lists for 06, 07, 08, 10, 11, 12, 13, 14, 15 and 16 in progress-tracker.md (Notes section).
4. Once jobs exist, check what a real Adzuna `redirect_url` lands on. If it is an Adzuna interstitial, the homepage approach in 13 needs a rethink.

## Open questions

- 17: query PostHog (needs a personal API key and project id, server-side), or build the same three charts from the database, which already holds `jobs.found_at`, `jobs.match_score` and the dossier's `researchedAt`? The build plan says PostHog; the user has not been asked.
- Does the Adzuna redirect reach the employer's site from a server fetch, or stop at an Adzuna page?
- Is the Fetch API enough for JavaScript-heavy company sites, or is a real-browser fallback needed later?
- Before production: add the deployed `/callback` URL to InsForge's allowed redirect list, set `NEXT_PUBLIC_APP_URL`, add the PostHog reverse proxy, and check the host allows a 90-second route.
- Rotate the InsForge user API key that was pasted into chat earlier (the user has not decided).
