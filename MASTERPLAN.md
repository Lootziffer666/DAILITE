# DAILITE — MASTERPLAN (LLM Handoff Edition)

**Purpose:** This is the single authoritative document for any LLM agent (or human) picking up
DAILITE and driving it to completion. It contains a verified audit of the current state, a
complete defect inventory with file/line references, a phased work breakdown with acceptance
criteria and verification commands for every task, conventions, risks, and a status ledger.

**Audited at:** 2026-07-12, commit `d28d707` ("Remove API screenshots - keep only UI dashboard")
**Language note:** Written in English for maximum LLM compatibility. Antworten an den Projektinhaber gern auf Deutsch.

---

## 0. Agent Operating Manual — READ THIS FIRST

Rules for every LLM session working on this repo:

1. **Trust this document over README.md / PHASE2_STATUS.md.** Those files describe an
   *aspirational* state. Several commands they mention do not exist (see defects D1, D2).
   This plan describes the *verified* state.
2. **Pick exactly one task** from the Status Ledger (§12), respecting the dependency column.
   Never start a task whose dependencies are unchecked.
3. **Before coding:** read every file listed in the task's "Files" row, plus this section.
4. **After coding:** run the task's "Verification" commands. A task is done only when every
   acceptance criterion passes. Do not mark a task done on "should work" reasoning.
5. **Update the Status Ledger** in this file (`[ ]` → `[x]`, add commit hash) in the same
   commit as the work. The ledger is the project's ground truth.
6. **Commit style:** one task per commit where feasible; imperative subject line prefixed
   with the task ID, e.g. `P0-3: Create tmp/ dir with .gitkeep so OCR upload works on fresh clone`.
7. **Never invent game data.** All Dead by Daylight reference data (killers, maps, perks,
   survivors) must trace to `data/wiki_*.json`, which is verified against
   deadbydaylight.wiki.gg (see `WIKI_AUDIT_2026-07-06.md`). If you need new data, add it to
   the JSON with a `source` field — never hardcode it in application code.
8. **Do not delete or rewrite the SPLATTER motion library or design tokens** (`lib/splatter-*`,
   `styles/design-tokens.css`) unless a task explicitly says so. They are the owner's design
   system ("Ink & Iron Glow" + "FLUBBER") and are considered finished.
9. **ESM everywhere.** `package.json` has `"type": "module"`. No `require()`.
10. **When docs and code disagree, fix both** — code first, then the doc that lied.
11. **When you finish a task, stop.** Summarize what changed, what you verified, and which
    task is unblocked next. Do not opportunistically start the next task in the same session
    unless it is trivially small (< 30 min) and shares the same files.

---

## 1. Product Vision & Scope

**DAILITE** is a Dead by Daylight (DBD) companion app for survivors:

- **Match tracking & stories** — record matches, get narrative summaries instead of raw stats.
- **Analytics** — escape rate, per-killer and per-map breakdowns, hook/gen/heal metrics, trends.
- **Build Coach** — evaluate perk builds against a specific killer using the player's own
  history plus community balance meta (`data/killer-balance-tiers.json`).
- **Screenshot OCR** — extract killer, map, perks, outcome from DBD screenshots (primarily the
  end-of-match score screen) so matches can be logged without manual typing.
- **Desktop overlay (Electron)** — capture the screen during play, run OCR continuously, show
  a transparent always-on-top overlay with live suggestions.

**Target user:** a single player on their own PC first (local Postgres, no accounts).
Multi-user/cloud is Phase 5, explicitly out of scope until everything local works.

**Non-goals (hard boundaries):**
- No game-memory reading, no injection, no automation of gameplay inputs. Screen capture +
  OCR only (overlay tools of this kind are the community norm; input automation is not).
- No scraping of live wiki at runtime — reference data ships as vendored JSON.

---

## 2. Verified Current State

### 2.1 Stack

| Layer | Tech | State |
|---|---|---|
| Backend | Node 22 ESM, Express 4, `pg`, Swagger UI | Works, gaps in spec & validation |
| DB | PostgreSQL (schema in `scripts/init-db.js`) | Works; 3 tables are dead (unused) |
| Frontend | React 18 + Vite 4, custom design system | Renders, but **all data is mocked** |
| OCR | tesseract.js 5 + sharp | Functional pipeline, naive matching |
| Desktop | Electron sources in `electron/` | **Cannot run** — dependency & script missing |
| Data | 8 JSON files in `data/`, wiki-verified | Good; one leftover draft file |
| Tests | `scripts/test-ocr.js`, `scripts/quick-demo.js` | Ad-hoc scripts, no test framework, no CI |

### 2.2 File map (what each file actually is)

```
server.js                  Express app + inline OpenAPI spec + pg Pool (exported) + listen()
routes/matches.js          CRUD + /:id/story narrative generator
routes/stats.js            /summary, /by-killer, /by-map aggregations
routes/builds.js           /analyze (history + balance meta), GET/POST saved builds
routes/reference.js        killers/maps/perks lookups + trigram killer search
routes/ocr.js              /analyze (multipart), /live-session (base64 batch), /status
lib/ocr.js                 DBDOCRParser: sharp preprocess → tesseract → regex/substring extraction
lib/splatter-motion.js     Design-system motion core (DO NOT TOUCH)
lib/splatter-components.jsx React wrappers for motion (DO NOT TOUCH)
components/Dashboard.jsx   Main UI — home/match/stats/builds/ocr views; match+stats are FAKE (setTimeout)
components/OCRTester.jsx   Real API consumer: fetches /api/ocr/status and /api/ocr/analyze
App.jsx, src/main.jsx      React entry; index.html is the Vite root
electron/main.js           Window + overlay + desktopCapturer loop + IPC (unrunnable, see D2)
electron/preload.js        contextBridge API for main window
electron/overlay.html      Transparent overlay UI with its own suggestion logic
electron/overlay-preload.js  Overlay IPC bridge
electron/overlay-config.js Per-hardware-profile capture/overlay tuning presets
electron/performance.js    OS-level perf tweaks manager
electron/ui/*              LEGACY static UI (predates React dashboard) — candidate for deletion
scripts/init-db.js         CREATE TABLE IF NOT EXISTS … (killers, survivors, maps, perks,
                           matches, match_events, builds, killer_encounters) + pg_trgm
scripts/seed-wiki-data.js  DELETE + re-INSERT reference tables from data/wiki_*.json
scripts/quick-demo.js      Manual end-to-end demo against a running server (needs DB)
scripts/test-ocr.js        Offline extraction-logic tests with mock OCR text
data/wiki_killers.json     43 released killers, verified, rich provenance notes
data/wiki_survivors.json   53 survivors, verified
data/wiki_maps.json        47 maps + 21 realms, verified
data/wiki_perks.json       321 perks (name, type), verified
data/wiki_perks_draft.json LEFTOVER DRAFT — delete after confirming parity (P0-8)
data/wiki_mechanics.json   Gens/hooks/totems/gates/hatch rules incl. history
data/killer-balance-tiers.json  Community meta: 20 killers with tier/kill-rate, map balance,
                                perk meta, MMR analysis (consumed by routes/builds.js)
data/balance-metrics.json  Overlapping older meta snapshot (candidate to merge into above)
data/dbd-callouts.json     Map callouts + clock system + OCR keyword patterns
styles/design-tokens.css   Ink & Iron Glow tokens (DO NOT TOUCH)
styles/dashboard.css       Dashboard styles
demo-splatter.html         Standalone motion demo page (keep, it documents the design system)
```

### 2.3 Database schema (from `scripts/init-db.js`)

- `killers(id, name UNIQUE, real_name, dlc)` — seeded (43)
- `survivors(id, name UNIQUE, real_name, dlc)` — seeded (53), **no API route exposes it**
- `maps(id, name UNIQUE, realm)` — seeded (47)
- `perks(id, name UNIQUE, type, perk_class)` — seeded (321, `perk_class` always NULL)
- `matches(player_name, killer, map, outcome CHECK escape|die|sacrifice, duration_seconds,
  first_hook_seconds, total_hooks, generator_progress, total_heals, total_totems)` — used
- `match_events(match_id FK, event_type, timestamp_seconds, data JSONB)` — **dead, never written**
- `builds(player_name, perks TEXT[], killer_type, win_rate, sample_size)` — written, but
  `win_rate`/`sample_size` **never updated**
- `killer_encounters(...)` — **dead, never written**

### 2.4 What genuinely works today (verified by reading code paths)

- `npm start` boots the API if `DATABASE_URL` points to a reachable Postgres.
- `npm run db:setup` creates schema and seeds all reference data.
- All REST endpoints in §2.2 respond (matches/stats/builds/reference).
- `npx vite` serves the dashboard; the **OCR Test tab** is the only view wired to the real API
  (via Vite proxy `/api` → `:3000`).
- `npm run ocr:test` exercises the text-extraction logic offline.
- OCR pipeline (sharp grayscale/normalize → tesseract eng → keyword extraction) runs, **but**
  `/api/ocr/analyze` crashes on a fresh clone (D3) and perk coverage is 16/321 (D5).

---

## 3. Defect & Gap Inventory (verified, referenced)

Severity: 🔴 blocks core flows · 🟠 wrong/misleading behavior · 🟡 debt/polish.

| ID | Sev | Where | Defect |
|---|---|---|---|
| D1 | 🔴 | `package.json:10` | `npm run dev` runs `node --watch server.js` (backend), but README says it starts the Vite frontend. There is **no script that runs Vite** and **no `build` script** at all. |
| D2 | 🔴 | `package.json`, `electron/` | `electron` is not a dependency and there is no `electron` script, yet README/PHASE2_STATUS instruct `npm run electron`. The entire `electron/` tree is currently unrunnable. |
| D3 | 🔴 | `routes/ocr.js:20,53` | Writes uploads to `tmp/` (repo root), which does not exist in a fresh clone (`.gitignore` has `tmp/*.png` but the dir was never committed) → `ENOENT`, `/api/ocr/analyze` 500s. |
| D4 | 🔴 | `components/Dashboard.jsx:33-69` | `simulateMatch`/`loadStats` are `setTimeout` fakes; Builds view is hardcoded JSX. The dashboard never calls `/api/matches`, `/api/stats/*`, or `/api/builds/*`. Phase 1 "React dashboard with all views ✅" in README is false in substance. |
| D5 | 🟠 | `lib/ocr.js:100-107` | Perk detection = 16 hardcoded keywords vs 321 perks available in `data/wiki_perks.json`. |
| D6 | 🟠 | `lib/ocr.js:130-137` | `totem_active` requires text to contain both `TOTEM` **and** `DULL TOTEM` (contradictory); `exit_gates_open` triggers on the word `ESCAPE` which appears in many screens. |
| D7 | 🟡 | `electron/main.js:41,29` | DevTools always opened; `enableRemoteModule` is a no-op in modern Electron. |
| D8 | 🟠 | `electron/main.js:38` | Production branch loads `../dist/index.html`, but no build pipeline produces `dist/`. |
| D9 | 🟠 | `electron/main.js`, `components/Dashboard.jsx` | Overlay creation and live capture are only reachable via IPC (`window.api.*`), but no UI ever calls them — the React app never references `window.api`. Dead ends both sides. |
| D10 | 🟠 | `server.js:40-200` | Swagger spec omits `/api/stats/by-killer`, `/api/stats/by-map`, all `/api/reference/*`, `/api/builds` GET/POST, `/api/matches/{id}/story`, `/api/ocr/live-session`. |
| D11 | 🟡 | `routes/matches.js:58-70` | `limit`/`offset` query params are passed unvalidated to SQL (`?limit=abc` → 500). Parameterized, so not injectable, but unhandled. |
| D12 | 🟠 | `scripts/init-db.js:59-86` | `match_events` and `killer_encounters` tables are never written or read; `builds.win_rate`/`sample_size` never recomputed. Schema promises analytics the code doesn't deliver. |
| D13 | 🟡 | `routes/ocr.js:53` | Temp filename uses `Date.now()` in a loop — same-millisecond collisions possible in `/live-session`. |
| D14 | 🟡 | `routes/ocr.js:98-105` | `/status` hardcodes `tesseract_version: '5.0.0'` and `status: 'ready'` even before the worker is initialized. |
| D15 | 🔴 | architecture | **Fundamental:** the OCR approach matches killer/map names in full-screen text. During an actual DBD match the HUD shows almost no text (perks/killer are icons; map name is never shown mid-match). Text-based OCR only works reliably on the **end-score screen**, **lobby**, and **loading screen**. The live-overlay vision requires screen-region classification / icon template matching, not more keywords. This is the biggest open design problem — see Phase 2 & Risk R1. |
| D16 | 🟡 | `data/wiki_perks_draft.json`, `electron/ui/` | Leftover draft data file; legacy static UI duplicating the dashboard. |
| D17 | 🔴 | repo-wide | No test framework, no CI, no linter/formatter. `npm test` runs a demo that requires a live DB + server. Nothing protects agents from regressions. |
| D18 | 🟠 | `routes/ocr.js:82-83` | `aggregateGameStates` takes killer/map from frame 0 only; should majority-vote across frames (early frames are the most likely to be garbage). |
| D19 | 🟡 | `routes/matches.js:7-54` | `POST /api/matches` accepts any killer/map string; no validation against reference tables → stats fragment across typos ("The Wraith" vs "WRAITH"). |
| D20 | 🟡 | `server.js:18-20,223` | `pool` is created and exported from `server.js`, and `listen()` runs on import → routes depend on the server module (circular-ish), and the app cannot be imported in tests without opening a port. |
| D21 | 🟡 | `README.md`, `PHASE2_STATUS.md` | Multiple instructions reference nonexistent scripts; DB coverage table says 43/53/47/321 (matches data ✓) but Quick Start steps are wrong (D1/D2). |
| D22 | 🟡 | product | No user model; `player_name` is free text on every request. Acceptable single-user; blocker for Phase 5. |
| D23 | 🟡 | `server.js:23`, `routes/ocr.js:12` | CORS fully open; multer has no file-size limit (a 2 GB "screenshot" is accepted into memory). Must be fixed before any non-localhost deployment. |
| D24 | 🟡 | `package.json` | React declared under `dependencies` of the backend package (mono-package is fine, but no `engines` field, and dev/runtime concerns are mixed). |
| D25 | 🟡 | `lib/ocr.js:10-18` | Killers loaded via `k.title`, survivors elsewhere via `s.name` — the data files genuinely differ (`title` vs `name`). Works, but trap for future agents: **check the JSON shape before mapping.** |

---

## 4. Target Architecture

```
                       ┌────────────────────────────┐
                       │  Electron shell (Phase 3)  │
                       │  main: capture loop, tray  │
                       │  overlay: transparent HUD  │
                       └──────┬─────────────┬───────┘
                              │ IPC         │ HTTP
                    ┌─────────▼──────┐   ┌──▼──────────────────────┐
                    │ React Dashboard│   │ Express API (:3000)     │
                    │ (Vite / :5173  │──▶│  /api/matches /stats    │
                    │  or packaged)  │   │  /builds /reference     │
                    └────────────────┘   │  /ocr                   │
                                         └──┬──────────┬───────────┘
                                            │          │
                                   ┌────────▼───┐  ┌───▼──────────────┐
                                   │ PostgreSQL │  │ OCR engine        │
                                   │ (docker)   │  │ tesseract + sharp │
                                   └────────────┘  │ ROI + fuzzy match │
                                                   └───────────────────┘
```

Key structural decisions already made (do not relitigate):
- Single npm package, ESM, Express + pg with raw SQL (no ORM).
- Reference data vendored as JSON, seeded into Postgres; OCR reads the JSON directly.
- React dashboard talks to the API via the Vite proxy (`/api`), so no CORS needed in dev.
- Electron spawns the backend as a child process and points at `http://localhost:3000`.

Decisions this plan makes (new, binding unless the owner overrides):
- **DB module extraction:** `lib/db.js` owns the Pool; `server.js` exports the Express `app`
  without listening; `bin/start.js` (or a `server.js` guard) calls `listen`. Enables testing. (P0-6)
- **Test stack:** Node's built-in `node:test` runner + `supertest` for API tests — zero heavy deps.
- **Frontend build:** plain `vite build` to `dist/`; Electron loads it in production. (P0-1, P3-2)
- **OCR v2 strategy:** screen-type classifier first (score screen / lobby / in-match / menu),
  then per-screen-type ROI extraction; fuzzy matching (trigram/Levenshtein) against the full
  reference lists instead of exact `includes`. Icon template matching is a Phase 2 stretch goal,
  behind a feature flag. (Phase 2)

---

## 5. Environment Setup (for every agent session)

```bash
# 1. Node 22+ required (repo verified against v22.22.2). ESM only.
node --version

# 2. Install
npm install

# 3. PostgreSQL — after P0-2 exists, just:
docker compose up -d db        # (P0-2 creates docker-compose.yml)
# Until P0-2 lands, any reachable Postgres works:
#   createdb dailite  &&  export DATABASE_URL=postgresql://user:pass@localhost:5432/dailite

# 4. Configure
cp .env.example .env           # edit DATABASE_URL if needed

# 5. Schema + seed (idempotent)
npm run db:setup

# 6. Run
npm start                      # API :3000  (Swagger: /api-docs, health: /health)
npx vite                       # Dashboard :5173  (after P0-1: npm run dev:web)

# 7. Verify baseline
curl -s localhost:3000/health                       # {"status":"ok"}
curl -s localhost:3000/api/reference/killers | head # 43 killers
npm run ocr:test                                    # offline OCR logic tests
```

---

## 6. Work Breakdown Structure

Task ID convention: `P<phase>-<n>`. Sizes: **S** ≤ 1h · **M** ≤ half day · **L** ≥ full day
(in focused-agent time). Every task lists verification that must pass before checking it off.

---

### PHASE 0 — Foundation Repair (make the repo honest and safe to build on)

Everything here unblocks everything else. Do these first, mostly in order.

#### P0-1 · Fix npm scripts and dev workflow (D1) — S
- **Files:** `package.json`, `README.md`
- **Do:** Rename/add scripts so reality matches docs:
  - `"dev:api": "node --watch server.js"`
  - `"dev:web": "vite"`
  - `"dev": "concurrently -n api,web \"npm:dev:api\" \"npm:dev:web\""` (add `concurrently` as devDep)
    — or document two terminals if avoiding the dependency; either is acceptable, but README
    and package.json must agree.
  - `"build": "vite build"` and verify `vite build` succeeds with the root `index.html`.
- **Accept:** `npm run dev:web` serves the dashboard; `npm run build` emits `dist/index.html`;
  README Quick Start commands all exist and work.
- **Verify:** `npm run build && ls dist/index.html` ; manual: dashboard loads on :5173.

#### P0-2 · docker-compose for Postgres + .env alignment — S
- **Files:** new `docker-compose.yml`, `.env.example`, `README.md`
- **Do:** Postgres 16 service, volume, healthcheck; `.env.example` DATABASE_URL matching the
  compose credentials; README setup section rewritten to the exact commands in §5.
- **Accept:** `docker compose up -d db && npm run db:setup && npm start` works on a clean machine.
- **Verify:** the command chain above, then `curl localhost:3000/api/reference/perks | jq length` → 321.

#### P0-3 · Fix OCR temp-dir crash (D3, D13) — S
- **Files:** `routes/ocr.js`
- **Do:** Use `os.tmpdir()` + `fs.mkdtemp`, or `fs.mkdir(tmpDir, {recursive:true})` at module
  init; unique names via `crypto.randomUUID()`. Better: pass the buffer straight to
  `sharp(buffer)` — `lib/ocr.js` already accepts anything sharp accepts, so add a
  `parseBuffer(buffer)` method and skip disk entirely.
- **Accept:** Fresh clone → `POST /api/ocr/analyze` with any PNG returns 200 gameState.
- **Verify:** `rm -rf tmp && curl -F screenshot=@screenshots/UI_dashboard.png localhost:3000/api/ocr/analyze` → 200.

#### P0-4 · Test infrastructure: node:test + supertest + first tests (D17) — M
- **Files:** new `test/` dir, `package.json`, refactor dependency on P0-6 (do P0-6 first or together)
- **Do:** `npm test` → `node --test test/`. Port `scripts/test-ocr.js` assertions into
  `test/ocr-extraction.test.js` (pure logic, no DB). Add `test/api.test.js` with supertest
  against the exported app + a test database (env `DATABASE_URL_TEST`, skip-if-unset so tests
  still run without Postgres).
- **Accept:** `npm test` passes offline (DB-dependent tests skip cleanly when no test DB).
- **Verify:** `npm test` twice (idempotence); intentionally break an extractor → test fails.

#### P0-5 · CI pipeline — S
- **Files:** new `.github/workflows/ci.yml`
- **Do:** on push/PR: `npm ci`, `npm test`, `npm run build`. Add a Postgres service container
  and run db:setup + API tests against it.
- **Accept:** CI green on the current branch.
- **Verify:** push, check Actions run.

#### P0-6 · Extract DB pool, make app importable (D20) — S
- **Files:** new `lib/db.js`, `server.js`, all `routes/*.js`
- **Do:** `lib/db.js` exports `pool`; routes import from there; `server.js` exports `app` and
  only listens when run directly (`if (import.meta.url === pathToFileURL(process.argv[1]).href)`
  or a tiny `bin/start.js`). No behavior change otherwise.
- **Accept:** `npm start` unchanged; `import app from './server.js'` opens no port.
- **Verify:** `npm test` (supertest imports app); `npm start` + `curl /health`.

#### P0-7 · Input validation & hardening pass (D11, D19, D23) — M
- **Files:** `routes/matches.js`, `routes/ocr.js`, `server.js`, possibly new `lib/validate.js`
- **Do:** clamp/parse `limit` (1–200) & `offset` (≥0); multer limits (`fileSize: 10MB`,
  image mimetypes only); `express.json({limit:'25mb'})` for base64 batches; on `POST /api/matches`
  validate killer against `killers` table (case-insensitive) and map against `maps` — reject 422
  with the closest fuzzy match in the error body (reuse pg_trgm similarity).
- **Accept:** `?limit=abc` → 400 not 500; 20 MB upload → 413; `killer: "Wraith"` → 422 with
  suggestion `The Wraith` (decide + document: auto-normalize instead of reject is also fine —
  pick one, write it in the route comment and Swagger).
- **Verify:** curl matrix for each case; existing tests still green.

#### P0-8 · Repo hygiene (D16, D24, D7 partial) — S
- **Files:** `data/wiki_perks_draft.json`, `electron/ui/`, `package.json`, `.gitignore`
- **Do:** diff draft vs final perks JSON (`python3`/`node` one-liner); if final ⊇ draft, delete
  draft. Decide `electron/ui/`: it predates the React dashboard — delete it and note in the
  commit message that the React app is the sole UI (if the owner objects it's one `git revert`).
  Add `"engines": {"node": ">=22"}`. Remove `tmp/*.png` gitignore line if P0-3 moved temp files
  to os.tmpdir.
- **Accept:** no unreferenced data/UI duplicates remain; `npm start`/`vite` unaffected.
- **Verify:** `grep -rn "wiki_perks_draft\|electron/ui" --include="*.js*" .` → no code references.

#### P0-9 · Complete the OpenAPI spec (D10, D14) — M
- **Files:** `server.js` (or extract spec to `lib/openapi.js`)
- **Do:** document every existing endpoint incl. stats by-killer/by-map, reference routes,
  builds GET/POST, matches/{id}/story, ocr/live-session. Fix `/api/ocr/status` to report real
  init state (`ocrParser.initialized`) and read the tesseract version from
  `node_modules/tesseract.js/package.json` (or `createRequire`-import it).
- **Accept:** every route in `routes/` appears in `/api-docs`; status endpoint truthful.
- **Verify:** `curl -s localhost:3000/api-docs/ | grep -o 'swagger'`; manual click-through;
  a test asserting spec paths ⊇ registered express routes (nice-to-have).

#### P0-10 · README truth pass (D21) — S
- **Depends:** P0-1..P0-3
- **Do:** Rewrite Quick Start & scripts sections to the new reality; move aspirational content
  under a clearly labeled Roadmap; link to this MASTERPLAN as the canonical plan; delete or
  archive stale claims in `PHASE2_STATUS.md` (add a banner pointing here).
- **Accept:** every command in README executes successfully on a clean clone.
- **Verify:** literally execute each README command block.

---

### PHASE 1 — Real Data End-to-End (kill the mocks)

Goal: the dashboard is a real client of the real API; a match can be logged manually and every
view reflects the database. This is the moment the app becomes *true*.

#### P1-1 · API client module for the frontend — S
- **Files:** new `lib/api-client.js`
- **Do:** thin fetch wrapper (`getJSON/postJSON`, error normalization, base `/api`). No axios in
  the browser bundle — native fetch.
- **Accept:** used by all subsequent P1 tasks; unit-testable error mapping.
- **Verify:** `npm test` unit test with mocked fetch.

#### P1-2 · Match logging form (replaces "Simulate Match" as primary flow) — M
- **Files:** `components/Dashboard.jsx` (or new `components/MatchForm.jsx`)
- **Do:** form: player name (persist in `localStorage`), killer (dropdown from
  `/api/reference/killers`), map (dropdown from `/api/reference/maps`), outcome, duration,
  hooks, first-hook time, gen %, heals, totems, perks (4× autocomplete from
  `/api/reference/perks?type=Survivor`). Submit → `POST /api/matches` → navigate to Match view
  fed by the *server* response + `GET /api/matches/:id/story`.
  Keep "Simulate Match" as a secondary dev button that POSTs randomized real data to the API
  (so it also exercises the backend) instead of setTimeout fakes.
- **Note:** matches table has no perks column yet — see P1-5; build the form now, wire perks
  storage when P1-5 lands (or do P1-5 first).
- **Accept:** logging a match from the UI creates a DB row; Match view shows server data and
  the server-generated story; hard refresh + Stats view reflects it.
- **Verify:** UI flow + `psql -c 'select count(*) from matches'` increments; screenshot for the PR.

#### P1-3 · Stats view on real endpoints — M
- **Files:** `components/Dashboard.jsx` / new `components/StatsView.jsx`
- **Do:** `GET /api/stats/summary`, `/by-killer`, `/by-map` for the current player; render the
  existing tiles plus two tables (per-killer, per-map) with escape rate; keep SPLATTER
  components for presentation; empty-state UI when 0 matches.
- **Accept:** numbers match SQL by hand for a seeded set of ≥5 matches.
- **Verify:** insert 5 known matches via curl, compare UI vs expected values.

#### P1-4 · Builds view on real endpoints — M
- **Files:** `components/BuildsView.jsx` (new), `routes/builds.js`
- **Do:** perk picker (4 slots, autocomplete over 321 perks), killer select, MMR select →
  `POST /api/builds/analyze`; render tier, kill-rate, meta status, perk issues, recommendation.
  "Save build" → `POST /api/builds`; list saved builds (`GET /api/builds`) with re-analyze button.
- **Accept:** analysis reflects `data/killer-balance-tiers.json` (e.g. THE NURSE → S-tier note)
  and the player's real history sample size.
- **Verify:** UI flow; curl parity check against the same payload.

#### P1-5 · Store perks & killer-encounter rollup with matches (D12 part 1) — M
- **Files:** `scripts/init-db.js` (+ new `scripts/migrations/001_match_perks.sql` — start a
  simple numbered-migration convention; init-db applies all in order), `routes/matches.js`,
  `routes/stats.js`
- **Do:** `ALTER TABLE matches ADD COLUMN perks TEXT[] DEFAULT '{}'`. On match insert, also
  upsert `killer_encounters(player_name, killer_name, perks, encounters+1, win_count+escape?1:0)`.
  New endpoint `GET /api/stats/by-perk?player_name=` → per-perk escape rate from matches.perks.
- **Accept:** creating a match with perks populates both tables; by-perk stats correct.
- **Verify:** SQL spot checks; new API test.

#### P1-6 · Recompute builds.win_rate from history (D12 part 2) — S
- **Files:** `routes/builds.js`
- **Do:** when analyzing or listing builds, compute win_rate/sample_size live from matches
  where `matches.perks @> build.perks AND killer = build.killer_type` (containment), and
  persist the refreshed numbers on the build row.
- **Accept:** saved build shows real win rate after matches with those perks exist.
- **Verify:** scripted scenario in an API test.

#### P1-7 · Surface survivors + mechanics reference (close the API gap) — S
- **Files:** `routes/reference.js`, `server.js` spec
- **Do:** `GET /api/reference/survivors`; `GET /api/reference/mechanics` (serves
  `data/wiki_mechanics.json`); add both to Swagger.
- **Accept:** 53 survivors via API; mechanics JSON served.
- **Verify:** curl + jq length checks.

#### P1-8 · Delete remaining mock code & dead paths — S
- **Depends:** P1-2..P1-4
- **Do:** remove setTimeout mocks, hardcoded Builds JSX, unused `start-match-simulation` IPC;
  ensure every view has loading/error/empty states (OrbitLoader exists for loading).
- **Accept:** `grep -rn "setTimeout" components/` → only legit UI debounce (if any).
- **Verify:** grep + full UI click-through with backend stopped → graceful errors, not blank screens.

---

### PHASE 2 — OCR v2 (from demo to dependable)

Goal: a DBD **end-score-screen screenshot** is parsed into a complete, correct match record with
≥90% killer/map accuracy, and the honest limits of live in-match OCR are established.

#### P2-1 · Ground-truth screenshot corpus — M *(needs the owner / a human with the game)*
- **Files:** new `test/fixtures/screenshots/` + `test/fixtures/labels.json`
- **Do:** collect ≥30 real screenshots: score screens (most), lobby, loading screen, in-match
  HUD, at 1080p and 1440p, EN client. Label each: screen_type, killer, map, perks, outcome.
  **This is the only task an LLM cannot do alone — request the images from the owner and
  block Phase 2 accuracy work on it.** Everything else in Phase 2 can proceed with synthetic
  fixtures (rendered text images) but must be re-validated once real images land.
- **Accept:** corpus + labels committed (or LFS/linked if large).

#### P2-2 · Fuzzy matching engine (replace substring `includes`) — M
- **Files:** `lib/ocr.js`, new `lib/fuzzy.js`, tests
- **Do:** normalized-token matching with Levenshtein/trigram similarity against ALL killers (43),
  maps (47), perks (321) loaded from `data/`; return `{value, score}`; threshold configurable;
  handles OCR confusions (0/O, 1/I/l, missing diacritics — note `The Onryō`). Load perk list
  from `wiki_perks.json` (fixes D5). Fix objective logic (D6): totem/gate detection rewritten
  with explicit phrases; document each pattern with the screen it appears on.
- **Accept:** `test/ocr-extraction.test.js` extended with corrupted-text cases
  (`"THE WRA1TH"` → The Wraith ≥0.8) passes; all 321 perks findable.
- **Verify:** `npm test`.

#### P2-3 · Screen-type classifier + per-screen ROI pipeline (attacks D15) — L
- **Files:** `lib/ocr.js`, new `lib/screens.js`
- **Do:** classify screenshot into `score_screen | lobby | loading | in_match | menu | unknown`
  using cheap signals (anchor phrases from a fast low-res OCR pass and/or layout heuristics).
  For `score_screen`: crop fixed ROIs (player rows, killer name area, map/offering area) scaled
  by resolution, OCR each ROI separately with sharp preprocessing tuned per ROI
  (threshold/invert — DBD UI is light-on-dark), merge results. For `in_match`: extract only
  what is truly text (hook stage numbers if visible, status texts), and set
  `gameState.reliability: 'low'`. Return `screen_type` in the API response.
- **Accept:** on the P2-1 corpus: screen-type accuracy ≥95%; killer+map accuracy on score
  screens ≥90%; measured and recorded in `test/fixtures/RESULTS.md`.
- **Verify:** new `npm run ocr:bench` script printing per-field accuracy against labels.json.

#### P2-4 · OCR-to-match ingestion flow — M
- **Files:** `routes/ocr.js`, `components/OCRTester.jsx` → rename to `components/OCRImport.jsx`
- **Do:** `POST /api/ocr/import`: analyze screenshot → map gameState to a match draft →
  respond with the draft + confidence per field. Frontend: after analysis show an editable
  pre-filled MatchForm (P1-2 component) — user confirms → real `POST /api/matches`.
  Never auto-insert without confirmation below a confidence threshold (0.9 default).
- **Accept:** screenshot upload → confirm → match row exists with correct fields.
- **Verify:** end-to-end with a fixture score screen.

#### P2-5 · live-session aggregation fixes (D18) — S
- **Files:** `routes/ocr.js`
- **Do:** majority-vote killer/map across frames weighted by confidence; ignore `unknown`
  screen types; `hook_count` = max (hooks only go up), not average.
- **Accept:** unit test: frames `[null, 'THE WRAITH', 'THE WRAITH', 'THE HAG']` → THE WRAITH.
- **Verify:** `npm test`.

#### P2-6 · (Stretch, feature-flagged) Perk-icon template matching — L
- **Files:** new `lib/icon-match.js`, `data/perk-icons/` (sourced from wiki, check license/attribution)
- **Do:** only attempt after P2-3 ships and proves text-OCR ceiling. Crop the 4 perk-slot ROIs
  (lobby/score screen), compare against icon thumbnails (sharp resize + perceptual hash or
  normalized cross-correlation). Behind `OCR_ICON_MATCHING=1`.
- **Accept:** ≥80% top-1 perk identification on corpus lobby shots; zero impact when flag off.
- **Verify:** bench script extension.

---

### PHASE 3 — Electron Desktop & Overlay (make the flagship demo real)

Goal: `npm run electron:dev` opens the dashboard in a desktop shell; one click starts screen
capture; the overlay renders live state; the packaged app installs on Windows (DBD's platform).

#### P3-1 · Make Electron runnable at all (D2, D7) — M
- **Files:** `package.json`, `electron/main.js`
- **Do:** add `electron` devDependency; scripts `"electron:dev": "NODE_ENV=development electron electron/main.js"`
  (use `cross-env` for Windows). Gate `openDevTools()` behind dev; remove `enableRemoteModule`;
  don't spawn the backend if :3000 already responds (dev runs it separately); graceful child
  shutdown on quit (already partially there).
- **Accept:** with API+Vite running, `npm run electron:dev` opens the React dashboard in a window.
- **Verify:** manual launch; note: inside this cloud container Electron cannot open a display —
  verification of windowed behavior must happen on the owner's machine; CI can at least
  `electron --version` and lint the main process with `node --check`.

#### P3-2 · Production load path (D8) — S
- **Depends:** P0-1
- **Do:** `"electron:prod"` runs `vite build` then Electron without NODE_ENV=development,
  loading `dist/index.html`; verify relative asset paths (`base: './'` in vite config for file://).
- **Accept:** prod-mode window renders the dashboard from dist with working styles.

#### P3-3 · Wire capture controls into the dashboard (D9) — M
- **Files:** `components/LiveCapture.jsx` (new), `Dashboard.jsx`, `electron/preload.js`
- **Do:** new "⚡ Live" tab, rendered only when `window.api` exists (web build unaffected):
  display picker (`listDisplays`), start/stop live capture, interval selector (use
  `electron/overlay-config.js` presets), live gameState feed via `onGameStateUpdate`,
  "Create overlay" button (`createOverlay(displayIndex)`).
- **Accept:** in Electron: start capture → gameState updates stream into the tab; overlay
  toggles on the chosen display. In browser: no Live tab, no errors.
- **Verify:** owner-machine test script documented in `docs/LIVE_TEST.md` (write it).

#### P3-4 · Overlay lifecycle & suggestion engine hookup — M
- **Files:** `electron/main.js`, `electron/overlay.html`
- **Do:** overlay auto-hides when screen_type ≠ in_match/score for N frames; ESC-corner
  click-through stays enabled (`setIgnoreMouseEvents(true)` already set); suggestions read
  from gameState + `data/killer-balance-tiers.json` recommendations (main process fetches
  `/api/builds/analyze` context or serves static tips per killer); throttle renderer updates
  (overlay-config fps caps).
- **Accept:** simulated frame stream (feed fixture screenshots through the loop) drives
  visible overlay updates; no memory growth over 30 min (log `process.memoryUsage` deltas).

#### P3-5 · Packaging — L
- **Files:** `package.json`, new `electron-builder.yml` (or forge config)
- **Do:** electron-builder; Windows NSIS target first (DBD platform), portable zip second;
  bundle backend + node runtime (electron main spawns bundled server or run API in-process
  via P0-6's importable app — prefer in-process: `import app` and `app.listen(3000)` in main).
  Postgres cannot be bundled — add a `DAILITE_DB=sqlite|postgres` decision task: for the
  packaged single-user app, evaluate swapping pg for embedded SQLite behind `lib/db.js`
  (this is why P0-6 matters). **Decision gate: ask the owner before implementing SQLite.**
- **Accept:** installer artifact builds in CI (windows runner); installs & runs on owner's PC.

---

### PHASE 4 — Analytics Depth (the actual product value)

#### P4-1 · Match events timeline (D12 part 3) — M
- `POST /api/matches/:id/events` + write path from OCR live sessions (state transitions →
  events: hook detected, gen % jumps, gate powered). Story generator upgraded to use events.
- **Accept:** story references real event timestamps when events exist.

#### P4-2 · Trends endpoint + charts — M
- `GET /api/stats/trends?player_name=&window=20` → rolling escape rate, duration trend.
  Frontend chart (SVG, no chart lib, respect design tokens; consult the `dataviz` skill if
  building in a Claude session).
- **Accept:** trend math verified against hand-computed fixture; renders in Stats view.

#### P4-3 · Killer matchup detail pages — M
- Click a killer in Stats → per-killer page: history, best/worst perks (from P1-5 data),
  balance-tier context, callout tips for that killer's common maps (`data/dbd-callouts.json`).

#### P4-4 · Build tier list — M
- Rank the player's saved builds by real win rate with confidence intervals (Wilson score,
  since samples are small — document the formula in code).

#### P4-5 · Data refresh protocol — S
- `docs/DATA_REFRESH.md`: how to re-verify `data/wiki_*.json` against wiki.gg after a new DBD
  chapter (follow the method in `WIKI_AUDIT_2026-07-06.md`), incl. the known traps recorded
  there (killer *title* vs nickname — e.g. "The Good Guy" not "Chucky"; Cenobite category gap;
  upcoming-killer exclusions). Add `npm run data:check` that validates JSON shape + counts.

---

### PHASE 5 — Multi-User & Cloud (only after 0–4 are done)

Gate: **explicit owner go-ahead required** — this changes cost/hosting/privacy posture.

- P5-1 · User model + auth (start with local profiles table replacing free-text player_name;
  real auth only if hosting happens). Fixes D22.
- P5-2 · Deployment target decision (Railway/Fly/Render for API+PG; overlay stays local),
  CORS tightening + rate limiting (closes D23 for real).
- P5-3 · Sync protocol: local-first, push match rows to cloud, conflict = server wins on
  reference data, client wins on own matches.
- P5-4 · Privacy pass: what leaves the machine (screenshots never do — only extracted state).

### PHASE 6 — Release Engineering

- P6-1 · Version 1.0 checklist: all ledger items P0–P3 checked, OCR accuracy report ≥ targets,
  packaged installer smoke-tested on Windows, README/GIFs updated.
- P6-2 · GitHub Release with installer artifact + changelog generated from ledger commits.
- P6-3 · Post-1.0 backlog triage (Phase 4/5 leftovers → GitHub issues, one per ledger row).

---

## 7. Conventions

- **Code style:** match existing — 2-space indent, semicolons, single quotes, ESM imports at top.
  If adding a linter (P0-4 may include it): `eslint` flat config + `prettier` defaults; do not
  reformat untouched files in the same commit as logic changes.
- **SQL:** parameterized always. Raw SQL in route files is the local idiom — keep it; extract
  to `lib/queries/` only when a query is used twice.
- **Errors:** routes return `{error: string}` with correct status; log with `console.error`
  including the route name (existing pattern).
- **API design:** plural resources, query param `player_name` for scoping (until P5-1),
  20x/4xx per existing routes; every new endpoint lands in the OpenAPI spec in the same commit.
- **Frontend:** functional components + hooks; design tokens for all colors/spacing — no
  hex literals in components; SPLATTER components for motion.
- **Docs:** every phase-completing commit updates README's status section and this ledger.

## 8. Testing Strategy

| Layer | Tool | Trigger |
|---|---|---|
| OCR extraction logic | node:test, pure fixtures | `npm test`, CI |
| OCR accuracy | `npm run ocr:bench` vs labeled corpus | manual + CI (report-only) |
| API | supertest vs test DB (service container) | `npm test`, CI |
| Frontend | smoke: `vite build` must pass; component tests optional (vitest if added) | CI |
| Electron | `node --check` main-process files in CI; windowed behavior on owner machine per `docs/LIVE_TEST.md` | per Phase-3 task |
| E2E happy path | Playwright (already a devDep): log match → stats reflect it | CI after P1-3 |

## 9. Risk Register

| ID | Risk | Mitigation |
|---|---|---|
| R1 | **In-match live OCR may be fundamentally low-yield** (D15: HUD is icons, not text). The overlay vision could over-promise. | P2-3 measures per-screen-type yield honestly; overlay scope pivots to lobby+score+coaching-between-matches if in-match extraction stays <50% useful. Decide at the P2-3 accuracy report. |
| R2 | No real-screenshot corpus without the owner (P2-1). | Block accuracy claims on it; synthetic fixtures clearly marked. |
| R3 | Packaged app needs a database; Postgres won't ship in an installer. | P3-5 decision gate: SQLite behind `lib/db.js` abstraction (enabled by P0-6). |
| R4 | New DBD chapters invalidate reference data (~quarterly). | P4-5 refresh protocol + `data:check` script; `as_of_date` fields already exist in the JSON. |
| R5 | Balance meta files (`killer-balance-tiers.json`, `balance-metrics.json`) overlap and will drift apart. | Merge into one file with provenance during P1-4 (small subtask; keep `killers_extended` shape that `routes/builds.js` reads). |
| R6 | Electron + always-on-top overlay vs game anti-cheat: DBD uses EAC; windowed overlays are generally fine (like Discord), but **never** attempt input automation or memory access. | Documented in §1 non-goals; overlay stays a passive capture consumer. |
| R7 | Agents "fixing" the design system. | §0 rule 8; splatter/tokens are read-only. |

## 10. Definition of Done

**Per task:** acceptance criteria pass · verification commands run and quoted in the PR/commit ·
ledger updated · docs touched by the change updated · no new console errors in the affected flow.

**v1.0 (the "app is finished" bar):**
1. Clean clone → §5 commands → working app, zero manual fixes.
2. A match can be logged three ways: form, screenshot import (score screen), simulated.
3. Stats/Builds/Story views are DB-backed with empty/error states; no mock data anywhere.
4. OCR: ≥90% killer+map on score-screen corpus; measured report committed.
5. Electron: dashboard shell + live capture + overlay run on the owner's Windows machine;
   installer artifact produced by CI.
6. `npm test` green in CI incl. API tests; E2E happy path green.
7. README accurate end-to-end; MASTERPLAN ledger fully checked through Phase 3.

## 11. Open Questions for the Owner (answer before the marked tasks)

1. **P2-1:** Please provide ≥30 labeled DBD screenshots (score screen, lobby, loading, in-match;
   1080p+1440p). This is the only hard external dependency.
2. **P3-5:** OK to move the packaged single-user app to SQLite (Postgres stays supported for
   dev/cloud)? Affects `lib/db.js` design.
3. **Phase 5:** Should cloud/multi-user happen at all, or is DAILITE staying a local tool?
4. **P0-8:** Confirm `electron/ui/` (legacy static UI) can be deleted.
5. Game client language is EN? (OCR keyword patterns and tesseract `eng` assume it; DE support
   would be a new Phase-2 task: `deu` traineddata + German UI strings in the fuzzy lists.)

## 12. Status Ledger (the ground truth — update in every task commit)

Legend: `[ ]` open · `[x]` done (append commit hash) · `[~]` in progress (append session/agent note)

### Phase 0 — Foundation Repair
- [ ] P0-1 Fix npm scripts & dev workflow (D1) — deps: none
- [ ] P0-2 docker-compose Postgres + env alignment — deps: none
- [ ] P0-3 Fix OCR temp-dir crash (D3, D13) — deps: none
- [ ] P0-6 Extract DB pool, importable app (D20) — deps: none
- [ ] P0-4 Test infra: node:test + supertest (D17) — deps: P0-6
- [ ] P0-5 CI pipeline — deps: P0-4
- [ ] P0-7 Validation & hardening (D11, D19, D23) — deps: P0-4
- [ ] P0-8 Repo hygiene (D16, D24) — deps: none · **owner Q4 for electron/ui**
- [ ] P0-9 Complete OpenAPI spec (D10, D14) — deps: none
- [ ] P0-10 README truth pass (D21) — deps: P0-1, P0-2, P0-3

### Phase 1 — Real Data End-to-End
- [ ] P1-1 Frontend API client — deps: P0-1
- [ ] P1-5 matches.perks column + encounter rollup (D12) — deps: P0-4
- [ ] P1-2 Match logging form (kills mock #1, D4) — deps: P1-1, P1-5
- [ ] P1-3 Stats view on real endpoints (D4) — deps: P1-1
- [ ] P1-4 Builds view on real endpoints (D4) — deps: P1-1 · includes R5 meta-file merge
- [ ] P1-6 Recompute build win rates (D12) — deps: P1-5
- [ ] P1-7 Survivors + mechanics reference endpoints — deps: none
- [ ] P1-8 Delete all mock/dead code — deps: P1-2, P1-3, P1-4

### Phase 2 — OCR v2
- [ ] P2-1 Ground-truth screenshot corpus — deps: **owner Q1** 🚧
- [ ] P2-2 Fuzzy matching engine (D5, D6) — deps: P0-4
- [ ] P2-3 Screen classifier + ROI pipeline (D15) — deps: P2-2; accuracy sign-off needs P2-1
- [ ] P2-4 OCR-to-match import flow — deps: P1-2, P2-3
- [ ] P2-5 live-session aggregation fixes (D18) — deps: P2-2
- [ ] P2-6 (Stretch) Perk-icon template matching — deps: P2-3, P2-1

### Phase 3 — Electron Desktop & Overlay
- [ ] P3-1 Make Electron runnable (D2, D7) — deps: P0-1
- [ ] P3-2 Production load path (D8) — deps: P3-1
- [ ] P3-3 Capture controls in dashboard (D9) — deps: P3-1, P1-1
- [ ] P3-4 Overlay lifecycle + suggestions — deps: P3-3, P2-3
- [ ] P3-5 Packaging — deps: P3-2, P0-6 · **owner Q2 decision gate**

### Phase 4 — Analytics Depth
- [ ] P4-1 Match events timeline — deps: P1-5, P2-4
- [ ] P4-2 Trends endpoint + charts — deps: P1-3
- [ ] P4-3 Killer matchup pages — deps: P1-3, P1-5
- [ ] P4-4 Build tier list (Wilson score) — deps: P1-6
- [ ] P4-5 Data refresh protocol + data:check — deps: none

### Phase 5 — Multi-User & Cloud (**owner Q3 gate**)
- [ ] P5-1 Profiles/auth (D22)
- [ ] P5-2 Deployment + hardening (D23 final)
- [ ] P5-3 Sync protocol
- [ ] P5-4 Privacy pass

### Phase 6 — Release
- [ ] P6-1 v1.0 checklist
- [ ] P6-2 GitHub Release + changelog
- [ ] P6-3 Backlog → issues

---

## 13. Handoff Prompt Template (paste this to spawn an agent on a task)

```
You are working on DAILITE (github.com/Lootziffer666/DAILITE), branch <branch>.
Read MASTERPLAN.md fully — especially §0 (operating manual), §3 (defect inventory),
and your task's entry in §6.

Your task: <P?-?> <title>.
Do not start other tasks. Follow §7 conventions. When done:
1. Run the task's verification commands and paste their output in your summary.
2. Update the §12 ledger entry to [x] with the commit hash.
3. Commit with subject "<P?-?>: <imperative summary>" and push.
4. Report: what changed, what you verified, which tasks are now unblocked.
```
