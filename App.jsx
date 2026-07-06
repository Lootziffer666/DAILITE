/**
 * DAILITE - Main App Entry Point
 * ==============================
 * Combines:
 * - Ink & Iron Glow design tokens
 * - FLUBBER motion grammar (SPLATTER)
 * - Real-time match analytics
 * - OpenAPI backend integration
 */

import React from 'react';
import Dashboard from './components/Dashboard';
import './styles/design-tokens.css';

export default function App() {
  return <Dashboard />;
}

/**
 * Usage with React:
 *
 * npm install react react-dom
 * npm run dev
 *
 * The app will:
 * 1. Load design tokens (colors, spacing, typography)
 * 2. Initialize SPLATTER motion library (auto-detects touch)
 * 3. Render Dashboard with all views
 * 4. Connect to OpenAPI backend at /api
 *
 * For production:
 * - Replace mock data with real API calls
 * - Add user authentication
 * - Implement OCR for screen capture
 * - Deploy backend to cloud (Vercel, Railway, etc.)
 */
