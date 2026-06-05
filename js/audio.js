/* ============================
   紫夜魔谕 · Procedural Audio
   Web Audio API · Zero Files
   ============================ */

'use strict';

const TAROT_AUDIO = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let initialized = false;

  /* ─── Init ───────────────────────────────── */
  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
      initialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio API unavailable');
    }
  }

  function ensureReady() {
    if (!initialized) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return initialized && !muted;
  }

  /* ─── Mute Toggle ───────────────────────── */
  function toggleMute() {
    muted = !muted;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, ctx.currentTime, 0.08);
    }
    updateToggleUI();
    return muted;
  }

  function isMuted() { return muted; }

  /* ─── Inject mute button into navbar ────── */
  function injectToggle() {
    const nav = document.querySelector('.nav-inner');
    const cta = document.getElementById('nav-cta');
    if (!nav || !cta) return;

    const btn = document.createElement('button');
    btn.className = 'audio-toggle';
    btn.id = 'audio-toggle';
    btn.setAttribute('aria-label', '切换音效');
    btn.title = '音效开关';
    btn.innerHTML = `
      <svg class="audio-icon-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.5"/>
      </svg>
      <svg class="audio-icon-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true" style="display:none">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
      </svg>`;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      init();
      toggleMute();
    });

    nav.insertBefore(btn, cta);

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      .audio-toggle {
        background: none;
        border: 1px solid rgba(201,168,76,0.2);
        border-radius: 8px;
        padding: 6px 8px;
        cursor: pointer;
        color: var(--gold-400, #c9a84c);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        flex-shrink: 0;
      }
      .audio-toggle:hover {
        border-color: var(--gold-400, #c9a84c);
        background: rgba(201,168,76,0.08);
        box-shadow: 0 0 12px rgba(201,168,76,0.15);
      }
      .audio-toggle.is-muted { opacity: 0.4; }
      @media (max-width: 768px) {
        .audio-toggle {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 999;
          background: rgba(13,0,16,0.85);
          backdrop-filter: blur(8px);
          border-color: rgba(201,168,76,0.3);
          padding: 10px 12px;
          border-radius: 50%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function updateToggleUI() {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    const on  = btn.querySelector('.audio-icon-on');
    const off = btn.querySelector('.audio-icon-off');
    if (on)  on.style.display  = muted ? 'none' : '';
    if (off) off.style.display = muted ? '' : 'none';
    btn.classList.toggle('is-muted', muted);
  }

  /* ─── Sound: Card Hover (crystalline ping) ─ */
  function playHover() {
    if (!ensureReady()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.06);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.12);
  }

  /* ─── Sound: Theme/Chip Select (warm chord) ─ */
  function playSelect() {
    if (!ensureReady()) return;
    const t = ctx.currentTime;

    [330, 415, 494].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const offset = i * 0.03;
      g.gain.setValueAtTime(0.05, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + offset);
      osc.connect(g); g.connect(masterGain);
      osc.start(t + offset); osc.stop(t + 0.5);
    });
  }

  /* ─── Sound: Card Reveal (deep bell + harmonics) ─ */
  function playReveal() {
    if (!ensureReady()) return;
    const t = ctx.currentTime;

    const harmonics = [
      { freq: 220, vol: 0.10, dur: 1.5 },
      { freq: 440, vol: 0.07, dur: 1.0 },
      { freq: 660, vol: 0.04, dur: 0.8 },
      { freq: 1320, vol: 0.02, dur: 0.5, delay: 0.05 },
    ];

    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = h.freq;
      const start = t + (h.delay || 0);
      g.gain.setValueAtTime(h.vol, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + h.dur);
      osc.connect(g); g.connect(masterGain);
      osc.start(start); osc.stop(start + h.dur);
    });
  }

  /* ─── Sound: Form Submit (ascending sweep) ─ */
  function playSubmit() {
    if (!ensureReady()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.25);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.45);

    // Sparkle tail
    setTimeout(() => {
      if (!ensureReady()) return;
      const t2 = ctx.currentTime;
      [880, 1100].forEach((f, i) => {
        const o = ctx.createOscillator();
        const gg = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        gg.gain.setValueAtTime(0.03, t2 + i * 0.06);
        gg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.3);
        o.connect(gg); gg.connect(masterGain);
        o.start(t2 + i * 0.06); o.stop(t2 + 0.35);
      });
    }, 200);
  }

  /* ─── Sound: Typing tick (noise burst) ───── */
  let lastTickTime = 0;
  function playTick() {
    if (!ensureReady()) return;
    const now = performance.now();
    if (now - lastTickTime < 80) return; // throttle
    lastTickTime = now;

    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.003);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.15));
    }

    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    src.buffer = buf;
    filt.type = 'highpass';
    filt.frequency.value = 3000;
    g.gain.value = 0.012;
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start(t);
  }

  /* ─── Sound: Error/Shake (low buzz) ──────── */
  function playError() {
    if (!ensureReady()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.setValueAtTime(110, t + 0.07);
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.18);
  }

  /* ─── Boot ──────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToggle);
  } else {
    injectToggle();
  }
  // Init on first interaction (browser autoplay policy)
  document.addEventListener('click', () => init(), { once: true });
  document.addEventListener('touchstart', () => init(), { once: true });

  return { init, toggleMute, isMuted, playHover, playReveal, playSelect, playSubmit, playTick, playError };
})();
