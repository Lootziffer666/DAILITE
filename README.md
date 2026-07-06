# DAILITE - Dead by Daylight Analytics

A real-time Dead by Daylight Companion App that captures match data via OCR and provides advanced analytics, build coaching, and match narrative summaries.

## Features

- **Live Match Capture** - Screen capture + OCR to extract match data in real-time
- **Match Stories** - Narrative summaries of matches (not just stats)
- **Advanced Statistics** - Beyond escape rate: chase duration, hook timing, generator contribution, heal time, totem time
- **Build Coach** - Analyze build effectiveness against specific killers
- **Killer Database** - Learn common killer combinations and track problematic matchups
- **Map Knowledge** - Track performance by map and spawn patterns

## Architecture

### Backend Stack
- **Node.js + Express** - REST API
- **PostgreSQL** - Data persistence
- **OpenAPI 3.0** - Full API documentation

### Frontend Stack
- **Electron** - Desktop app for screen capture + OCR
- **React** - Web dashboard for analytics
- **Tesseract.js** - OCR for Dead by Daylight UI

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd dailite
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

4. Configure your database connection in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dailite
PORT=3000
```

5. Initialize the database:
```bash
npm run db:init
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000` with Swagger documentation at `http://localhost:3000/api-docs`.

## API Endpoints

### Matches
- `POST /api/matches` - Create a new match
- `GET /api/matches` - List matches for a player
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/:id/story` - Get narrative match summary

### Statistics
- `GET /api/stats/summary` - Get player stats summary
- `GET /api/stats/by-killer` - Stats by killer type
- `GET /api/stats/by-map` - Stats by map

### Builds
- `POST /api/builds/analyze` - Analyze build against killer
- `GET /api/builds` - Get saved builds
- `POST /api/builds` - Save a build

## Data Schema

### Matches Table
- `id` - Unique match identifier
- `player_name` - Player name
- `killer` - Killer type
- `map` - Map name
- `outcome` - escape/die/sacrifice
- `duration_seconds` - Match duration
- `first_hook_seconds` - Time to first hook
- `total_hooks` - Number of hooks
- `generator_progress` - % contribution to generators
- `total_heals` - Number of heals
- `total_totems` - Totems cleansed
- `created_at` - Timestamp

### Builds Table
- `id` - Unique build identifier
- `player_name` - Player name
- `perks` - Array of perk names
- `killer_type` - Killer the build is for
- `win_rate` - Historical win rate
- `sample_size` - Number of matches

### Killer Encounters Table
- `id` - Unique encounter identifier
- `player_name` - Player name
- `killer_name` - Killer name
- `perks` - Killer's perks
- `encounters` - Number of times encountered
- `win_count` - Wins against this killer

## Development

- `npm run dev` - Start with hot reload
- `npm start` - Start production server
- `npm run db:init` - Initialize database

## Project Status

**Phase 1 (MVP)**: Backend API + data persistence
- ✓ OpenAPI-compliant REST API
- ✓ PostgreSQL schema
- ✓ Match creation and retrieval
- ✓ Statistics aggregation
- ✓ Build analysis
- [ ] Electron desktop app with OCR
- [ ] React dashboard
- [ ] Real-time match capture

**Phase 2**: OCR integration and desktop app
**Phase 3**: Web dashboard and visualizations

## License

MIT
