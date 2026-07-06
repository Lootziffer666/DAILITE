/**
 * SPLATTER MOTION — React Components
 * Wrapper components for DAILITE using SplatterMotion library
 */

import React, { useEffect, useRef } from 'react';
import SplatterMotion from './splatter-motion';

// Global singleton
let splatterMotion = null;

export const useSplatterMotion = () => {
  if (!splatterMotion) {
    splatterMotion = new SplatterMotion({
      mode: 'auto', // Will auto-detect touch
      intensity: 1,
    });
  }
  return splatterMotion;
};

/**
 * LiquidWaveBox - Bouncing indicator with liquid animation
 * Use: <LiquidWaveBox color="#FF5757" trigger="auto" />
 */
export const LiquidWaveBox = ({ color = '#A855F7', trigger = 'auto', ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.liquidWave(ref.current, { color, trigger });
    }
  }, [color, trigger, splatter]);

  return <div ref={ref} {...props} />;
};

/**
 * RippleButton - Button with ripple effect on click/touch
 * Use: <RippleButton>Click me</RippleButton>
 */
export const RippleButton = ({ children, color = '#A855F7', onClick, ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.ripple(ref.current, { color, trigger: 'click' });
    }
  }, [color, splatter]);

  return (
    <button ref={ref} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

/**
 * StaggerList - Cascade-in list of items
 * Use: <StaggerList>
 *        <div data-stagger-item>Item 1</div>
 *        <div data-stagger-item>Item 2</div>
 *      </StaggerList>
 */
export const StaggerList = ({ children, delay = 100, trigger = 'auto', ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.stagger(ref.current, { delay, trigger });
    }
  }, [delay, trigger, splatter]);

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
};

/**
 * StaggerItem - Individual item within StaggerList
 * Automatically tagged with data-stagger-item
 */
export const StaggerItem = ({ children, ...props }) => (
  <div data-stagger-item {...props}>
    {children}
  </div>
);

/**
 * BeamHighlight - Spinning border beam for important content
 * Use: <BeamHighlight color1="#A855F7" color2="#F5E642">
 *        Important stats here
 *      </BeamHighlight>
 */
export const BeamHighlight = ({
  children,
  color1 = '#A855F7',
  color2 = '#F5E642',
  trigger = 'auto',
  ...props
}) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.beam(ref.current, { color1, color2, trigger });
    }
  }, [color1, color2, trigger, splatter]);

  return (
    <div
      ref={ref}
      style={{
        padding: '16px',
        borderRadius: '14px',
        background: 'white',
        position: 'relative',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * WipeReveal - Text or content with sliding wipe effect
 * Use: <WipeReveal color="#FF5757">
 *        This content will be revealed with a wipe
 *      </WipeReveal>
 */
export const WipeReveal = ({ children, color = '#A855F7', trigger = 'auto', ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.wipe(ref.current, { color, trigger });
    }
  }, [color, trigger, splatter]);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        zIndex: 1,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * EnergyBar - Progress bar with animated fill
 * Use: <EnergyBar progress={0.65} color="#7ED321" />
 */
export const EnergyBar = ({ progress = 0.45, color = '#A855F7', trigger = 'auto', ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.energyLine(ref.current, { progress, color, trigger });
    }
  }, [progress, color, trigger, splatter]);

  return <div ref={ref} {...props} />;
};

/**
 * OrbitLoader - Spinning orbital indicator for loading
 * Use: <OrbitLoader color="#A855F7" />
 */
export const OrbitLoader = ({ color = '#A855F7', ...props }) => {
  const ref = useRef(null);
  const splatter = useSplatterMotion();

  useEffect(() => {
    if (ref.current) {
      splatter.orbital(ref.current, { color });
    }
  }, [color, splatter]);

  return <div ref={ref} {...props} />;
};

/**
 * GooeyContainer - Wrapper that applies gooey filter to blobs
 * Use: <GooeyContainer>
 *        <blob>...</blob>
 *        <blob>...</blob>
 *      </GooeyContainer>
 */
export const GooeyContainer = ({ children, ...props }) => {
  const splatter = useSplatterMotion();

  useEffect(() => {
    splatter.gooeyFilter('dailite-gooey-filter');
  }, [splatter]);

  return (
    <div
      style={{
        filter: 'url(#gooey)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * MotionToggle - Control panel for motion settings
 * Use: <MotionToggle onModeChange={setMode} />
 */
export const MotionToggle = ({ onModeChange, onIntensityChange }) => {
  const splatter = useSplatterMotion();
  const [mode, setMode] = React.useState(splatter.mode);
  const [intensity, setIntensity] = React.useState(splatter.intensity);
  const [isTouchDevice, setIsTouchDevice] = React.useState(splatter.isTouchDevice());

  const handleModeChange = (newMode) => {
    setMode(newMode);
    splatter.setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleIntensityChange = (e) => {
    const value = parseFloat(e.target.value);
    setIntensity(value);
    splatter.setIntensity(value);
    onIntensityChange?.(value);
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <div style={{ marginBottom: '12px' }}>
        <strong>Motion Settings</strong>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
          Mode:
        </label>
        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          style={{ width: '100%', padding: '6px' }}
        >
          <option value="auto">Auto (Touch)</option>
          <option value="click">Click-Triggered</option>
          <option value="gesture">Gesture-Based</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
          Intensity: {intensity.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={intensity}
          onChange={handleIntensityChange}
          style={{ width: '100%' }}
        />
      </div>

      {splatter.respectsUserPreferences() && (
        <div style={{ fontSize: '11px', color: '#666' }}>
          ✓ User prefers reduced motion
        </div>
      )}

      <div style={{ fontSize: '11px', color: '#666' }}>
        Device: {isTouchDevice ? '📱 Touch' : '🖱️ Mouse'}
      </div>
    </div>
  );
};

/**
 * Example: Using splatter components together
 *
 * export function MatchCard() {
 *   return (
 *     <BeamHighlight color1="#FF5757" color2="#3EC4D0">
 *       <h2>Match vs The Spirit</h2>
 *       <StaggerList>
 *         <StaggerItem>Duration: 20m 30s</StaggerItem>
 *         <StaggerItem>Escape Rate: 66.7%</StaggerItem>
 *         <StaggerItem>First Hook: 45s</StaggerItem>
 *       </StaggerList>
 *       <WipeReveal color="#7ED321">
 *         <p>Great job! High generator efficiency</p>
 *       </WipeReveal>
 *     </BeamHighlight>
 *   );
 * }
 */
