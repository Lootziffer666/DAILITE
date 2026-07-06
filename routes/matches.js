import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// POST: Create a new match
router.post('/', async (req, res) => {
  const {
    player_name,
    killer,
    map,
    outcome,
    duration_seconds,
    first_hook_seconds,
    total_hooks,
    generator_progress,
    total_heals,
    total_totems,
  } = req.body;

  if (!player_name || !killer || !outcome) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO matches (player_name, killer, map, outcome, duration_seconds,
       first_hook_seconds, total_hooks, generator_progress, total_heals, total_totems)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        player_name,
        killer,
        map,
        outcome,
        duration_seconds,
        first_hook_seconds,
        total_hooks,
        generator_progress,
        total_heals,
        total_totems,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Fetch all matches for a player
router.get('/', async (req, res) => {
  const { player_name, limit = 50, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM matches';
    const params = [];

    if (player_name) {
      query += ' WHERE player_name = $1';
      params.push(player_name);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Fetch a specific match by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Get match story (narrative summary)
router.get('/:id/story', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = result.rows[0];
    const story = generateMatchStory(match);

    res.json({ story, match });
  } catch (err) {
    console.error('Error generating match story:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateMatchStory(match) {
  const {
    player_name,
    killer,
    map,
    outcome,
    duration_seconds,
    first_hook_seconds,
    total_hooks,
    generator_progress,
  } = match;

  const durationMin = Math.floor(duration_seconds / 60);
  const durationSec = duration_seconds % 60;

  let story = `Match on ${map || 'Unknown Map'} against ${killer}.\n\n`;

  if (first_hook_seconds) {
    const hookMinute = Math.floor(first_hook_seconds / 60);
    story += `After ${hookMinute} minute(s) you were first hooked. `;
  }

  if (total_hooks) {
    story += `You were hooked ${total_hooks} time(s) during the match. `;
  }

  story += `You survived for ${durationMin}m ${durationSec}s. `;

  if (generator_progress) {
    story += `You contributed ${generator_progress}% to generator completion. `;
  }

  story += `\nOutcome: ${outcome.toUpperCase()}`;

  return story;
}

export default router;
