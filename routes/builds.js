import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// POST: Analyze a build against killer type
router.post('/analyze', async (req, res) => {
  const { perks, killer_type, player_name } = req.body;

  if (!perks || !Array.isArray(perks) || perks.length === 0) {
    return res.status(400).json({ error: 'perks array required' });
  }

  if (!killer_type) {
    return res.status(400).json({ error: 'killer_type required' });
  }

  try {
    // Get historical data for this build against this killer
    const result = await pool.query(
      `SELECT COUNT(*) as encounters,
              COUNT(CASE WHEN outcome = 'escape' THEN 1 END) as escapes
       FROM matches
       WHERE player_name = $1 AND killer = $2`,
      [player_name || 'unknown', killer_type]
    );

    const encounters = parseInt(result.rows[0].encounters) || 0;
    const escapes = parseInt(result.rows[0].escapes) || 0;
    const winRate = encounters > 0 ? ((escapes / encounters) * 100).toFixed(2) : 0;

    const analysis = {
      perks,
      killer_type,
      sample_size: encounters,
      win_rate: parseFloat(winRate),
      recommendation: generateRecommendation(parseFloat(winRate), encounters, perks, killer_type),
    };

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing build:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Get all saved builds for a player
router.get('/', async (req, res) => {
  const { player_name } = req.query;

  if (!player_name) {
    return res.status(400).json({ error: 'player_name query parameter required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM builds WHERE player_name = $1 ORDER BY last_updated DESC',
      [player_name]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching builds:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Save a build
router.post('/', async (req, res) => {
  const { player_name, perks, killer_type } = req.body;

  if (!player_name || !perks || !killer_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO builds (player_name, perks, killer_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [player_name, perks, killer_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving build:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateRecommendation(winRate, sampleSize, perks, killerType) {
  if (sampleSize < 5) {
    return `Not enough data (${sampleSize} matches). Play more matches with this build to get better recommendations.`;
  }

  if (winRate >= 60) {
    return `Great matchup! You have a ${winRate}% escape rate against ${killerType} with this build. Keep using it.`;
  } else if (winRate >= 40) {
    return `Moderate success. Consider adjusting perks or playstyle against ${killerType}. Win rate: ${winRate}%.`;
  } else {
    return `This build struggles against ${killerType} (${winRate}% win rate). Consider trying different perks.`;
  }
}

export default router;
