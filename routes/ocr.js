import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { ocrParser } from '../lib/ocr.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot provided' });
    }

    const tempPath = path.join(__dirname, `../tmp/screenshot-${Date.now()}.png`);
    await fs.writeFile(tempPath, req.file.buffer);

    const gameState = await ocrParser.parseScreenshot(tempPath);

    // Clean up temp file
    fs.unlink(tempPath).catch(e => console.error('Cleanup error:', e));

    res.json({
      success: true,
      gameState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OCR analysis error:', error);
    res.status(500).json({
      error: 'OCR analysis failed',
      message: error.message
    });
  }
});

router.post('/live-session', express.json(), async (req, res) => {
  try {
    const { screenshots, playerName } = req.body;

    if (!screenshots || screenshots.length === 0) {
      return res.status(400).json({ error: 'No screenshots provided' });
    }

    const analysis = [];
    for (const screenshotBase64 of screenshots) {
      const buffer = Buffer.from(screenshotBase64.split(',')[1] || screenshotBase64, 'base64');
      const tempPath = path.join(__dirname, `../tmp/screenshot-${Date.now()}.png`);
      await fs.writeFile(tempPath, buffer);

      const gameState = await ocrParser.parseScreenshot(tempPath);
      analysis.push(gameState);

      fs.unlink(tempPath).catch(e => console.error('Cleanup error:', e));
    }

    const matchData = aggregateGameStates(analysis);
    matchData.player_name = playerName;

    res.json({
      success: true,
      matchData,
      frameCount: screenshots.length
    });
  } catch (error) {
    console.error('Live session analysis error:', error);
    res.status(500).json({
      error: 'Live session analysis failed',
      message: error.message
    });
  }
});

function aggregateGameStates(states) {
  if (states.length === 0) return {};

  const killer = states[0].killer;
  const map = states[0].map;
  const avgHooks = Math.round(states.reduce((sum, s) => sum + (s.hook_count || 0), 0) / states.length);
  const allPerks = [...new Set(states.flatMap(s => s.perks || []))];
  const escaped = states.some(s => s.escaped);

  return {
    killer,
    map,
    hook_count: avgHooks,
    perks: allPerks,
    escaped,
    frame_count: states.length
  };
}

router.get('/status', (req, res) => {
  res.json({
    ocr_initialized: ocrParser.initialized,
    tesseract_version: '5.0.0',
    supported_languages: ['eng'],
    status: 'ready'
  });
});

export default router;
