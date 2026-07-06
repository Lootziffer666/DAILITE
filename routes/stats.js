import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET: Player statistics summary
router.get('/summary', async (req, res) => {
  const { player_name } = req.query;

  if (!player_name) {
    return res.status(400).json({ error: 'player_name query parameter required' });
  }

  try {
    const matches = await pool.query(
      'SELECT * FROM matches WHERE player_name = $1 ORDER BY created_at DESC',
      [player_name]
    );

    if (matches.rows.length === 0) {
      return res.json({
        player_name,
        total_matches: 0,
        escape_rate: 0,
        favorite_killer: null,
        average_duration_seconds: 0,
        average_first_hook_seconds: 0,
        average_generator_progress: 0,
        average_total_heals: 0,
        average_total_totems: 0,
      });
    }

    const stats = calculateStats(matches.rows);
    res.json({ player_name, ...stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Stats by killer
router.get('/by-killer', async (req, res) => {
  const { player_name } = req.query;

  if (!player_name) {
    return res.status(400).json({ error: 'player_name query parameter required' });
  }

  try {
    const result = await pool.query(
      `SELECT killer, COUNT(*) as encounters,
              COUNT(CASE WHEN outcome = 'escape' THEN 1 END) as escapes,
              AVG(duration_seconds)::INT as avg_duration,
              AVG(first_hook_seconds)::INT as avg_first_hook
       FROM matches
       WHERE player_name = $1
       GROUP BY killer
       ORDER BY encounters DESC`,
      [player_name]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching killer stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Stats by map
router.get('/by-map', async (req, res) => {
  const { player_name } = req.query;

  if (!player_name) {
    return res.status(400).json({ error: 'player_name query parameter required' });
  }

  try {
    const result = await pool.query(
      `SELECT map, COUNT(*) as matches,
              COUNT(CASE WHEN outcome = 'escape' THEN 1 END) as escapes,
              AVG(duration_seconds)::INT as avg_duration
       FROM matches
       WHERE player_name = $1 AND map IS NOT NULL
       GROUP BY map
       ORDER BY matches DESC`,
      [player_name]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching map stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateStats(matches) {
  const total = matches.length;
  const escapes = matches.filter((m) => m.outcome === 'escape').length;
  const escapeRate = total > 0 ? ((escapes / total) * 100).toFixed(2) : 0;

  const killerCounts = {};
  matches.forEach((m) => {
    killerCounts[m.killer] = (killerCounts[m.killer] || 0) + 1;
  });
  const favoriteKiller = Object.keys(killerCounts).reduce((a, b) =>
    killerCounts[a] > killerCounts[b] ? a : b
  );

  const avgDuration =
    matches.reduce((sum, m) => sum + (m.duration_seconds || 0), 0) / total;
  const avgFirstHook =
    matches.reduce((sum, m) => sum + (m.first_hook_seconds || 0), 0) / total;
  const avgGeneratorProgress =
    matches.reduce((sum, m) => sum + (m.generator_progress || 0), 0) / total;
  const avgHeals = matches.reduce((sum, m) => sum + (m.total_heals || 0), 0) / total;
  const avgTotems = matches.reduce((sum, m) => sum + (m.total_totems || 0), 0) / total;

  return {
    total_matches: total,
    escape_rate: parseFloat(escapeRate),
    favorite_killer: favoriteKiller,
    average_duration_seconds: Math.round(avgDuration),
    average_first_hook_seconds: Math.round(avgFirstHook),
    average_generator_progress: parseFloat(avgGeneratorProgress.toFixed(2)),
    average_total_heals: parseFloat(avgHeals.toFixed(2)),
    average_total_totems: parseFloat(avgTotems.toFixed(2)),
  };
}

export default router;
