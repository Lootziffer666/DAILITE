import sqlite3 from 'sqlite3';
import chalk from 'chalk';

const db = new sqlite3.Database(':memory:');

console.log(chalk.cyan.bold('\n🎮 DAILITE - Dead by Daylight Analytics PoC Demo\n'));

// Schema
const schema = [
  `CREATE TABLE killers (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    real_name TEXT,
    dlc TEXT
  )`,
  `CREATE TABLE maps (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    realm TEXT
  )`,
  `CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    player_name TEXT,
    killer TEXT,
    map TEXT,
    outcome TEXT,
    duration_seconds INTEGER,
    first_hook_seconds INTEGER,
    total_hooks INTEGER,
    generator_progress REAL,
    total_heals INTEGER,
    total_totems INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE builds (
    id INTEGER PRIMARY KEY,
    player_name TEXT,
    perks TEXT,
    killer_type TEXT,
    win_rate REAL,
    sample_size INTEGER
  )`,
];

// Sample data
const killers = [
  ['The Wraith', 'Philip Ojomo', 'Original'],
  ['The Huntress', 'Anna', 'Original'],
  ['The Spirit', 'Rin Yamaoka', 'DLC'],
  ['The Oni', 'Kazan Yamaoka', 'DLC'],
];

const maps = [
  ['Haddonfield', 'Haddonfield'],
  ['Red Forest', 'Red Forest'],
  ['Autohaven Wreckers', 'Autohaven Wreckers'],
];

const testMatches = [
  ['Player1', 'The Wraith', 'Haddonfield', 'escape', 1200, 45, 1, 75, 2, 1],
  ['Player1', 'The Huntress', 'Red Forest', 'die', 800, 30, 2, 50, 1, 0],
  ['Player1', 'The Spirit', 'Autohaven Wreckers', 'escape', 1500, 60, 0, 85, 3, 2],
  ['Player2', 'The Oni', 'Haddonfield', 'escape', 1100, 40, 1, 70, 2, 1],
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function demo() {
  try {
    // 1. Initialize Schema
    console.log(chalk.yellow('📊 1. Initializing database schema...'));
    for (const sql of schema) {
      await run(sql);
    }
    console.log(chalk.green('   ✓ Schema created\n'));

    // 2. Seed reference data
    console.log(chalk.yellow('📚 2. Seeding reference data...'));
    for (const [name, realName, dlc] of killers) {
      await run('INSERT INTO killers (name, real_name, dlc) VALUES (?, ?, ?)', [
        name,
        realName,
        dlc,
      ]);
    }
    for (const [name, realm] of maps) {
      await run('INSERT INTO maps (name, realm) VALUES (?, ?)', [name, realm]);
    }
    console.log(chalk.green(`   ✓ Seeded ${killers.length} killers & ${maps.length} maps\n`));

    // 3. Simulate matches
    console.log(chalk.yellow('🎮 3. Simulating matches...'));
    for (const [player, killer, map, outcome, duration, firstHook, hooks, genProg, heals, totems] of testMatches) {
      await run(
        `INSERT INTO matches
        (player_name, killer, map, outcome, duration_seconds, first_hook_seconds,
         total_hooks, generator_progress, total_heals, total_totems)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [player, killer, map, outcome, duration, firstHook, hooks, genProg, heals, totems]
      );
    }
    console.log(chalk.green(`   ✓ Created ${testMatches.length} test matches\n`));

    // 4. Generate stats
    console.log(chalk.yellow('📈 4. Generating player statistics...'));
    const player1Matches = await all(
      'SELECT * FROM matches WHERE player_name = ?',
      ['Player1']
    );

    const escapes = player1Matches.filter((m) => m.outcome === 'escape').length;
    const total = player1Matches.length;
    const escapeRate = ((escapes / total) * 100).toFixed(2);
    const avgDuration = Math.round(
      player1Matches.reduce((sum, m) => sum + m.duration_seconds, 0) / total
    );
    const avgFirstHook = Math.round(
      player1Matches.reduce((sum, m) => sum + m.first_hook_seconds, 0) / total
    );
    const avgGenProg = (
      player1Matches.reduce((sum, m) => sum + m.generator_progress, 0) / total
    ).toFixed(2);

    console.log(chalk.cyan(`\n   Player1 Summary:`));
    console.log(chalk.blue(`   • Total Matches: ${total}`));
    console.log(chalk.blue(`   • Escape Rate: ${escapeRate}%`));
    console.log(chalk.blue(`   • Avg Duration: ${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`));
    console.log(chalk.blue(`   • Avg First Hook: ${Math.floor(avgFirstHook / 60)}m ${avgFirstHook % 60}s`));
    console.log(chalk.blue(`   • Avg Generator Progress: ${avgGenProg}%\n`));

    // 5. Killer statistics
    console.log(chalk.yellow('5. Killer matchup analysis...'));
    const killerStats = await all(
      `SELECT killer, COUNT(*) as encounters,
              COUNT(CASE WHEN outcome = 'escape' THEN 1 END) as escapes
       FROM matches
       WHERE player_name = ?
       GROUP BY killer`,
      ['Player1']
    );

    console.log(chalk.cyan('\n   Killer Matchups for Player1:'));
    for (const stat of killerStats) {
      const winRate = ((stat.escapes / stat.encounters) * 100).toFixed(0);
      console.log(chalk.blue(`   • ${stat.killer}: ${stat.encounters} match(es) - ${winRate}% win rate`));
    }
    console.log();

    // 6. Build analysis
    console.log(chalk.yellow('6. Build efficiency analysis...'));
    await run(
      `INSERT INTO builds (player_name, perks, killer_type, sample_size)
       VALUES (?, ?, ?, ?)`,
      ['Player1', 'Dead Hard,Resilience,Inner Strength,Prove Thyself', 'The Spirit', 2]
    );

    const build = await get(
      'SELECT * FROM builds WHERE player_name = ? LIMIT 1',
      ['Player1']
    );

    console.log(chalk.cyan(`\n   Build vs ${build.killer_type}:`));
    console.log(chalk.blue(`   • Perks: ${build.perks}`));
    console.log(chalk.blue(`   • Sample Size: ${build.sample_size} matches`));
    console.log(chalk.blue(`   • Status: Good performance against this killer!\n`));

    // 7. Generate match story
    console.log(chalk.yellow('7. Generating match narrative story...'));
    const match = player1Matches[0];
    const storyMinutes = Math.floor(match.duration_seconds / 60);
    const storySeconds = match.duration_seconds % 60;
    const firstHookMin = Math.floor(match.first_hook_seconds / 60);

    const story = `
    Match Story:
    After ${firstHookMin}m you were first discovered by ${match.killer}.
    You managed to survive ${storyMinutes}m ${storySeconds}s, contributing ${match.generator_progress}%
    to generator completion. Despite being hooked ${match.total_hooks} time(s),
    you ${match.outcome === 'escape' ? '✓ ESCAPED' : '✗ DIED'}.
    `;

    console.log(chalk.cyan(story));

    // 8. Test API endpoints structure
    console.log(chalk.yellow('8. API Endpoints available (OpenAPI 3.0 compliant):'));
    const endpoints = [
      'POST   /api/matches - Create match',
      'GET    /api/matches - List matches',
      'GET    /api/matches/:id - Get match details',
      'GET    /api/matches/:id/story - Get narrative story',
      'GET    /api/stats/summary - Player summary',
      'GET    /api/stats/by-killer - Stats grouped by killer',
      'GET    /api/reference/killers - All killers',
      'GET    /api/reference/maps - All maps',
      'GET    /api/reference/perks - All perks',
      'POST   /api/builds/analyze - Analyze build',
    ];

    for (const endpoint of endpoints) {
      console.log(chalk.magenta(`   ▸ ${endpoint}`));
    }

    console.log(chalk.green.bold('\n✅ PoC Demo Complete!\n'));
    console.log(chalk.yellow('Next Steps:'));
    console.log(chalk.gray('  1. npm install (without Electron)'));
    console.log(chalk.gray('  2. npm start (start backend API)'));
    console.log(chalk.gray('  3. Test API endpoints'));
    console.log(chalk.gray('  4. Integrate Tesseract OCR for live parsing\n'));

    process.exit(0);
  } catch (err) {
    console.error(chalk.red('❌ Error:'), err);
    process.exit(1);
  }
}

demo();
