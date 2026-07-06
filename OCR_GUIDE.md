# DAILITE OCR Integration Guide

## Overview

DAILITE's Phase 2 OCR system uses **Tesseract.js** to extract real-time game state from Dead by Daylight screenshots. This enables:

- Automatic killer identification
- Map detection
- Perk extraction from UI elements
- Hook count tracking
- Generator progress monitoring
- Objective status detection (gates, hatch, totems)

---

## Architecture

### OCR Pipeline

```
Screenshot → Preprocessing → Tesseract Recognition → Text Extraction → Game State JSON
  ↓           ↓              ↓                      ↓                ↓
Capture   Grayscale +   English OCR        Pattern Matching    Killer, Map,
Screen    Normalize    Engine             on Extracted Text    Perks, Status
```

### Key Components

**`lib/ocr.js` - DBDOCRParser**
- Handles Tesseract worker initialization and lifecycle
- Preprocesses images (grayscale, normalization) for accuracy
- Extracts patterns: killers, maps, perks, objective status
- Returns structured game state with confidence score

**`routes/ocr.js` - REST Endpoints**
- `POST /api/ocr/analyze` - Single screenshot analysis
- `POST /api/ocr/live-session` - Batch frame aggregation
- `GET /api/ocr/status` - System status

**`electron/main.js` - Screen Capture**
- Captures game screen using Electron's `desktopCapturer`
- Sends to OCR API for analysis
- Streams results to dashboard and overlay

**`electron/overlay.html` - Live Overlay**
- Transparent, always-on-top window
- Displays real-time game state
- Shows adaptive suggestions based on match progress

---

## API Usage

### Single Screenshot Analysis

**Request:**
```bash
curl -X POST http://localhost:3000/api/ocr/analyze \
  -F "screenshot=@match.png"
```

**Response:**
```json
{
  "success": true,
  "gameState": {
    "killer": "THE SPIRIT",
    "map": "HADDONFIELD",
    "perks": ["SPINE CHILL", "RESILIENCE", "DEAD HARD"],
    "hook_count": 1,
    "generator_progress": [0.25, 0.45, 0.0, 0.8, 0.6],
    "objectives": {
      "gates_powered": false,
      "exit_gates_open": false,
      "hatch_open": false,
      "totem_active": true
    },
    "escaped": false,
    "detected_at": "2026-07-06T12:34:56.789Z",
    "confidence": 0.87,
    "raw_text": "THE SPIRIT HADDONFIELD SPINE CHILL 1/3 HOOKS..."
  },
  "timestamp": "2026-07-06T12:34:56.789Z"
}
```

### Live Session Analysis

**Request:**
```bash
curl -X POST http://localhost:3000/api/ocr/live-session \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "SurvivalInstinct",
    "screenshots": ["data:image/png;base64,...", "data:image/png;base64,..."]
  }'
```

**Response:**
```json
{
  "success": true,
  "matchData": {
    "killer": "THE SPIRIT",
    "map": "HADDONFIELD",
    "hook_count": 2,
    "perks": ["SPINE CHILL", "RESILIENCE", "DEAD HARD", "BORROWED TIME"],
    "escaped": false,
    "frame_count": 42,
    "player_name": "SurvivalInstinct"
  }
}
```

### OCR Status

**Request:**
```bash
curl http://localhost:3000/api/ocr/status
```

**Response:**
```json
{
  "ocr_initialized": true,
  "tesseract_version": "5.0.0",
  "supported_languages": ["eng"],
  "status": "ready"
}
```

---

## Live Capture with Electron

### Starting Live Capture

```javascript
// In renderer process (preload.js exposures)
await window.api.createOverlay();           // Create overlay window
await window.api.startLiveCapture(1000);    // Capture every 1 second
```

### Stopping Live Capture

```javascript
await window.api.stopLiveCapture();
```

### Game State Stream

The overlay listens to `game-state-update` events from the main process:

```javascript
window.overlayAPI.onGameStateUpdate((event, gameState) => {
  console.log('Live game state:', gameState);
  // Update overlay with killer, objectives, suggestions
});
```

---

## OCR Game State Extraction

### Killer Detection

Matches against 20+ known DBD killers:
- The Trapper, Wraith, Hillbilly, Nurse, Shape (Michael)
- The Spirit, Legion, Plague, Oni, Deathslinger
- Executioner, Cenobite, Artist, Knight, Singularity
- + Future killers added to database

**Example:**
```
OCR Text: "THE SPIRIT HADDONFIELD"
→ Extracted: killer = "THE SPIRIT"
```

### Map Detection

Matches against 20 survivor and killer maps:
- Autohaven Wreckers, Backwater Swamp, Badham Preschool
- Crotus Prenn Asylum, Haddonfield, RPD, The Game
- + All other standard maps

**Example:**
```
OCR Text: "HADDONFIELD MAP LOADING"
→ Extracted: map = "HADDONFIELD"
```

### Perk Recognition

Extracts survivor perks from UI elements:
- Detects perk names in OCR text
- Returns array of active perks

**Example:**
```
OCR Text: "SPINE CHILL DEAD HARD RESILIENCE"
→ Extracted: perks = ["SPINE CHILL", "DEAD HARD", "RESILIENCE"]
```

### Hook Count

Extracts number 0-3 from "X HOOKS" or sacrifice indicators:

**Example:**
```
OCR Text: "2 HOOKS REMAINING"
→ Extracted: hook_count = 2
```

### Generator Progress

Extracts percentage values from UI and converts to 0-1 range:

**Example:**
```
OCR Text: "25% 45% 0% 80% 60%"
→ Extracted: generator_progress = [0.25, 0.45, 0.0, 0.8, 0.6]
```

### Objective Status

Detects:
- **gates_powered**: "GATE POWERED" text
- **exit_gates_open**: "ESCAPE" or "GATE OPEN"
- **hatch_open**: "HATCH" indicator
- **totem_active**: "DULL TOTEM" status

---

## Confidence Scoring

Each OCR result includes a `confidence` score (0-1) indicating accuracy:

- **0.85+** - High confidence, use for automatic decisions
- **0.70-0.85** - Good confidence, verify important data
- **<0.70** - Low confidence, flag for manual review

The confidence is driven by:
1. Tesseract's built-in confidence metrics
2. Pattern match success
3. Text clarity and contrast

---

## Preprocessing for Accuracy

The OCR pipeline applies preprocessing to improve recognition:

```javascript
const buffer = await sharp(imagePath)
  .grayscale()        // Convert to grayscale
  .normalize()        // Enhance contrast
  .toBuffer();
```

This helps with:
- **Dark game UI** - Normalized contrast reveals text
- **Colored perks** - Grayscale simplifies for OCR
- **Motion blur** - Normalization sharpens edges

---

## Testing OCR Locally

### Test with a Sample Screenshot

```bash
# 1. Start backend
npm start

# 2. Capture a DBD screenshot to test.png

# 3. Send to OCR endpoint
curl -X POST http://localhost:3000/api/ocr/analyze \
  -F "screenshot=@test.png" | jq
```

### Expected Output

For a Dead by Daylight screenshot, you should see:
- ✅ `killer` detected correctly
- ✅ `map` identified
- ✅ `perks` listed (at least your active perks)
- ✅ `hook_count` number 0-3
- ✅ `confidence` score > 0.7
- ⚠️ `generator_progress` may be approximate

### Debugging

If OCR accuracy is low:

1. **Check screenshot clarity** - Ensure DBD UI is readable
2. **Verify text contrast** - UI text should stand out from background
3. **Check Tesseract logs** - Enable debug output in `lib/ocr.js`
4. **Test in daylight** - Screen capture may be dark if overlaid

---

## Performance Considerations

### Latency

- OCR processing: ~500ms per screenshot (first-time initialization)
- Subsequent calls: ~100-200ms (worker reused)
- Network overhead: +50-100ms

**Total end-to-end time:** ~600ms initial, ~150ms steady-state

### Memory

- Tesseract worker: ~150MB resident
- Image buffers: ~5MB per screenshot
- Recommend: 500MB+ available memory

### CPU

- Tesseract OCR: ~50% single-core during analysis
- Preprocessing: Negligible
- Capture: Negligible

### Optimization Tips

1. **Reduce capture frequency** - 1 FPS (1s interval) sufficient for gameplay
2. **Use smaller thumbnails** - 1280x720 vs full screen
3. **Batch processing** - Send multiple frames in one request
4. **Reuse worker** - Singleton pattern avoids reinit overhead

---

## Future Enhancements

### Phase 2 Complete Checklist

- [x] Tesseract.js integration
- [x] Game state extraction
- [x] OCR REST API
- [ ] Electron desktop app integration
- [ ] Live overlay rendering
- [ ] Real-time suggestion engine

### Phase 3+ Ideas

- **Heatmaps** - Track death locations on map
- **Chase Tracking** - Measure chase duration from state changes
- **Hex Totem Detection** - Identify specific totem types
- **Survivor Count** - Extract remaining survivor UI elements
- **Audio Feedback** - OCR-driven voice notifications
- **ML Model Fine-tuning** - Train on DBD-specific UI elements

---

## References

- **Tesseract.js Docs**: https://github.com/naptha/tesseract.js
- **Sharp Image Processing**: https://sharp.pixelplumbing.com/
- **Electron IPC**: https://www.electronjs.org/docs/latest/
- **DBD Wiki**: https://deadbydaylight.gamepedia.com/

---

## Support

For OCR issues:

1. Check `/api/ocr/status` endpoint
2. Review raw OCR text in response (`raw_text` field)
3. Test with different screenshot clarity
4. Report pattern mismatches to improve killer/map detection

Good luck! 🔪
