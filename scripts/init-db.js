import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTablesSQL = `
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS killers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  real_name VARCHAR(255),
  dlc VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  realm VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  perk_class VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  killer VARCHAR(255) NOT NULL,
  map VARCHAR(255),
  outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('escape', 'die', 'sacrifice')),
  duration_seconds INTEGER,
  first_hook_seconds INTEGER,
  total_hooks INTEGER DEFAULT 0,
  generator_progress DECIMAL(5, 2),
  total_heals INTEGER DEFAULT 0,
  total_totems INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp_seconds INTEGER NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS builds (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  perks TEXT[] NOT NULL,
  killer_type VARCHAR(255),
  win_rate DECIMAL(5, 2),
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS killer_encounters (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  killer_name VARCHAR(255) NOT NULL,
  perks TEXT[] NOT NULL,
  encounters INTEGER DEFAULT 1,
  win_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_killers_name ON killers(name);
CREATE INDEX IF NOT EXISTS idx_maps_name ON maps(name);
CREATE INDEX IF NOT EXISTS idx_perks_name ON perks(name);
CREATE INDEX IF NOT EXISTS idx_matches_player ON matches(player_name);
CREATE INDEX IF NOT EXISTS idx_matches_killer ON matches(killer);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_builds_player ON builds(player_name);
CREATE INDEX IF NOT EXISTS idx_killer_encounters_player ON killer_encounters(player_name);
`;

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await pool.query(createTablesSQL);
    console.log('✓ Database tables created successfully');
    await pool.end();
  } catch (err) {
    console.error('✗ Error initializing database:', err);
    process.exit(1);
  }
}

initializeDatabase();
