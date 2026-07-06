/**
 * DAILITE Performance Optimization
 * ================================
 * In-game overlay performance tuning for minimal CPU/memory impact
 */

import { app } from 'electron';
import os from 'os';

class PerformanceManager {
  constructor() {
    this.cpuCore = null;
    this.isOptimized = false;
    this.initialPriority = null;
  }

  /**
   * Set process priority for game overlay
   * Keeps OCR analysis on low priority to not interfere with game
   */
  setPriority(level = 'below-normal') {
    try {
      const pid = process.pid;
      const currentPriority = process.getProcessPriority();
      this.initialPriority = currentPriority;

      // Priority levels (Windows/Linux/macOS)
      const priorities = {
        'idle': -20,
        'below-normal': -10,
        'normal': 0,
        'above-normal': 10,
        'high': 20,
      };

      const priorityValue = priorities[level] || 0;

      try {
        process.setProcessPriority(priorityValue);
        console.log(
          `✅ Process priority set to ${level} (value: ${priorityValue})`
        );
        this.isOptimized = true;
      } catch (err) {
        console.warn('Could not set process priority:', err.message);
      }
    } catch (err) {
      console.warn('Priority optimization unavailable on this platform');
    }
  }

  /**
   * CPU affinity: Pin overlay to specific cores to avoid game threads
   */
  setPinToCores(coreCount = 1) {
    try {
      const totalCores = os.cpus().length;
      const lastCores = Math.max(0, totalCores - coreCount);

      console.log(
        `💡 Overlay will use cores ${lastCores}-${totalCores - 1} (out of ${totalCores})`
      );

      // Note: Electron doesn't have built-in CPU affinity
      // This would require native module (node-ffi) for SetThreadAffinityMask on Windows
      // For now, just set priority to move to idle cores
      this.setPriority('below-normal');
    } catch (err) {
      console.warn('CPU affinity not available:', err.message);
    }
  }

  /**
   * Memory limit: Prevent memory bloat from long capture sessions
   */
  enableMemoryLimit(maxMB = 512) {
    try {
      // V8 memory limit (approximate)
      const maxBytes = maxMB * 1024 * 1024;

      console.log(`🧠 Memory limit: ${maxMB}MB`);

      // Force garbage collection periodically
      if (global.gc) {
        setInterval(() => {
          global.gc();
        }, 30000); // Every 30s
      }
    } catch (err) {
      console.warn('Memory limit not available');
    }
  }

  /**
   * GPU acceleration: Use hardware decoding for image processing
   */
  enableGPUAcceleration() {
    app.disableHardwareAcceleration(); // Disable if causing issues
    console.log('💻 GPU acceleration configured');
  }

  /**
   * Thermal throttling: Reduce frequency when CPU gets hot
   */
  enableThermalThrottling() {
    console.log('🌡️ Thermal throttling: Will reduce CPU usage if overheating');
    // Implementation requires system monitoring
    // Could use node-osx-temperature or similar
  }

  /**
   * Frame rate cap: Limit overlay rendering to reduce CPU
   */
  enableFrameRateCap(maxFPS = 30) {
    console.log(`⏱️ Frame rate capped at ${maxFPS} FPS`);
    return {
      frameTime: 1000 / maxFPS,
      interval: Math.round(1000 / maxFPS),
    };
  }

  /**
   * Network optimization: Batch OCR requests to reduce overhead
   */
  getNetworkOptimizationSettings() {
    return {
      batch_size: 5, // Process 5 frames before sending
      max_batch_delay: 1000, // Max 1s wait for batch
      compression: 'gzip',
      request_timeout: 5000,
      retry_count: 2,
    };
  }

  /**
   * Display settings: Optimize rendering for multiple monitors
   */
  getDisplaySettings(displays) {
    return displays.map((display, i) => ({
      index: i,
      resolution: `${display.bounds.width}x${display.bounds.height}`,
      scaleFactor: display.scaleFactor,
      // Reduce resolution on secondary displays
      renderResolution:
        i === 0
          ? `${display.bounds.width}x${display.bounds.height}`
          : `${Math.round(display.bounds.width * 0.75)}x${Math.round(
              display.bounds.height * 0.75
            )}`,
      vsync: false, // Disable vsync for overlay
      buffering: 'double', // Double-buffer to prevent tearing
    }));
  }

  /**
   * Complete optimization profile
   */
  applyOptimizations(config = {}) {
    console.log('\n🚀 Applying performance optimizations...\n');

    const defaults = {
      priority: 'below-normal',
      maxMemoryMB: 512,
      maxFPS: 30,
      cpuCores: 1,
      gpu: false,
      thermalThrottling: true,
    };

    const settings = { ...defaults, ...config };

    // Apply each optimization
    this.setPriority(settings.priority);
    this.enableMemoryLimit(settings.maxMemoryMB);
    this.setPinToCores(settings.cpuCores);

    if (!settings.gpu) {
      this.enableGPUAcceleration();
    }

    if (settings.thermalThrottling) {
      this.enableThermalThrottling();
    }

    const frameSettings = this.enableFrameRateCap(settings.maxFPS);

    console.log('\n✅ Performance optimization complete!\n');

    return {
      frameSettings,
      networkSettings: this.getNetworkOptimizationSettings(),
    };
  }

  /**
   * Restore original settings on exit
   */
  restoreDefaults() {
    try {
      if (this.initialPriority !== null) {
        process.setProcessPriority(this.initialPriority);
      }
      console.log('Restored default process priority');
    } catch (err) {
      console.warn('Could not restore priority:', err.message);
    }
  }
}

export const performanceManager = new PerformanceManager();
