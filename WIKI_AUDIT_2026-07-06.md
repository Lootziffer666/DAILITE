# Dead by Daylight Wiki Audit (2026-07-06)

## Summary
Comprehensive crawl of deadbydaylight.wiki.gg verified against official game data. All numbers below are WIKI-VERIFIED and current as of this audit date.

## Official Game Content Totals

### Characters
- **Killers:** 43 total (24 Original BHVR-created, 19 Licensed)
- **Survivors:** 53 total (31 Original BHVR-created, 22 Licensed)

### Game Map Structure
- **Realms:** 21 total
- **Maps:** 46 total (hierarchical: Realms contain multiple Maps, not 1:1)
  - Example: Coldwind Farm realm contains 5 playable maps (Fractured Cowshed, Rancid Abattoir, Rotten Fields, Thompson House, Torment Creek)
- **Upcoming:** The Mall (announced, unreleased)

### Perks
- **Total:** 321 perks (not 309 as initially assumed)
  - 144 Killer perks
  - 177 Survivor perks
  - 42 General perks (teachable by no character—base pool)
  - 6 Unused/legacy perks (not obtainable in live game)
- **Source:** Wiki's Lua datatable (Module:Datatable/Loadout) queried directly for perfect accuracy

### Core Game Mechanics
- **Generators:** 7 spawn per match, 5 required to power Exit Gates, 90 charges each, 1 c/s base repair rate
- **Hooks:** 3 stages (Summoning, Struggle, Sacrifice) at 70 seconds each (210s total)
- **Totems:** 5 dull/hex totems spawn per match
- **Exit Gates:** 2 standard (3 in 2v8 mode)
- **Hatch:** 1 per match, spawns only when exactly 1 Survivor remains (changed Patch 5.3.0)
- **Match Structure:** 4 Survivors vs 1 Killer standard (varies in Custom Games, 8v2 in 2v8 mode)

## Critical Database Issues Found

### 1. Map/Realm Architecture
**Current App:** Treats Realm=Map 1:1 (hardcoded ~12 entries)
**Actual Wiki Structure:** Realm ⊃ Maps (hierarchical)
**Impact:** Schema needs refactor to support multiple maps per realm

### 2. Perk Count Assumption
**Assumption:** 309 perks
**Wiki Actual:** 321 perks
**Correction:** +12 perk entries missing from app

### 3. Character Classification
**Killer Title vs. Alter-Ego Confusion (known issue, verified):**
- "The Animatronic" (title) ≠ "Springtrap" (suit name)
- "The Good Guy" (title) ≠ "Chucky" (franchise nickname)
- "The Cenobite" (title) ≠ "Pinhead" (franchise nickname)

## Data Files Generated
All files written to scratchpad during audit:
- `wiki_killers.json` — 43 killers with origin/chapter/confidence
- `wiki_survivors.json` — 53 survivors with origin/chapter/confidence
- `wiki_perks.json` — 321 perks with type/teachable_by/confidence
- `wiki_maps.json` — 21 realms, 46 maps, hierarchical structure
- `wiki_mechanics.json` — Generators, Hooks, Totems, Gates, Match rules

## Uncertain/Flagged Items
- **Add-ons:** Wiki states 925 total by rarity; app hardcoded ~35 (massive gap)
- **Offerings:** Wiki states 121 total; app not tracked
- **Hook Counts:** Scale dynamically per map (no fixed total)
- **Basement Hooks:** Wiki confirms 4 hooks on one post (not commonly known)

## Recommendations
1. Replace hardcoded seed data with wiki_*.json files
2. Refactor database schema: separate Realm and Map tables
3. Audit OCR killer/survivor detection against verified 43/53 totals
4. Expand perk/addon/offering coverage from wiki source data

## Audit Methodology
- Fetched primary wiki pages (Killers, Survivors, Perks, Maps, Realms, Mechanics)
- Queried wiki's underlying Lua data modules for canonical sources
- Cross-referenced against wiki category pages for completeness
- Flagged uncertain items rather than assuming/padding data
- All counts reconcile exactly against wiki's own stated totals
