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

    return {
      killer: killerMatch || null,
      map: mapMatch || null,
      perks,
      hook_count: hooks,
      generator_progress: generators,
      objectives,
      escaped: this.isEscaped(text),
      detected_at: new Date().toISOString(),
      confidence: ocrData.confidence || 0,
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
      gates_powered: text.includes('GATE POWERED'),
      exit_gates_open: text.includes('ESCAPE') || text.includes('GATE OPEN'),
      hatch_open: text.includes('HATCH'),
      totem_active: text.includes('TOTEM') && text.includes('DULL TOTEM')
    };
    return objectives;
  }

  isEscaped(text) {
    return text.includes('ESCAPED') || text.includes('YOU ESCAPED');
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.initialized = false;
    }
  }
}

export const ocrParser = new DBDOCRParser();
