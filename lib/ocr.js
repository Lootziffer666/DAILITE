import Tesseract from 'tesseract.js';
import sharp from 'sharp';

class DBDOCRParser {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.worker = await Tesseract.createWorker('eng');
    this.initialized = true;
  }

  async parseScreenshot(imagePath) {
    await this.init();

    const buffer = await sharp(imagePath)
      .grayscale()
      .normalize()
      .toBuffer();

    const { data } = await this.worker.recognize(buffer);
    const text = data.text.toUpperCase();

    return this.extractGameState(text, data);
  }

  extractGameState(text, ocrData) {
    const killerMatch = this.findKiller(text);
    const mapMatch = this.findMap(text);
    const perks = this.findPerks(text);
    const hooks = this.findHookCount(text);
    const generators = this.findGeneratorProgress(text);
    const objectives = this.findObjectives(text);
    const callouts = this.findCallouts(text);

    return {
      killer: killerMatch || null,
      map: mapMatch || null,
      perks,
      hook_count: hooks,
      generator_progress: generators,
      objectives,
      callouts: callouts.length > 0 ? callouts : null,
      escaped: this.isEscaped(text),
      detected_at: new Date().toISOString(),
      confidence: (ocrData.confidence || 0) / 100,
      raw_text: text.slice(0, 500)
    };
  }

  findKiller(text) {
    const killers = [
      'THE TRAPPER', 'THE WRAITH', 'THE HILLBILLY', 'THE NURSE',
      'THE SHAPE', 'THE HAG', 'THE DOCTOR', 'THE HUNTRESS',
      'THE CLOWN', 'THE SPIRIT', 'THE LEGION', 'THE PLAGUE',
      'THE ONI', 'THE DEATHSLINGER', 'THE EXECUTIONER', 'THE CENOBITE',
      'THE ARTIST', 'THE KNIGHT', 'THE SICK GENTLEMAN', 'THE SINGULARITY'
    ];

    for (const killer of killers) {
      if (text.includes(killer)) return killer;
    }
    return null;
  }

  findMap(text) {
    const maps = [
      'AUTOHAVEN WRECKERS', 'BACKWATER SWAMP', 'BADHAM PRESCHOOL',
      'COLDWIND FARM', 'CROTUS PRENN ASYLUM', 'FATHERS CAMPBELL CHAPEL',
      'GRIM PANTRY', 'GROANING STOREHOUSE', 'HADDONFIELD', 'HOLY STREET',
      'MOUNT ORMOND', 'PALE ROSE', 'RED FOREST', 'RPD', 'THE GAME',
      'THE GREY PIT', 'THE MIDWICH', 'TORMENT CREEK', 'SALOON', 'GARDEN OF JOY'
    ];

    for (const map of maps) {
      if (text.includes(map)) return map;
    }
    return null;
  }

  findPerks(text) {
    const perkKeywords = [
      'RESILIENCE', 'SPINE CHILL', 'DETECTIVE', 'PLUNDERERS',
      'PROVE THYSELF', 'SABOTAGE', 'DEAD HARD', 'BORROWED TIME',
      'UNBREAKABLE', 'IRON WILL', 'BREAKOUT', 'NO ONE ESCAPES DEATH',
      'THRILLING TREMOR', 'BLOOD WARDEN', 'POP GOES', 'GRIM EMBRACE'
    ];

    return perkKeywords.filter(perk => text.includes(perk));
  }

  findHookCount(text) {
    const hookMatches = text.match(/\d+\s*(?:HOOKS?|SACRIF)/gi);
    if (hookMatches) {
      const num = parseInt(hookMatches[0]);
      return Math.min(num, 3);
    }
    return 0;
  }

  findGeneratorProgress(text) {
    const genMatches = text.match(/\d+(?:\.\d+)?\s*%/g);
    if (genMatches) {
      return genMatches.slice(0, 5).map(m => {
        const num = parseFloat(m);
        return Math.min(Math.max(num / 100, 0), 1);
      });
    }
    return [0, 0, 0, 0, 0];
  }

  findObjectives(text) {
    const objectives = {
      gates_powered: /GATES?\s+POWERED/.test(text),
      exit_gates_open: text.includes('ESCAPE') || text.includes('GATE OPEN'),
      hatch_open: text.includes('HATCH'),
      totem_active: text.includes('TOTEM') && text.includes('DULL TOTEM')
    };
    return objectives;
  }

  isEscaped(text) {
    return text.includes('ESCAPED') || text.includes('YOU ESCAPED');
  }

  findCallouts(text) {
    const callouts = [];

    // Clock positions (1-12)
    const clockPattern = /\b([1-9]|1[0-2])\s*(?:o'?clock|oclock)\b/gi;
    const clockMatches = text.matchAll(clockPattern);
    for (const match of clockMatches) {
      callouts.push({
        type: 'clock_position',
        value: parseInt(match[1]),
        text: match[0]
      });
    }

    // Location keywords
    const locations = [
      'COAL TOWER', 'GAS HEAVEN', 'BLOOD LODGE', 'SHELTER WOODS',
      'HADDONFIELD', 'MIDWICH', 'RPD', 'SWAMP', 'RED FOREST',
      'FRACTURED COWSHED', 'RANCID ABATTOIR', 'GROANING STOREHOUSE',
      'IRONWORKS', 'AZAROV', 'WRECKERS'
    ];

    locations.forEach(location => {
      if (text.includes(location)) {
        callouts.push({
          type: 'location',
          value: location,
          detected: true
        });
      }
    });

    // Strategy terms
    const strategies = [
      { term: '3-GEN', type: 'strategy_term' },
      { term: 'PALLET TOWN', type: 'area_type' },
      { term: 'DEAD ZONE', type: 'area_type' },
      { term: 'LOOP', type: 'action' },
      { term: 'CHASE', type: 'action' },
      { term: 'CAMP', type: 'killer_action' },
      { term: 'TUNNEL', type: 'killer_action' },
      { term: 'SLUGGED', type: 'state' }
    ];

    strategies.forEach(strategy => {
      if (text.includes(strategy.term)) {
        callouts.push({
          type: strategy.type,
          value: strategy.term,
          detected: true
        });
      }
    });

    return callouts;
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.initialized = false;
    }
  }
}

export const ocrParser = new DBDOCRParser();
