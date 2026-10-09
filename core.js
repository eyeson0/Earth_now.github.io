/* One source of truth, one animation loop, and cancellation primitives for EARTH // NOW. */
(function () {
  const defaults = {
    format: '24', seconds: true, date: true, zone: true, quote: true, quoteMs: 15000,
    location: null, weather: null, clocks: [], background: 'earth', font: 'DM Sans',
    clockScale: 100, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    world: 'Earth', activeTransition: null, rendererStatus: 'CSS fallback renderer'
  };
  const key = 'earth-now-settings-v2';
  function safeSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      const savedLocation = saved.location && typeof saved.location.name === 'string' && Number.isFinite(saved.location.lat) && Number.isFinite(saved.location.lon) ? saved.location : null;
      return {
        ...defaults,
        format: ['12', '24'].includes(saved.format) ? saved.format : defaults.format,
        seconds: typeof saved.seconds === 'boolean' ? saved.seconds : defaults.seconds,
        date: typeof saved.date === 'boolean' ? saved.date : defaults.date,
        zone: typeof saved.zone === 'boolean' ? saved.zone : defaults.zone,
        background: typeof saved.background === 'string' ? saved.background : defaults.background,
        font: typeof saved.font === 'string' ? saved.font : defaults.font,
        clockScale: Number.isFinite(saved.clockScale) ? Math.min(130, Math.max(70, saved.clockScale)) : defaults.clockScale,
        location: savedLocation,
        reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : defaults.reducedMotion
      };
    } catch { return { ...defaults }; }
  }
  const state = safeSettings();
  const listeners = new Set();
  const requests = new Map();
  const controller = {
    id: 0, raf: 0, lastSecond: -1, active: null, paused: false, frameCount: 0, frameWindow: performance.now(), fps: 0,
    transitionTo(name, options = {}) {
      this.cancel('superseded');
      const item = { id: ++this.id, name, started: performance.now(), duration: state.reducedMotion ? 1 : (options.duration || 1000), onUpdate: options.onUpdate, onComplete: options.onComplete, onCancel: options.onCancel };
      this.active = item; state.activeTransition = { id: item.id, name }; notify(); options.onStart?.(item); return item.id;
    },
    cancel(reason = 'cancelled') { if (!this.active) return; const item = this.active; this.active = null; state.activeTransition = null; item.onCancel?.(reason); notify(); },
    pause() { this.paused = true; }, play() { this.paused = false; }, restart() { this.cancel('restart'); },
    setSpeed(speed) { state.animationSpeed = Math.max(.1, Math.min(4, Number(speed) || 1)); },
    setReducedMotion(value) { state.reducedMotion = Boolean(value); document.documentElement.classList.toggle('reduce-motion', state.reducedMotion); persist(); notify(); }
  };
  function persist() {
    const { format, seconds, date, zone, background, font, clockScale, reducedMotion, location } = state;
    localStorage.setItem(key, JSON.stringify({ format, seconds, date, zone, background, font, clockScale, reducedMotion, location: location ? { name: location.name, country: location.country, lat: location.lat, lon: location.lon, code: location.code, zone: location.zone } : null }));
  }
  function notify() { listeners.forEach(fn => fn(state)); }
  function set(partial) { Object.assign(state, partial); persist(); notify(); }
  function beginRequest(name) { requests.get(name)?.abort(); const abort = new AbortController(); const id = (state._requestIds?.[name] || 0) + 1; state._requestIds ||= {}; state._requestIds[name] = id; requests.set(name, abort); return { id, signal: abort.signal, isCurrent: () => state._requestIds[name] === id }; }
  function animate(now) {
    if (!controller.paused) {
      controller.frameCount++;
      if (now - controller.frameWindow >= 1000) { controller.fps = controller.frameCount; controller.frameCount = 0; controller.frameWindow = now; state.fps = controller.fps; }
      const second = Math.floor(now / 1000);
      if (second !== controller.lastSecond) { controller.lastSecond = second; window.EarthNowCore?.onSecond?.(state); }
      const active = controller.active;
      if (active) { const t = Math.min(1, (now - active.started) / active.duration); active.onUpdate?.(t); if (t === 1) { controller.active = null; state.activeTransition = null; active.onComplete?.(); notify(); } }
      window.EarthNowCore?.onFrame?.(now, state);
    }
    controller.raf = requestAnimationFrame(animate);
  }
  window.EarthNowCore = { state, set, persist, subscribe: fn => (listeners.add(fn), () => listeners.delete(fn)), beginRequest, transition: controller.transitionTo.bind(controller), cancelTransition: controller.cancel.bind(controller), animation: controller, onSecond: null, onFrame: null, debug: () => ({ ...state, requestIds: state._requestIds, activeTransition: controller.active?.name || 'none', animationState: controller.paused ? 'paused' : 'playing', fps: controller.fps, loop: 'single requestAnimationFrame loop', renderer: state.rendererStatus }) };
  document.documentElement.classList.toggle('reduce-motion', state.reducedMotion);
  requestAnimationFrame(animate);
})();
