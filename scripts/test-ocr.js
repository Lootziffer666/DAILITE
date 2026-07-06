import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ocrParser } from '../lib/ocr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock screenshot data for testing
const mockScreenshots = {
  spirit_haddon: `
    THE SPIRIT HADDONFIELD MAP
    SPINE CHILL DEAD HARD RESILIENCE
    1 HOOK REMAINING
    25% 45% 0% 80% 60%
    DULL TOTEM ACTIVE
    GOOD SKILL CHECK
  `,
  endgame: `
    THE TRAPPER RED FOREST
    PROVE THYSELF UNBREAKABLE
    2 HOOKS
    90% 95% 85% 100% 88%
    GATES POWERED ESCAPE
    FINAL MOMENTS
  `,
  lowgen: `
    THE CENOBITE MIDWICH
    BORROWED TIME RESILIENCE
    0 HOOKS
    5% 10% 0% 12% 8%
    HATCH
    GENERATOR OVERCHARGE
  `,
};

async function testOCRParser() {
  console.log('🎮 DAILITE OCR Parser Test Suite\n');
  console.log('=' .repeat(50));

  await ocrParser.init();
  console.log('✅ OCR Parser initialized\n');

  // Test 1: Game state extraction
  console.log('Test 1: Game State Extraction');
  console.log('-'.repeat(50));

  for (const [name, mockText] of Object.entries(mockScreenshots)) {
    console.log(`\nTest Case: ${name}`);
    const gameState = ocrParser.extractGameState(mockText.toUpperCase(), {
      confidence: 0.85,
    });

    console.log(`  Killer:     ${gameState.killer || 'NOT DETECTED'}`);
    console.log(`  Map:        ${gameState.map || 'NOT DETECTED'}`);
    console.log(`  Perks:      ${gameState.perks.join(', ') || 'NONE'}`);
    console.log(`  Hooks:      ${gameState.hook_count}`);
    console.log(`  Generators: ${gameState.generator_progress.map(p => Math.round(p * 100) + '%').join(', ')}`);
    console.log(`  Objectives: ${JSON.stringify(gameState.objectives)}`);
    console.log(`  Escaped:    ${gameState.escaped ? 'YES' : 'NO'}`);
    console.log(`  Confidence: ${(gameState.confidence * 100).toFixed(1)}%`);
  }

  // Test 2: Killer detection
  console.log('\n' + '='.repeat(50));
  console.log('Test 2: Killer Detection');
  console.log('-'.repeat(50));

  const killersToTest = [
    'THE TRAPPER',
    'THE WRAITH',
    'THE NURSE',
    'THE SHAPE',
    'THE SPIRIT',
    'THE CENOBITE',
    'UNKNOWN KILLER',
  ];

  killersToTest.forEach(killer => {
    const text = `${killer} HADDONFIELD MAP`;
    const detected = ocrParser.findKiller(text);
    const status = detected === killer ? '✅' : '❌';
    console.log(`  ${status} "${killer}" → ${detected || 'NOT DETECTED'}`);
  });

  // Test 3: Map detection
  console.log('\n' + '='.repeat(50));
  console.log('Test 3: Map Detection');
  console.log('-'.repeat(50));

  const mapsToTest = [
    'HADDONFIELD',
    'RED FOREST',
    'MIDWICH',
    'THE GAME',
    'UNKNOWN MAP',
  ];

  mapsToTest.forEach(map => {
    const text = `THE SPIRIT ${map} LOADING`;
    const detected = ocrParser.findMap(text);
    const status = detected === map ? '✅' : '❌';
    console.log(`  ${status} "${map}" → ${detected || 'NOT DETECTED'}`);
  });

  // Test 4: Perk extraction
  console.log('\n' + '='.repeat(50));
  console.log('Test 4: Perk Extraction');
  console.log('-'.repeat(50));

  const perkTests = [
    'SPINE CHILL DEAD HARD RESILIENCE UNBREAKABLE',
    'PROVE THYSELF SABOTAGE',
    'THRILLING TREMOR POP GOES BLOOD WARDEN',
  ];

  perkTests.forEach(perkString => {
    const perks = ocrParser.findPerks(perkString);
    console.log(`  Input:  "${perkString}"`);
    console.log(`  Found:  ${perks.join(', ') || 'NONE'}`);
    console.log();
  });

  // Test 5: Hook count extraction
  console.log('=' .repeat(50));
  console.log('Test 5: Hook Count Extraction');
  console.log('-'.repeat(50));

  const hookTests = [
    ['0 HOOKS REMAINING', 0],
    ['1 HOOK', 1],
    ['2 HOOKS SACRIFICED', 2],
    ['3 HOOKS FULL', 3],
    ['NO HOOKS TEXT', 0],
  ];

  hookTests.forEach(([text, expected]) => {
    const hooks = ocrParser.findHookCount(text);
    const status = hooks === expected ? '✅' : '❌';
    console.log(`  ${status} "${text}" → ${hooks} (expected ${expected})`);
  });

  // Test 6: Generator progress extraction
  console.log('\n' + '='.repeat(50));
  console.log('Test 6: Generator Progress Extraction');
  console.log('-'.repeat(50));

  const genTests = [
    ['25% 50% 0% 75% 100%', [0.25, 0.50, 0.0, 0.75, 1.0]],
    ['0% 0% 0% 0% 0%', [0.0, 0.0, 0.0, 0.0, 0.0]],
    ['12% 45% 33%', [0.12, 0.45, 0.33]],
  ];

  genTests.forEach(([text, expected]) => {
    const progress = ocrParser.findGeneratorProgress(text);
    const match = progress.slice(0, expected.length).every((p, i) => Math.abs(p - expected[i]) < 0.01);
    const status = match ? '✅' : '❌';
    console.log(`  ${status} "${text}"`);
    console.log(`     Got:      [${progress.map(p => (p * 100).toFixed(0) + '%').join(', ')}]`);
    console.log(`     Expected: [${expected.map(p => (p * 100).toFixed(0) + '%').join(', ')}]`);
  });

  // Test 7: Objective detection
  console.log('\n' + '='.repeat(50));
  console.log('Test 7: Objective Detection');
  console.log('-'.repeat(50));

  const objTests = [
    ['GATES POWERED ESCAPE AVAILABLE', { gates_powered: true, exit_gates_open: true }],
    ['HATCH OPEN NEARBY', { hatch_open: true }],
    ['DULL TOTEM BLOCKED', { totem_active: true }],
    ['NORMAL MATCH STATE', { gates_powered: false, exit_gates_open: false, hatch_open: false }],
  ];

  objTests.forEach(([text, expected]) => {
    const objectives = ocrParser.findObjectives(text);
    const match = Object.entries(expected).every(([key, value]) => objectives[key] === value);
    const status = match ? '✅' : '❌';
    console.log(`  ${status} "${text}"`);
    console.log(`     ${JSON.stringify(objectives)}`);
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('-'.repeat(50));
  console.log('✅ All OCR extraction tests completed!');
  console.log('💡 Run this script after making changes to lib/ocr.js');
  console.log('📝 Test with real screenshots using: npm run ocr:test\n');

  await ocrParser.terminate();
}

testOCRParser().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
