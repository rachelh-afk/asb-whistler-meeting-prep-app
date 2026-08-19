# ASB Whistler — Meeting Prep

Standalone Next.js port of the Claude.ai artifact meeting-prep tool (originally
built for the Austin Showcase), re-seeded for the 2026 ASB National Summit in
Whistler, BC: searchable roster of ASB/CSB/American Diversity sales reps plus
ASB Home Office staff, per-person business info, narrative Q&A, internal
meeting prep notes, attention flags, CSV export, and iClick account info
(revenue, FST region, order history).

## Architecture

- **Framework:** Next.js 16 (App Router), Tailwind v4
- **Database:** Postgres (one `people` table, each row a JSONB blob of the
  full person object — mirrors the original app's data shape exactly)
- **AI parsing:** `/api/parse` proxies to the Anthropic API server-side
  (`ANTHROPIC_API_KEY` never reaches the browser)
- **Auth:** a single shared team password gates the whole app (`proxy.js` +
  `/api/login`), not per-user accounts

## Schema extensions vs. the Austin Showcase original

The roster's registration form asked different questions than Austin's, so
the schema was extended (not redesigned — everything from the original port
is unchanged):

- `yearsInIndustry` (string) and `brandAffiliation` (string array: ASB / CSB /
  American Diversity) — new top-level person fields.
- `ourPrep.toolsWeCanOffer` — a new internal planning field ("tools/support
  iClick can offer to help them grow fastest"), always blank at seed time,
  filled in by the team during prep like the other `ourPrep` fields.
- Of the original 11 `narrative` fields, only 3 have source data for this
  roster: `specializationAndGrowth` (business focus & goals for 2026-27),
  `biggestChallenge12mo` (biggest sales challenge), and
  `mostEffectiveVendorSupport` (their description of an ideal vendor). The
  other 8 — including `greatestOpportunity` — are present but blank per
  person; the UI already omits empty narrative fields from the profile view.

## Local setup

1. Install dependencies (already done if you're continuing this session):
   ```
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Neon or Vercel Postgres).
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
     → API Keys.
   - `APP_PASSWORD` — the password your team will use to log in.
   - `COOKIE_SECRET` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Run the dev server:
   ```
   npm run dev
   ```
4. Open http://localhost:3000 — you'll be redirected to `/login`. Enter
   `APP_PASSWORD`. On first load, the database auto-creates its table and
   seeds it with the 173 roster records (130 Sales Associates + 43 Home
   Office staff).

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. In the [Vercel dashboard](https://vercel.com/new), import the repository.
3. Add the same four environment variables from `.env.local` under
   **Settings → Environment Variables** (use a real, unique `APP_PASSWORD`
   and `COOKIE_SECRET` for production — don't reuse local dev values, and
   double-check the exact casing of each key name).
4. Deploy. Vercel builds and serves the app; the database schema and seed
   data are created automatically on the first request to `/` or any
   `/api/people` call.
5. Share the URL and `APP_PASSWORD` with your team.

## Notes

- The `people` table stores each person as a single JSONB column (`data`),
  matching the app's in-memory object shape exactly — no relational schema
  translation.
- Seed data was generated from `2026 ASB Summit_SA_HO.xlsx` (roster) cross-
  referenced against an iClick sales-data export by exact rep email (not
  company name, since roster company names are messy/inconsistent
  independent-affiliate DBAs) — see the `event-prep-webapp` skill's
  revenue-enrichment method. 22 of 173 people had matching order history.
- Sales-mix percentages (`salesMix.apparel/hardgoods/print`) were only
  auto-split when a rep's free-text answer gave exactly 2 or 3 numbers
  summing to ~100; anything else (e.g. "Even", "I dont know I just work
  here") was preserved verbatim in `apparel` rather than guessed at, so the
  hardgoods 50%+ auto-flag never fires on a misread.
