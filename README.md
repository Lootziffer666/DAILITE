# DAILITE 🎮⚡

**Dead by Daylight Personal Analytics**  
Match analytics engine combining Ink & Iron Glow design with FLUBBER's playful motion chaos.

---

## What is DAILITE?

Not just win/loss tracking. **Real insight into your gameplay:**

- 📖 **Match Stories** - Narrative summaries instead of raw stats
- 📊 **Advanced Analytics** - Chase duration, hook timing, generator efficiency, heal time
- 🔮 **Build Coach** - Personalized perk effectiveness vs killer types
- 👹 **Killer Database** - Track your performance against each killer
- 🗺️ **Map Knowledge** - Performance breakdowns by map
- ⚡ **Real-time Overlay** - Live game suggestions (when OCR is ready)

---

## Tech Stack

### Backend
- **Node.js + Express** - OpenAPI 3.0 REST API
- **PostgreSQL** - Match & stats persistence
- **Swagger** - Interactive API docs

### Frontend  
- **React 18** - Dashboard UI
- **Vite** - Fast dev server
- **CSS Tokens** - Ink & Iron Glow design system
- **SPLATTER Motion** - FLUBBER's adaptive motion grammar

### Phase 2 (Coming)
- **Tesseract.js** - OCR for Dead by Daylight UI
- **Electron** - Desktop app with screen capture

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend (Terminal 1)
```bash
npm run db:setup  # Initialize + seed database
npm start         # Backend on localhost:3000
```

### 3. Start Frontend (Terminal 2)
```bash
npm run dev       # Vite dev server on localhost:5173
```

### 4. Visit Dashboard
```
http://localhost:5173
```

Click **"Simulate Match"** to generate test data and see the SPLATTER motion effects in action! 🌪️

---

## API Endpoints

### Matches
- `POST /api/matches` - Create match
- `GET /api/matches?player_name=X` - List matches
- `GET /api/matches/:id` - Get details
- `GET /api/matches/:id/story` - Get narrative story

### Statistics  
- `GET /api/stats/summary?player_name=X` - Player summary
- `GET /api/stats/by-killer?player_name=X` - Killer breakdown
- `GET /api/stats/by-map?player_name=X` - Map breakdown

### Builds
- `POST /api/builds/analyze` - Analyze build
- `GET /api/builds?player_name=X` - List builds
- `POST /api/builds` - Save build

### Reference Data
- `GET /api/reference/killers` - All killers
- `GET /api/reference/maps` - All maps
- `GET /api/reference/perks?type=Survivor` - All perks

**Swagger UI:** http://localhost:3000/api-docs

---

## Design System

### Ink & Iron Glow Architecture
- **Color Palette** - DBD-optimized (blood red, entity purple, hope cyan)
- **Typography** - Lilita One (headlines) + Barlow (UI) + JetBrains Mono (data)
- **Spacing** - 4px grid base
- **Motion** - FLUBBER's playful splatters with adaptive triggering

### SPLATTER Motion Effects
```jsx
<RippleButton>Click ripple</RippleButton>
<StaggerList>Cascade stats</StaggerList>
<BeamHighlight>Spinning border</BeamHighlight>
<WipeReveal>Sliding text</WipeReveal>
<EnergyBar>Progress bar</EnergyBar>
<OrbitLoader>Loading spinner</OrbitLoader>
```

**Adaptive Modes:**
- **Auto** - Continuous for touch displays
- **Click** - Triggered for mouse users
- **Gesture** - Touch gesture support

---

## Project Phases

### Phase 1 ✅ COMPLETE
- [x] Backend API (OpenAPI 3.0)
- [x] PostgreSQL schema + seeding
- [x] React dashboard with all views
- [x] SPLATTER motion library
- [x] Design tokens (Ink & Iron Glow + FLUBBER)

### Phase 2 🚀 NEXT
- [ ] Tesseract.js OCR integration
- [ ] Electron desktop app
- [ ] Live screen capture
- [ ] Real-time match parsing
- [ ] In-game overlay

### Phase 3 📈 FUTURE
- [ ] Advanced visualizations (heatmaps, graphs)
- [ ] Build tier system
- [ ] Team analysis
- [ ] Historical trends
- [ ] Cloud sync

---

## Development Scripts

```bash
npm install           # Install dependencies
npm start             # Start backend (port 3000)
npm run dev           # Start frontend dev server (port 5173)
npm run db:init       # Initialize database schema
npm run db:seed       # Seed reference data
npm run db:setup      # Init + seed (shortcut)
npm test              # Run quick demo
```

---

## Project Structure

```
DAILITE/
├── server.js                    # Express backend
├── routes/                      # API endpoints
│   ├── matches.js
│   ├── stats.js
│   ├── builds.js
│   └── reference.js
├── lib/
│   ├── splatter-motion.js       # Core motion library
│   └── splatter-components.jsx  # React wrappers
├── components/
│   └── Dashboard.jsx            # Main app component
├── styles/
│   ├── design-tokens.css        # IIG + FLUBBER tokens
│   └── dashboard.css            # Component styles
├── scripts/
│   ├── init-db.js               # Schema setup
│   └── seed-wiki-data.js        # Reference data
└── demo-splatter.html           # Motion effects demo
```

---

## Concept Proof

This is a **proof-of-concept** that advanced Dead by Daylight analytics isn't difficult to build:

1. **Backend**: ✅ Done (1 day)
2. **Design**: ✅ Done (using FLUBBER + IIG)
3. **Motion**: ✅ Done (SPLATTER library)
4. **Dashboard**: ✅ Done (React)
5. **OCR**: → Next (Tesseract + screen capture)

**Timeline:** Complete PoC in ~1 week with proper team.

---

## Design Credits

- **IIG Design System** by @lootziffer666
- **FLUBBER Motion Grammar** by @lootziffer666
- **DAILITE Analytics** by Claude

---

## License

MIT - Build, remix, ship. DBD players deserve better analytics tools.

---

**Question for the dev who said this is hard:** 🤔  
Check the branch. This is what "only OCR" can do when you actually think about it.

**Next challenge:** Live OCR + in-game overlay. Still think it's hard?
