# Memory — Feature 13 Company Research Agent (Phase 4 built)

Last updated: 2026-10-01 (end of session)

## What was built

- **13 Company Research Agent**, this session.
  - `app/api/agent/research/route.ts`: `POST { jobId }`, synchronous, `maxDuration = 90`. Answers 401 signed out, 400 bad id, 503 when the Anthropic or Browserbase key is missing, 404 for a job that is not the user's, 502 when the dossier can't be written.
  - `agent/research.ts` (`researchCompany`: find the homepage, read it and up to 3 sub-pages, synthesize, log; never throws), `agent/company-site.ts` (pure helpers: `candidateHomepages`, job-board denylist, `rankSubPageLinks`, `cleanMarkdown`), `agent/dossier.ts` (`synthesizeDossier`: the one Claude Haiku 4.5 call).
  - `lib/browserbase.ts` (`fetchPageMarkdown`, `isBrowserbaseConfigured`), `lib/company-research.ts` (dossier zod schema and type, `normalizeDossier`, `parseDossier`), `lib/research-messages.ts` (error texts, kept apart so the client button does not bundle zod).
  - `components/job-details/CompanyResearch.tsx` now renders the 9-field dossier; `ResearchButton.tsx` is the client button (Research Company / Research again, pending and error states).
  - Also: `describeAnthropicError` moved into `lib/anthropic.ts` (used by `agent/matcher.ts` and `agent/dossier.ts`); `UNKNOWN_COMPANY` exported from `lib/adzuna.ts`; `company_researched` added to the server events in `lib/posthog-server.ts`; `AGENT_RESEARCH_API_PATH` in `lib/routes.ts`; `company_research: unknown` on `JobDetails`.
  - New packages: `@browserbasehq/sdk`, `tldts`. `.env.example` lists `BROWSERBASE_API_KEY`.
- **Back to Jobs restores the list view** (built earlier this session, committed with 08–12): `buildJobDetailsHref` in `lib/job-search.ts`.
- Context files updated (outside the repo): library-docs.md, architecture.md, code-standards.md, project-overview.md, build-plan.md, progress-tracker.md, ui-registry.md.

## Decisions made

- **Pages are read with the Browserbase Fetch API, not Stagehand** (decided with the user). No browser session, no second AI model. `@browserbasehq/stagehand`, `OPENAI_API_KEY` and `BROWSERBASE_PROJECT_ID` are not used. Cost: scripts do not run, so JavaScript-only sites come back thin.
- The Fetch response has no final URL after redirects, so the job's apply link is followed with a plain server `fetch` (8s, body never read) to find the employer's domain.
- Homepage = the landing host's root domain (`tldts`), never Adzuna or a known job board / ATS (`JOB_BOARD_DOMAINS`); fallback is a guess `https://www.{company}.com`, never for "Company not listed". First candidate with at least 200 characters of text wins.
- Sub-pages are picked in code, not by the model: best of each kind first (about, engineering, product, blog, team, careers), up to 3, fetched in parallel. One Claude call in total (40s timeout, no retry).
- Dossier = 8 model fields + `sources` (pages actually read, set by code) + `researchedAt` (ISO), all inside `jobs.company_research`. No migration. Research again overwrites. If no page can be read the dossier is still written from the job and profile.
- `maxDuration = 90`: the route waits on every fetch and the Claude call. The old "no maxDuration" note in library-docs.md was wrong and is fixed.
- Still in force from before: jobs list state lives in the URL, default sort Match Score; every AI call is Claude Haiku 4.5 via `AI_MODEL`; no stand-in scorer while the key is missing; schema changes are migration files only; Tailwind v4; no test runner; `.claude` and `.agents` stay git-ignored; RLS policies unchanged; OpenTelemetry logs kept; push and merge to `main` wait for the signed-in tests.

## Problems solved

- The Browserbase `browse` skill is installed globally (`~/.claude/skills/browse`); `browse cloud fetch --help` documents the Fetch API. The SDK call is `bb.fetchAPI.create({ url, format: "markdown", allowRedirects: true })`; types in `node_modules/@browserbasehq/sdk/resources/fetch-api.d.ts`.
- A dev server is often already running on port 3000 from the user's side: use it for visual checks instead of starting another (`next dev -p 3100` refuses while one runs).
- Headless Chrome can't render narrower than about 500px: a 390px screenshot is clipped on the right. Check at 500px, or on a real phone-width browser.
- A bash heredoc holding a long Python script with backticks and quotes broke; write the script with the file tool and run it.
- Still true from before:
  - Build and run from `C:\dev\jobpilot` (lowercase), or `next build` fails with a workStore InvariantError.
  - Context files live at `C:\Users\SBS\OneDrive\Bureau\assets\jobpilotzip\context\context\`, designs in `designs/*.png`.
  - Throwaway TypeScript scripts: put the script inside `C:\dev\jobpilot` and run `node --env-file=.env.local --import <hook file> script.ts`, with a hook that maps `@/` via `registerHooks` from `node:module`.
  - `PageProps<...>` route types need `npx next typegen` after adding a route.

## Current state

- **Passing:** type-check, lint, `next build` (`/api/agent/research` is listed).
- **Checked for 13:** live Fetch calls (vercel.com, stripe.com about 1s each, a dead domain returns null); link ranking on real pages; a real redirect followed; 21 helper checks and 9 dossier clean-up / parser checks on sample input; the card in headless Chrome at 900px and 500px with sample data.
- **Not verified for 13:** a real research run. The Claude call, the save, the button states in a browser, the 503 message, `company_researched` in PostHog, and what a real Adzuna `redirect_url` lands on have not been seen.
- **Not verified from earlier features:** every Claude call (07, 08, 10), a search that saves jobs, 11 filters against real rows, 12 on the real route, real profile save and upload, PostHog events with a real login, cross-user RLS.
- `ANTHROPIC_API_KEY` is still missing from `.env.local`. The Adzuna keys and `BROWSERBASE_API_KEY` are set.
- **Git:** on `feature/02-auth`. 08–12 are commit `792e844`; 13 is committed after it (see git log). The branch is unpushed and unmerged on purpose.
- The claude.ai PostHog connector is not authorized, so live events can't be queried from a session.
- An InsForge user API key was pasted into chat in an earlier session: [REDACTED_API_KEY]. It may be worth rotating.

## Next session starts with

1. Add `ANTHROPIC_API_KEY` to `.env.local` when available, then work through the signed-in test lists for 06, 07, 08, 10, 11, 12 and 13 in progress-tracker.md (Notes section).
2. First thing to look at once jobs exist: what a real Adzuna `redirect_url` lands on. If it is an Adzuna interstitial, every job falls back to the `www.{company}.com` guess and the homepage approach needs a rethink (Browserbase Search was the alternative considered).
3. Then **14 Dashboard Page — Full UI** (build-plan.md, Phase 5): mock data first. Run `/architect` before it.

## Open questions

- Does the Adzuna redirect reach the employer's site from a server fetch, or stop at an Adzuna page?
- Is the Fetch API enough for JavaScript-heavy company sites, or is a real-browser fallback needed later?
- Before production: add the deployed `/callback` URL to InsForge's allowed redirect list, set `NEXT_PUBLIC_APP_URL`, add the PostHog reverse proxy, and check the host allows a 90-second route.
- Rotate the InsForge user API key that was pasted into chat earlier (the user has not decided).
