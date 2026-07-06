/**
 * DAILITE DASHBOARD
 * =================
 * Match analytics with SPLATTER motion
 * Ink & Iron Glow design + adaptive interaction
 */

import React, { useState, useEffect } from 'react';
import {
  useSplatterMotion,
  RippleButton,
  StaggerList,
  StaggerItem,
  BeamHighlight,
  WipeReveal,
  EnergyBar,
  OrbitLoader,
  MotionToggle,
} from '../lib/splatter-components';
import '../styles/design-tokens.css';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'match' | 'stats' | 'builds'
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('Player1');
  const [matchData, setMatchData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const splatter = useSplatterMotion();

  // Simulate API call
  const simulateMatch = async () => {
    setLoading(true);
    setTimeout(() => {
      setMatchData({
        id: Math.floor(Math.random() * 1000),
        killer: ['The Wraith', 'The Huntress', 'The Spirit', 'The Oni'][
          Math.floor(Math.random() * 4)
        ],
        map: 'Haddonfield',
        outcome: Math.random() > 0.4 ? 'escape' : 'die',
        duration_seconds: Math.floor(Math.random() * 1800) + 300,
        first_hook_seconds: Math.floor(Math.random() * 180) + 20,
        total_hooks: Math.floor(Math.random() * 3) + 1,
        generator_progress: Math.floor(Math.random() * 100),
        total_heals: Math.floor(Math.random() * 5),
        total_totems: Math.floor(Math.random() * 3),
      });
      setLoading(false);
      setActiveView('match');
    }, 1500);
  };

  const loadStats = async () => {
    setLoading(true);
    setTimeout(() => {
      setStatsData({
        total_matches: 15,
        escape_rate: 66.7,
        favorite_killer: 'The Spirit',
        average_duration_seconds: 1200,
        average_first_hook_seconds: 45,
        average_generator_progress: 70,
      });
      setLoading(false);
      setActiveView('stats');
    }, 1500);
  };

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="display-lg">
            DAILITE<span className="accent">.</span>
          </h1>
          <p className="header-sub">Dead by Daylight Personal Analytics</p>
        </div>
        <MotionToggle />
      </header>

      {/* NAVIGATION */}
      <nav className="dashboard-nav">
        <RippleButton
          className={`nav-btn ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => setActiveView('home')}
        >
          🏠 Home
        </RippleButton>
        <RippleButton
          className={`nav-btn ${activeView === 'match' ? 'active' : ''}`}
          onClick={() => setActiveView('match')}
          disabled={!matchData}
        >
          🎮 Match
        </RippleButton>
        <RippleButton
          className={`nav-btn ${activeView === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveView('stats')}
          disabled={!statsData}
        >
          📊 Stats
        </RippleButton>
        <RippleButton
          className={`nav-btn ${activeView === 'builds' ? 'active' : ''}`}
          onClick={() => setActiveView('builds')}
        >
          🔮 Builds
        </RippleButton>
      </nav>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* HOME VIEW */}
        {activeView === 'home' && (
          <div className="view-home">
            <div className="hero-section">
              <h2 className="display-md">Match Simulator</h2>
              <p className="body-lg">Generate dummy match data to test the analytics engine</p>

              <div className="input-group">
                <label className="label-md">Player Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="input-text"
                  placeholder="Enter your name"
                />
              </div>

              <RippleButton
                className="btn-primary"
                onClick={simulateMatch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <OrbitLoader /> Simulating...
                  </>
                ) : (
                  '🎮 Simulate Match'
                )}
              </RippleButton>

              <RippleButton className="btn-secondary" onClick={loadStats} disabled={loading}>
                📊 Load Stats
              </RippleButton>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <h3 className="display-sm">📖 Match Stories</h3>
                <p className="body-md">Narrative summaries instead of raw stats</p>
              </div>
              <div className="feature-card">
                <h3 className="display-sm">📈 Analytics</h3>
                <p className="body-md">Chase duration, hook timing, generator efficiency</p>
              </div>
              <div className="feature-card">
                <h3 className="display-sm">🔮 Build Coach</h3>
                <p className="body-md">Personalized build efficiency insights</p>
              </div>
              <div className="feature-card">
                <h3 className="display-sm">👹 Killer Database</h3>
                <p className="body-md">Track your performance against each killer</p>
              </div>
            </div>
          </div>
        )}

        {/* MATCH VIEW */}
        {activeView === 'match' && matchData && (
          <div className="view-match">
            <BeamHighlight color1="#c41e3a" color2="#ff9d3e">
              <h2 className="display-md">Match vs {matchData.killer}</h2>
              <p className="label-md">{matchData.map}</p>
            </BeamHighlight>

            <StaggerList delay={100} trigger="auto" className="match-stats">
              <StaggerItem className="stat-row">
                <div className="stat-label">Outcome</div>
                <div className={`stat-value ${matchData.outcome}`}>
                  {matchData.outcome.toUpperCase()}
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Duration</div>
                <div className="stat-value">
                  {Math.floor(matchData.duration_seconds / 60)}m{' '}
                  {matchData.duration_seconds % 60}s
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">First Hook</div>
                <div className="stat-value">
                  {Math.floor(matchData.first_hook_seconds / 60)}m{' '}
                  {matchData.first_hook_seconds % 60}s
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Total Hooks</div>
                <div className="stat-value">{matchData.total_hooks}</div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Generator Progress</div>
                <div className="stat-bar">
                  <EnergyBar progress={matchData.generator_progress / 100} trigger="auto" />
                  <span className="stat-percent">{matchData.generator_progress}%</span>
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Heals</div>
                <div className="stat-value">{matchData.total_heals}</div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Totems Cleansed</div>
                <div className="stat-value">{matchData.total_totems}</div>
              </StaggerItem>
            </StaggerList>

            <WipeReveal color="#7ed321" trigger="auto" className="match-story">
              <h3 className="display-sm">📖 Match Story</h3>
              <p className="body-md">
                After {Math.floor(matchData.first_hook_seconds / 60)}m you were first discovered by{' '}
                {matchData.killer}. You managed to survive{' '}
                {Math.floor(matchData.duration_seconds / 60)}m{' '}
                {matchData.duration_seconds % 60}s, contributing {matchData.generator_progress}% to
                generator completion. Despite being hooked {matchData.total_hooks} time(s), you{' '}
                <strong>{matchData.outcome === 'escape' ? '✓ ESCAPED' : '✗ DIED'}</strong>.
              </p>
            </WipeReveal>
          </div>
        )}

        {/* STATS VIEW */}
        {activeView === 'stats' && statsData && (
          <div className="view-stats">
            <h2 className="display-md">Your Statistics</h2>

            <div className="stats-grid">
              <BeamHighlight color1="#3ec4d0" color2="#7ed321">
                <h3 className="label-md">Total Matches</h3>
                <div className="stat-big">{statsData.total_matches}</div>
              </BeamHighlight>

              <BeamHighlight color1="#ff9d3e" color2="#c41e3a">
                <h3 className="label-md">Escape Rate</h3>
                <div className="stat-big">{statsData.escape_rate.toFixed(1)}%</div>
              </BeamHighlight>

              <BeamHighlight color1="#a855f7" color2="#ff5757">
                <h3 className="label-md">Favorite Killer</h3>
                <div className="stat-big">{statsData.favorite_killer}</div>
              </BeamHighlight>
            </div>

            <StaggerList delay={100} trigger="auto" className="stats-list">
              <StaggerItem className="stat-row">
                <div className="stat-label">Avg Duration</div>
                <div className="stat-value">
                  {Math.floor(statsData.average_duration_seconds / 60)}m
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Avg First Hook</div>
                <div className="stat-value">
                  {Math.floor(statsData.average_first_hook_seconds / 60)}m
                </div>
              </StaggerItem>

              <StaggerItem className="stat-row">
                <div className="stat-label">Avg Generator Progress</div>
                <div className="stat-value">{statsData.average_generator_progress}%</div>
              </StaggerItem>
            </StaggerList>
          </div>
        )}

        {/* BUILDS VIEW */}
        {activeView === 'builds' && (
          <div className="view-builds">
            <h2 className="display-md">Build Analysis</h2>

            <div className="builds-grid">
              <div className="build-card">
                <h3 className="display-sm">Dead Hard Build</h3>
                <p className="body-sm">
                  <strong>Perks:</strong> Dead Hard, Resilience, Inner Strength, Prove Thyself
                </p>
                <p className="body-sm">
                  <strong>Performance:</strong> 66.7% against The Spirit
                </p>
                <WipeReveal color="#7ed321" trigger="click" className="build-rec">
                  <p className="body-sm">✓ This build works well for you!</p>
                </WipeReveal>
              </div>

              <div className="build-card">
                <h3 className="display-sm">Stealth Build</h3>
                <p className="body-sm">
                  <strong>Perks:</strong> Urban Evasion, Iron Will, Spine Chill, Quick Gambit
                </p>
                <p className="body-sm">
                  <strong>Performance:</strong> 33.3% against Stealth Killers
                </p>
                <WipeReveal color="#ff5757" trigger="click" className="build-rec">
                  <p className="body-sm">⚠️ Reconsider against stealth killers</p>
                </WipeReveal>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p className="body-sm">
          DAILITE v0.1 • OpenAPI • Backend ready • OCR coming soon
        </p>
      </footer>
    </div>
  );
}
