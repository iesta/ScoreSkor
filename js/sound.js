const SoundFX = (() => {
  const PREFS_KEY = 'scoreskor_prefs';
  let enabled = true;
  let horizontalView = false;
  let fontFamily = 'Henny Penny';

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.soundEnabled === 'boolean') enabled = data.soundEnabled;
        if (typeof data.horizontalView === 'boolean') horizontalView = data.horizontalView;
        if (typeof data.fontFamily === 'string') fontFamily = data.fontFamily;
      }
    } catch {}
  }

  function savePrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ soundEnabled: enabled, horizontalView, fontFamily }));
  }

  function getCtx() {
    return new (window.AudioContext || window.webkitAudioContext)();
  }

  function play(freq, duration) {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  function onPlus() { play(880, 0.08); }
  function onMinus() { play(440, 0.08); }
  function onPlusBig() { play(1200, 0.1); }
  function onMinusBig() { play(330, 0.1); }

  function setEnabled(val) { enabled = val; savePrefs(); }
  function isEnabled() { return enabled; }

  function setHorizontalView(val) { horizontalView = val; savePrefs(); }
  function isHorizontalView() { return horizontalView; }

  function setFontFamily(val) { fontFamily = val; savePrefs(); }
  function getFontFamily() { return fontFamily; }

  loadPrefs();

  return {
    onPlus, onMinus, onPlusBig, onMinusBig,
    setEnabled, isEnabled,
    setHorizontalView, isHorizontalView,
    setFontFamily, getFontFamily
  };
})();