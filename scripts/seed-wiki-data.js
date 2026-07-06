import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function loadWikiData() {
  const wikiKillers = JSON.parse(fs.readFileSync(path.join(dataDir, 'wiki_killers.json'), 'utf8'));
  const wikiSurvivors = JSON.parse(fs.readFileSync(path.join(dataDir, 'wiki_survivors.json'), 'utf8'));
  const wikiPerks = JSON.parse(fs.readFileSync(path.join(dataDir, 'wiki_perks.json'), 'utf8'));
  const wikiMaps = JSON.parse(fs.readFileSync(path.join(dataDir, 'wiki_maps.json'), 'utf8'));

  // Map wiki killers to app schema
  const killers = wikiKillers.killers.map(k => ({
    name: k.title,
    real_name: k.real_name,
    dlc: k.origin,
  }));

  // Map wiki survivors to app schema
  const survivors = wikiSurvivors.survivors.map(s => ({
    name: s.title,
    real_name: s.real_name,
    dlc: s.origin,
  }));

  // Map wiki maps to app schema
  const maps = wikiMaps.maps.map(m => ({
    name: m.name,
    realm: m.realm,
  }));

  // Map wiki perks to app schema (note: wiki doesn't provide perk_class, so we set to null)
  const perks = wikiPerks.map(p => ({
    name: p.name,
    type: p.type,
    perk_class: null,
  }));

  return { killers, survivors, maps, perks };
}

async function seedData() {
  try {
    console.log('Loading verified wiki data...');
    const { killers, survivors, maps, perks } = loadWikiData();

    console.log('Seeding wiki data...');

    // Clear existing data
    await pool.query('DELETE FROM perks');
    await pool.query('DELETE FROM maps');
    await pool.query('DELETE FROM survivors');
    await pool.query('DELETE FROM killers');

    // Insert killers
    console.log(`Inserting ${killers.length} killers...`);
    for (const killer of killers) {
      await pool.query(
        'INSERT INTO killers (name, real_name, dlc) VALUES ($1, $2, $3)',
        [killer.name, killer.real_name, killer.dlc]
      );
    }

    // Insert survivors
    console.log(`Inserting ${survivors.length} survivors...`);
    for (const survivor of survivors) {
      await pool.query(
        'INSERT INTO survivors (name, real_name, dlc) VALUES ($1, $2, $3)',
        [survivor.name, survivor.real_name, survivor.dlc]
      );
    }

    // Insert maps
    console.log(`Inserting ${maps.length} maps...`);
    for (const map of maps) {
      await pool.query(
        'INSERT INTO maps (name, realm) VALUES ($1, $2)',
        [map.name, map.realm]
      );
    }

    // Insert perks
    console.log(`Inserting ${perks.length} perks...`);
    for (const perk of perks) {
      await pool.query(
        'INSERT INTO perks (name, type, perk_class) VALUES ($1, $2, $3)',
        [perk.name, perk.type, perk.perk_class]
      );
    }

    console.log('✓ Wiki data seeded successfully');
    await pool.end();
  } catch (err) {
    console.error('✗ Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
