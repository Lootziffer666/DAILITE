import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Load balance meta data
let balanceMeta = null;
async function loadBalanceMeta() {
  if (!balanceMeta) {
    try {
      const data = await fs.readFile(
        path.join(__dirname, '../data/killer-balance-tiers.json'),
        'utf-8'
      );
      balanceMeta = JSON.parse(data);
    } catch (err) {
      console.warn('Could not load balance meta data:', err.message);
      balanceMeta = {};
    }
  }
  return balanceMeta;
}

// POST: Analyze a build against killer type
router.post('/analyze', async (req, res) => {
  const { perks, killer_type, player_name, mmr } = req.body;

  if (!perks || !Array.isArray(perks) || perks.length === 0) {
    return res.status(400).json({ error: 'perks array required' });
  }

  if (!killer_type) {
    return res.status(400).json({ error: 'killer_type required' });
  }

  try {
    const meta = await loadBalanceMeta();

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

    const killerData = meta.killers_extended?.[killer_type.toUpperCase()] || {};
    const metaPerkIssues = getMetaPerkIssues(perks, meta);

    const analysis = {
      perks,
      killer_type,
      sample_size: encounters,
      win_rate: parseFloat(winRate),
      killer_tier: killerData.tier || 'Unknown',
      killer_kill_rate: killerData.kill_rate || 'N/A',
      meta_status: getMetaStatus(perks, meta),
      perk_issues: metaPerkIssues,
      recommendation: generateRecommendation(
        parseFloat(winRate),
        encounters,
        perks,
        killer_type,
        killerData,
        mmr
      ),
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

function getMetaStatus(perks, meta) {
  const tierOne = meta.perk_meta?.survivor_tier_1?.map(p => p.name.toUpperCase()) || [];
  const matching = perks.filter(p => tierOne.includes(p.toUpperCase()));
  return {
    has_meta_perks: matching.length,
    tier_one_count: tierOne.length,
    coverage: tierOne.length > 0
      ? ((matching.length / tierOne.length) * 100).toFixed(0) + '%'
      : '0%',
  };
}

function getMetaPerkIssues(perks, meta) {
  const problematic = meta.perk_meta?.killer_problematic?.map(p => p.name.toUpperCase()) || [];
  const issues = [];

  perks.forEach(perk => {
    if (problematic.includes(perk.toUpperCase())) {
      issues.push({
        perk,
        issue: 'This perk is currently overtuned in the meta',
        impact: 'High - May face killer perks designed to counter this'
      });
    }
  });

  return issues;
}

function generateRecommendation(winRate, sampleSize, perks, killerType, killerData, mmr) {
  let recommendation = '';

  // Sample size check
  if (sampleSize < 5) {
    recommendation += `📊 Not enough data (${sampleSize} matches). Play more for better insights.\n`;
  }

  // Killer tier assessment
  const killRatePercent = typeof killerData.kill_rate === 'number'
    ? Math.round(killerData.kill_rate * 100)
    : null;
  if (killerData.tier === 'D') {
    recommendation += `⚠️ ${killerType} is low-tier${killRatePercent !== null ? ` (${killRatePercent}% KR)` : ''}. This will be challenging.\n`;
  } else if (killerData.tier === 'S') {
    recommendation += `🔥 ${killerType} is top-tier. Strong killer choice.\n`;
  }

  // Win rate assessment (only meaningful once there's at least one match)
  if (sampleSize > 0) {
    if (winRate >= 60) {
      recommendation += `✅ Great matchup! ${winRate}% escape rate against ${killerType}. Keep this build.\n`;
    } else if (winRate >= 50) {
      recommendation += `👍 Solid performance. ${winRate}% escape rate - this build works.\n`;
    } else if (winRate >= 40) {
      recommendation += `⚠️ Moderate success (${winRate}%). Consider tweaking for ${killerType}.\n`;
    } else {
      recommendation += `❌ Struggling (${winRate}%). Try different perks against ${killerType}.\n`;
    }
  }

  // MMR-specific advice
  if (mmr === 'low') {
    recommendation += `💡 At low MMR: Use meta perks (Dead Hard, Sprint Burst, DS) for safety.\n`;
  } else if (mmr === 'high') {
    recommendation += `💡 At high MMR: Consider situational perks over meta for flexibility.\n`;
  }

  return recommendation.trim();
}

export default router;
