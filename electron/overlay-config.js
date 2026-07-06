/**
 * DAILITE Overlay Configuration
 * ============================
 * Multi-monitor + performance optimization settings
 */

export const overlayConfig = {
  // Display & Window Management
  display: {
    multiMonitorSupport: true,
    autoDetectGame: true, // Try to detect DBD window location
    fallbackToPrimary: true, // If detection fails, use primary display
    positioning: 'top-right', // or 'top-left', 'bottom-right', 'bottom-left', 'center'
    padding: 20, // px from edge
    opacity: 0.85, // 0-1 scale
  },

  // Performance Settings (Prozesslasso-like)
  performance: {
    priority: 'below-normal', // Keep low to not interfere with game
    maxMemoryMB: 512, // Cap memory usage
    maxCPUCores: 1, // Use only 1 CPU core
    maxFPS: 30, // Cap rendering FPS
    enableGPU: false, // Disable GPU to avoid conflicts
    thermalThrottling: true, // Reduce on high temps
  },

  // Capture Settings
  capture: {
    interval: 1000, // ms between captures (1 FPS is enough)
    resolution: 1920, // Downscale large captures
    quality: 'medium', // low/medium/high
    batch: {
      enabled: true,
      size: 5, // Process 5 frames before sending
      maxDelay: 1000, // Max wait time
    },
  },

  // OCR Settings
  ocr: {
    timeout: 2000, // ms timeout per analysis
    confidence_threshold: 0.7, // Ignore low-confidence results
    fallback_to_cache: true, // Use last good state if OCR fails
    cache_duration: 2000, // ms to cache results
  },

  // UI Settings
  ui: {
    theme: 'dark', // Match DBD aesthetic
    textSize: 'small', // Compact to not block game
    animationDuration: 200, // ms
    updateInterval: 500, // ms to refresh displayed data
  },

  // Network Settings
  network: {
    baseURL: 'http://localhost:3000/api',
    timeout: 5000,
    retries: 2,
    compression: 'gzip',
  },

  // Advanced
  debug: false,
  logToFile: true,
};

/**
 * Get optimized config for specific setup
 */
export function getOptimizedConfig(setup = 'standard') {
  const configs = {
    // Standard: Single monitor, mid-range PC
    standard: {
      ...overlayConfig,
      performance: { ...overlayConfig.performance, maxMemoryMB: 512 },
    },

    // High-end: Multi-monitor, high-end PC
    highend: {
      ...overlayConfig,
      performance: {
        ...overlayConfig.performance,
        maxMemoryMB: 1024,
        maxCPUCores: 2,
        maxFPS: 60,
      },
      capture: { ...overlayConfig.capture, quality: 'high' },
    },

    // Low-end: Potato PC with limited resources
    lowend: {
      ...overlayConfig,
      performance: {
        ...overlayConfig.performance,
        priority: 'idle',
        maxMemoryMB: 256,
        maxCPUCores: 1,
        maxFPS: 15,
      },
      capture: {
        ...overlayConfig.capture,
        interval: 2000, // 0.5 FPS
        quality: 'low',
        batch: { ...overlayConfig.capture.batch, size: 10 },
      },
    },

    // Multi-monitor: Optimized for 2+ displays
    multimonitor: {
      ...overlayConfig,
      display: {
        ...overlayConfig.display,
        multiMonitorSupport: true,
        autoDetectGame: true,
      },
      performance: {
        ...overlayConfig.performance,
        maxMemoryMB: 768,
        maxCPUCores: 2,
        maxFPS: 30,
      },
    },
  };

  return configs[setup] || configs.standard;
}

/**
 * Display detection logic
 */
export const displayDetection = {
  strategies: [
    {
      name: 'Primary Display',
      fn: (displays) => displays[0],
    },
    {
      name: 'Largest Display',
      fn: (displays) =>
        displays.reduce((max, d) =>
          d.bounds.width * d.bounds.height > max.bounds.width * max.bounds.height
            ? d
            : max
        ),
    },
    {
      name: 'Rightmost Display',
      fn: (displays) =>
        displays.reduce((max, d) => (d.bounds.x > max.bounds.x ? d : max)),
    },
    {
      name: 'Secondary (Right) Display',
      fn: (displays) => (displays.length > 1 ? displays[1] : displays[0]),
    },
  ],

  /**
   * Auto-detect which display is most likely running DBD
   */
  detectGameDisplay: (displays) => {
    // Try to find the display with most screen real estate
    // (DBD usually runs on primary or largest display)
    const largest = displays.reduce((max, d) =>
      d.bounds.width * d.bounds.height > max.bounds.width * max.bounds.height ? d : max
    );
    return largest;
  },
};

/**
 * Window positioning helpers
 */
export const windowPositioning = {
  getPosition: (display, position = 'top-right', padding = 20) => {
    const { x, y, width, height } = display.bounds;

    const positions = {
      'top-left': { x: x + padding, y: y + padding },
      'top-right': { x: x + width - 350 - padding, y: y + padding },
      'bottom-left': { x: x + padding, y: y + height - 200 - padding },
      'bottom-right': { x: x + width - 350 - padding, y: y + height - 200 - padding },
      'center': { x: x + width / 2 - 175, y: y + height / 2 - 100 },
    };

    return positions[position] || positions['top-right'];
  },

  isPositionValid: (display, x, y, width = 350, height = 200) => {
    const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
    return x >= dx && y >= dy && x + width <= dx + dw && y + height <= dy + dh;
  },
};

export default overlayConfig;
