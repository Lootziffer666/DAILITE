import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET: All killers
router.get('/killers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, real_name, dlc FROM killers ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching killers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Specific killer
router.get('/killers/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, real_name, dlc FROM killers WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Killer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching killer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: All maps
router.get('/maps', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, realm FROM maps ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching maps:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: All perks
router.get('/perks', async (req, res) => {
  const { type, perk_class } = req.query;

  try {
    let query = 'SELECT id, name, type, perk_class FROM perks WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (perk_class) {
      query += ' AND perk_class = $' + (params.length + 1);
      params.push(perk_class);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching perks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Search for killer by fuzzy match
router.get('/search/killers/:query', async (req, res) => {
  const { query } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, real_name, dlc,
              SIMILARITY(name, $1) as similarity
       FROM killers
       WHERE name % $1
       ORDER BY similarity DESC
       LIMIT 5`,
      [query]
    );

    res.json(result.rows);
  } catch (err) {
    // If similarity search not available, do basic search
    try {
      const result = await pool.query(
        'SELECT id, name, real_name, dlc FROM killers WHERE LOWER(name) LIKE LOWER($1)',
        [`%${query}%`]
      );
      res.json(result.rows);
    } catch (innerErr) {
      console.error('Error searching killers:', innerErr);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
