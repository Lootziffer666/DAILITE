import React, { useState, useEffect } from 'react';
import { useSplatterMotion } from '../lib/splatter-components.jsx';

export default function OCRTester() {
  const splatter = useSplatterMotion();
  const [ocrStatus, setOcrStatus] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkOCRStatus();
  }, []);

  async function checkOCRStatus() {
    try {
      const response = await fetch('/api/ocr/status');
      const data = await response.json();
      setOcrStatus(data);
    } catch (err) {
      setError('Failed to check OCR status: ' + err.message);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('screenshot', file);

      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data.gameState);
    } catch (err) {
      setError('OCR analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(74, 14, 78, 0.2)' }}>
      <h2 style={{ color: '#3ec4d0', marginBottom: '16px', fontFamily: 'Lilita One' }}>
        🔬 OCR Analyzer
      </h2>

      {/* OCR Status */}
      {ocrStatus && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(126, 211, 33, 0.1)',
            border: '1px solid #7ed321',
          }}
        >
          <div style={{ fontSize: '14px', color: '#7ed321' }}>
            ✅ OCR System: <strong>{ocrStatus.status}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
            Tesseract {ocrStatus.tesseract_version} • Languages: {ocrStatus.supported_languages.join(', ')}
          </div>
        </div>
      )}

      {/* File Upload */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          borderRadius: '8px',
          border: '2px dashed #3ec4d0',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <label style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={analyzing}
            style={{ display: 'none' }}
          />
          <div style={{ color: '#3ec4d0', fontWeight: '500' }}>
            {analyzing ? '📊 Analyzing...' : '📸 Upload Dead by Daylight Screenshot'}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            Click to select a PNG/JPG image of the game UI
          </div>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(196, 30, 58, 0.2)',
            border: '1px solid #c41e3a',
            color: '#ff6b6b',
            fontSize: '14px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(62, 196, 208, 0.1)',
            border: '1px solid #3ec4d0',
          }}
        >
          <h3 style={{ color: '#3ec4d0', marginBottom: '12px', fontSize: '16px' }}>
            Detected Game State
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Killer */}
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Killer</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ff9d3e' }}>
                {result.killer || '—'}
              </div>
            </div>

            {/* Map */}
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Map</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#7ed321' }}>
                {result.map || '—'}
              </div>
            </div>

            {/* Hooks */}
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Hooks</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#c41e3a' }}>
                {result.hook_count || 0} / 3
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Confidence</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: result.confidence > 0.8 ? '#7ed321' : result.confidence > 0.7 ? '#ff9d3e' : '#c41e3a',
                }}
              >
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
          </div>

          {/* Perks */}
          {result.perks && result.perks.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Perks</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {result.perks.map((perk, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: '#4a0e4e',
                      border: '1px solid #3ec4d0',
                      fontSize: '12px',
                      color: '#3ec4d0',
                    }}
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generator Progress */}
          {result.generator_progress && result.generator_progress.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Generators</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {result.generator_progress.map((progress, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: `rgba(126, 211, 33, ${progress * 0.3 + 0.1})`,
                      border: '1px solid #7ed321',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: progress === 1 ? '#7ed321' : '#aaa',
                    }}
                  >
                    {Math.round(progress * 100)}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objectives */}
          {result.objectives && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Objectives</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(result.objectives).map(([key, value]) => (
                  <span
                    key={key}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: value ? 'rgba(126, 211, 33, 0.2)' : 'rgba(196, 30, 58, 0.2)',
                      border: `1px solid ${value ? '#7ed321' : '#c41e3a'}`,
                      fontSize: '12px',
                      color: value ? '#7ed321' : '#c41e3a',
                    }}
                  >
                    {value ? '✓' : '✗'} {key.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text (for debugging) */}
          {result.raw_text && (
            <details style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                Raw OCR Text
              </summary>
              <div
                style={{
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                  overflow: 'auto',
                }}
              >
                {result.raw_text}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
