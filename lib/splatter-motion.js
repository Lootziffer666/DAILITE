/**
 * SPLATTER MOTION LIBRARY
 * ========================
 * Adaptive motion grammar combining FLUBBER's playful splatters
 * with input-aware triggering (auto/click/gesture)
 */

class SplatterMotion {
  constructor(options = {}) {
    this.mode = options.mode || 'auto'; // 'auto' | 'click' | 'gesture'
    this.intensity = options.intensity || 1; // 0.5 - 2
    this.prefersReducedMotion = this._checkReducedMotion();
    this.touchEnabled = this._detectTouch();
    this.autoMode = options.autoMode || this.touchEnabled; // Auto-detect or override

    this._setupObservers();
  }

  _checkReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _detectTouch() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  _setupObservers() {
    // Listen to prefers-reduced-motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  /**
   * LIQUID WAVE - Bouncing vertical blob
   * Perfect for: Update indicators, status changes, live data
   */
  liquidWave(element, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 3000,
      intensity = this.intensity,
      color = '#A855F7',
      trigger = this.mode,
    } = options;

    const keyframes = `
      @keyframes splatter-liquid-wave-${Date.now()} {
        0%, 100% { height: ${20 * intensity}%; }
        50% { height: ${72 * intensity}%; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(168, 85, 247, 0.12);
      border: 2px solid ${color};
      overflow: hidden;
      position: relative;
    `;

    const wave = document.createElement('div');
    wave.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: ${color};
      border-radius: 100% 100% 0 0 / 30px 30px 0 0;
      animation: splatter-liquid-wave-${Date.now()} ${duration}ms ease-in-out ${trigger === 'auto' ? 'infinite' : '1'};
    `;

    element.appendChild(wave);

    if (trigger === 'click') {
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => {
        wave.style.animation = `splatter-liquid-wave-${Date.now()} ${duration}ms ease-in-out`;
      });
    }

    return { element, wave, keyframes: style };
  }

  /**
   * RIPPLE - Expanding circle burst
   * Perfect for: Button presses, actions confirmed, state transitions
   */
  ripple(element, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 400,
      color = '#A855F7',
      trigger = 'click',
    } = options;

    const keyframes = `
      @keyframes splatter-ripple-${Date.now()} {
        to {
          transform: translate(-50%, -50%) scale(2.8);
          opacity: 0;
        }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.position = 'relative';
    element.style.overflow = 'hidden';

    const doRipple = (e) => {
      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        top: ${y}px;
        left: ${x}px;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.35;
        pointer-events: none;
        animation: splatter-ripple-${Date.now()} ${duration}ms ease-out;
      `;

      element.appendChild(ripple);
      setTimeout(() => ripple.remove(), duration);
    };

    if (trigger === 'click' || trigger === 'auto') {
      element.addEventListener('click', doRipple);
      if (this.touchEnabled) {
        element.addEventListener('touchend', doRipple);
      }
    }

    return { element, doRipple, keyframes: style };
  }

  /**
   * STAGGER - Cascade-in items
   * Perfect for: Lists, stats, data reveals
   */
  stagger(container, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 400,
      delay = 100,
      intensity = this.intensity,
      trigger = this.mode,
    } = options;

    const items = container.querySelectorAll('[data-stagger-item]');
    const keyframes = `
      @keyframes splatter-stagger-${Date.now()} {
        from {
          opacity: 0;
          transform: translateY(${6 * intensity}px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    const animateItems = () => {
      items.forEach((item, index) => {
        item.style.animation = `splatter-stagger-${Date.now()} ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both`;
        item.style.animationDelay = `${index * delay}ms`;
      });
    };

    if (trigger === 'auto') {
      animateItems();
    } else if (trigger === 'click') {
      container.style.cursor = 'pointer';
      container.addEventListener('click', animateItems);
    }

    return { container, items, animateItems, keyframes: style };
  }

  /**
   * BEAM - Conic gradient spinning border
   * Perfect for: Highlights, important indicators, status badges
   */
  beam(element, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 1500,
      color1 = '#A855F7',
      color2 = '#F5E642',
      trigger = 'auto',
    } = options;

    const keyframes = `
      @keyframes splatter-beam-${Date.now()} {
        to { --beam-angle: 360deg; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.cssText = `
      --beam-angle: 0deg;
      position: relative;
      overflow: hidden;
    `;

    const beamOuter = document.createElement('div');
    beamOuter.style.cssText = `
      position: absolute;
      inset: -1px;
      border-radius: 14px;
      background: conic-gradient(
        from var(--beam-angle, 0deg),
        transparent 75%,
        ${color1},
        ${color2},
        transparent 100%
      );
      animation: splatter-beam-${Date.now()} ${duration}ms linear ${trigger === 'auto' ? 'infinite' : '1'};
    `;

    const beamInner = document.createElement('div');
    beamInner.style.cssText = `
      position: absolute;
      inset: 1.5px;
      background: inherit;
      border-radius: 13px;
    `;

    element.appendChild(beamOuter);
    element.appendChild(beamInner);

    if (trigger === 'click') {
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => {
        beamOuter.style.animation = `splatter-beam-${Date.now()} ${duration}ms linear`;
      });
    }

    return { element, beamOuter, beamInner, keyframes: style };
  }

  /**
   * WIPE - Sliding fill reveal
   * Perfect for: Text reveals, content appearing, transitions
   */
  wipe(element, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 2000,
      color = '#A855F7',
      direction = 'left-to-right', // 'left-to-right' | 'top-to-bottom'
      trigger = 'auto',
    } = options;

    const keyframes = `
      @keyframes splatter-wipe-${Date.now()} {
        0%, 20% { transform: translateX(-120%) rotate(-8deg); }
        60%, 100% { transform: translateX(120%) rotate(-8deg); }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.position = 'relative';
    element.style.overflow = 'hidden';

    const wiper = document.createElement('div');
    wiper.style.cssText = `
      position: absolute;
      inset: -4px;
      background: ${color};
      transform: translateX(-120%) rotate(-8deg);
      animation: splatter-wipe-${Date.now()} ${duration}ms ease-in-out ${trigger === 'auto' ? 'infinite' : '1'};
      pointer-events: none;
    `;

    element.appendChild(wiper);

    if (trigger === 'click') {
      element.style.cursor = 'pointer';
      element.addEventListener('click', () => {
        wiper.style.animation = `splatter-wipe-${Date.now()} ${duration}ms ease-in-out`;
      });
    }

    return { element, wiper, keyframes: style };
  }

  /**
   * ENERGY LINE - Progress bar with sliding fill
   * Perfect for: Progress indicators, data loading, status
   */
  energyLine(container, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 2000,
      color = '#A855F7',
      progress = 0.45,
      trigger = 'auto',
    } = options;

    const keyframes = `
      @keyframes splatter-energy-${Date.now()} {
        0% { left: -${progress * 100}%; }
        100% { left: 100%; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    container.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(28, 27, 46, 0.08);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      position: absolute;
      height: 100%;
      width: ${progress * 100}%;
      background: ${color};
      border-radius: 3px;
      animation: splatter-energy-${Date.now()} ${duration}ms linear ${trigger === 'auto' ? 'infinite' : '1'};
    `;

    container.appendChild(fill);

    return { container, fill, keyframes: style };
  }

  /**
   * GOOEY FILTER - SVG-based blob merging
   * Perfect for: Transitions between sections, organic shapes
   */
  gooeyFilter(containerId = 'gooey-filter') {
    if (this.prefersReducedMotion) return;

    const existing = document.getElementById(containerId);
    if (existing) return existing;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', containerId);
    svg.setAttribute('style', 'position:absolute;width:0;height:0');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'gooey');

    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '10');
    blur.setAttribute('result', 'blur');

    const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    colorMatrix.setAttribute('in', 'blur');
    colorMatrix.setAttribute('mode', 'matrix');
    colorMatrix.setAttribute(
      'values',
      '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10'
    );

    filter.appendChild(blur);
    filter.appendChild(colorMatrix);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    return svg;
  }

  /**
   * ORBITAL - Spinning circle with rotating dot
   * Perfect for: Loading states, processing, active indicators
   */
  orbital(element, options = {}) {
    if (this.prefersReducedMotion) return;

    const {
      duration = 800,
      color = '#A855F7',
    } = options;

    const keyframes = `
      @keyframes splatter-orbital-${Date.now()} {
        to { transform: rotate(360deg); }
      }
    `;

    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.cssText = `
      width: 40px;
      height: 40px;
      position: relative;
    `;

    const ring = document.createElement('div');
    ring.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid rgba(28, 27, 46, 0.1);
      border-top-color: ${color};
      animation: splatter-orbital-${Date.now()} ${duration}ms linear infinite;
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      width: 7px;
      height: 7px;
      background: ${color};
      border-radius: 50%;
      top: -3px;
      left: 50%;
      transform: translateX(-50%);
    `;

    element.appendChild(ring);
    element.appendChild(dot);

    return { element, ring, dot, keyframes: style };
  }

  /**
   * PUBLIC API: Set global mode
   */
  setMode(mode) {
    this.mode = mode; // 'auto' | 'click' | 'gesture'
  }

  /**
   * PUBLIC API: Set intensity
   */
  setIntensity(value) {
    this.intensity = Math.max(0.5, Math.min(2, value));
  }

  /**
   * PUBLIC API: Check if running on touch device
   */
  isTouchDevice() {
    return this.touchEnabled;
  }

  /**
   * PUBLIC API: Respect user preferences
   */
  respectsUserPreferences() {
    return this.prefersReducedMotion;
  }
}

export default SplatterMotion;
