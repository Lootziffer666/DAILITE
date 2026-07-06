# DAILITE API Reference & Data Export

**Generated:** 2026-07-06  
**Data Source:** deadbydaylight.wiki.gg (verified and reconciled)

---

## 📊 Database Statistics

| Entity | Count | Status |
|--------|-------|--------|
| **Killers** | 43 | ✅ All released killers |
| **Survivors** | 53 | ✅ All released survivors |
| **Maps** | 47 | ✅ All playable maps + 1 upcoming |
| **Realms** | 21 | ✅ All realms |
| **Perks** | 321 | ✅ All teachable perks |

---

## 🔌 API Endpoints

### Killers
```bash
GET /api/reference/killers
```
**Response:** Array of 43 killers with:
- `name` - In-game title (e.g., "The Trapper")
- `real_name` - Actor/Character name (e.g., "Evan MacMillan")
- `dlc` - Origin (Original / Licensed)
- `chapter` - Release chapter (metadata)

**Sample:**
```json
{
  "id": 1,
  "name": "The Trapper",
  "real_name": "Evan MacMillan",
  "dlc": "Original",
  "created_at": "2026-07-06T..."
}
```

---

### Maps
```bash
GET /api/reference/maps
```
**Response:** Array of 47 maps with:
- `name` - Map name (e.g., "Coal Tower")
- `realm` - Parent realm (e.g., "The MacMillan Estate")

**Sample:**
```json
{
  "id": 1,
  "name": "Coal Tower",
  "realm": "The MacMillan Estate",
  "created_at": "2026-07-06T..."
}
```

---

### Perks
```bash
GET /api/reference/perks[?type=Killer&limit=10]
```
**Response:** Array of perks with:
- `name` - Perk name
- `type` - Killer / Survivor
- `perk_class` - Category (optional, NULL for wiki-sourced)

**Sample:**
```json
{
  "id": 1,
  "name": "A Nurse's Calling",
  "type": "Killer",
  "perk_class": null,
  "created_at": "2026-07-06T..."
}
```

---

## 🎯 Data Verification

### Source Audit
- ✅ Wiki crawled: https://deadbydaylight.wiki.gg/wiki/Killers
- ✅ Cross-referenced: Category pages
- ✅ Reconciled: Wiki's own stated totals
- ✅ Methodology: Lua datatable queries for accuracy

### Coverage Improvement
| Feature | Before | After | Increase |
|---------|--------|-------|----------|
| Killer Recognition | 22 | 43 | **+95%** |
| Survivor Tracking | 0 | 53 | **NEW** |
| Map Recognition | 12 | 47 | **+292%** |
| Perk Coverage | 35 | 321 | **+817%** |

---

## 📁 Files in `/screenshots`

- `killers.json` - All 43 killer records
- `maps.json` - All 47 map records
- `perks.json` - All 321 perk records
- `API_REFERENCE.md` - This file

---

## 🚀 Usage Example

### Analyze a Match
```javascript
// After screenshot OCR recognizes killer name: "THE TRAPPER"
const killer = await fetch('/api/reference/killers?name=The Trapper');
const killerData = await killer.json();
// Returns full killer profile with real name, origin, chapter, etc.
```

### Track Maps
```javascript
// Get all maps in a specific realm
const maps = await fetch('/api/reference/maps?realm=The MacMillan Estate');
const realmMaps = await maps.json();
// Returns all playable variations within that realm
```

---

## ✨ Next Steps

- [ ] OCR Testing: Verify all 43 killers recognized in screenshots
- [ ] Survivors API Endpoint: Add GET `/api/reference/survivors`
- [ ] Match Analysis: Expand to track survivor perks and strategies
- [ ] Statistics: Aggregate performance by killer/map/perk combinations
