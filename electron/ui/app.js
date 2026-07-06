const API_BASE = 'http://localhost:3000/api';

let currentMatch = null;
let matchInterval = null;

// Dummy data generators
const killers = [
  'The Wraith',
  'The Hillbilly',
  'The Nurse',
  'The Shape',
  'The Doctor',
  'The Huntress',
  'The Cannibal',
  'The Nightmare',
  'The Pig',
  'The Clown',
];

const survivors = ['David', 'Meg', 'Claudette', 'Jake', 'Nea', 'Laurie', 'Ash'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDummyMatch(playerName) {
  const durationSeconds = Math.floor(Math.random() * 1800) + 300; // 5-35 min
  const firstHookSeconds = Math.floor(Math.random() * 180) + 20; // 20 sec - 3 min

  return {
    player_name: playerName,
    killer: getRandomElement(killers),
    map: `Map-${Math.floor(Math.random() * 12)}`,
    outcome: Math.random() > 0.4 ? 'escape' : 'die',
    duration_seconds: durationSeconds,
    first_hook_seconds: firstHookSeconds,
    total_hooks: Math.floor(Math.random() * 3) + 1,
    generator_progress: Math.floor(Math.random() * 100),
    total_heals: Math.floor(Math.random() * 5),
    total_totems: Math.floor(Math.random() * 3),
  };
}

function simulateMatchProgressively(playerName) {
  const match = generateDummyMatch(playerName);
  currentMatch = {
    ...match,
    elapsed: 0,
    maxDuration: match.duration_seconds,
  };

  updateUI(currentMatch);
  setStatus('active', '🎮 Match in progress...');

  matchInterval = setInterval(() => {
    currentMatch.elapsed += 10;

    if (currentMatch.elapsed >= currentMatch.maxDuration) {
      clearInterval(matchInterval);
      submitMatch(playerName);
      return;
    }

    updateUI(currentMatch);
  }, 100);
}

function updateUI(matchData) {
  if (!matchData) return;

  const mins = Math.floor(matchData.elapsed / 60);
  const secs = matchData.elapsed % 60;

  document.getElementById('killerName').textContent = matchData.killer;
  document.getElementById('duration').textContent = `${mins}m ${secs}s`;
  document.getElementById('firstHook').textContent = matchData.first_hook_seconds
    ? `${Math.floor(matchData.first_hook_seconds / 60)}m ${matchData.first_hook_seconds % 60}s`
    : '-';
  document.getElementById('generators').textContent = `${matchData.generator_progress}%`;
  document.getElementById('hooks').textContent = matchData.total_hooks;
}

function setStatus(state, message) {
  const statusEl = document.getElementById('status');
  statusEl.className = `status-${state}`;
  statusEl.textContent = message;
}

async function submitMatch(playerName) {
  if (!currentMatch) return;

  setStatus('idle', '💾 Sending to API...');

  const matchData = {
    player_name: playerName,
    killer: currentMatch.killer,
    map: currentMatch.map,
    outcome: currentMatch.outcome,
    duration_seconds: currentMatch.maxDuration,
    first_hook_seconds: currentMatch.first_hook_seconds,
    total_hooks: currentMatch.total_hooks,
    generator_progress: currentMatch.generator_progress,
    total_heals: currentMatch.total_heals,
    total_totems: currentMatch.total_totems,
  };

  try {
    const response = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Match submitted:', result);
      setStatus('idle', `✅ Match saved! (ID: ${result.id})`);

      // Try to get the story
      const storyResponse = await fetch(`${API_BASE}/matches/${result.id}/story`);
      if (storyResponse.ok) {
        const storyData = await storyResponse.json();
        console.log('Match Story:', storyData.story);
      }
    } else {
      setStatus('idle', '❌ Failed to save match');
    }
  } catch (err) {
    console.error('Error submitting match:', err);
    setStatus('idle', '❌ API Error');
  }
}

async function loadPlayerStats() {
  const playerName = document.getElementById('playerName').value;

  try {
    const response = await fetch(`${API_BASE}/stats/summary?player_name=${playerName}`);
    const stats = await response.json();

    const statsHtml = `
      <p><strong>Total Matches:</strong> ${stats.total_matches}</p>
      <p><strong>Escape Rate:</strong> ${stats.escape_rate}%</p>
      <p><strong>Favorite Killer:</strong> ${stats.favorite_killer || 'N/A'}</p>
      <p><strong>Avg Duration:</strong> ${Math.floor(stats.average_duration_seconds / 60)}m</p>
      <p><strong>Avg First Hook:</strong> ${Math.floor(stats.average_first_hook_seconds / 60)}m</p>
      <p><strong>Avg Generator Progress:</strong> ${stats.average_generator_progress}%</p>
    `;

    document.getElementById('statsData').innerHTML = statsHtml;
  } catch (err) {
    console.error('Error loading stats:', err);
    document.getElementById('statsData').innerHTML = '<p>❌ Failed to load stats</p>';
  }
}

async function loadKillers() {
  try {
    const response = await fetch(`${API_BASE}/reference/killers`);
    const killerList = await response.json();

    const killersHtml = killerList
      .slice(0, 10)
      .map((k) => `<p>👹 ${k.name} (${k.real_name})</p>`)
      .join('');

    document.getElementById('referenceData').innerHTML =
      killersHtml || '<p>No killers found</p>';
  } catch (err) {
    console.error('Error loading killers:', err);
    document.getElementById('referenceData').innerHTML = '<p>❌ Failed to load</p>';
  }
}

async function loadPerks() {
  try {
    const response = await fetch(`${API_BASE}/reference/perks?type=Survivor`);
    const perkList = await response.json();

    const perksHtml = perkList
      .slice(0, 10)
      .map((p) => `<p>🔮 ${p.name} (${p.perk_class})</p>`)
      .join('');

    document.getElementById('referenceData').innerHTML =
      perksHtml || '<p>No perks found</p>';
  } catch (err) {
    console.error('Error loading perks:', err);
    document.getElementById('referenceData').innerHTML = '<p>❌ Failed to load</p>';
  }
}

async function startDummyMatch() {
  const playerName = document.getElementById('playerName').value;

  if (!playerName) {
    alert('Enter a player name');
    return;
  }

  document.getElementById('startBtn').disabled = true;
  simulateMatchProgressively(playerName);

  setTimeout(() => {
    document.getElementById('startBtn').disabled = false;
  }, 2000);
}

// Initialize
window.startDummyMatch = startDummyMatch;
window.loadPlayerStats = loadPlayerStats;
window.loadKillers = loadKillers;
window.loadPerks = loadPerks;

console.log('DAILITE Companion App ready');
