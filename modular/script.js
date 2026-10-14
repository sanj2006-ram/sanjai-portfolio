(function() {
  'use strict';

  // State
  var soundEnabled = true;
  var audioCtx = null;
  var activeVisualMode = 'bars';

  // Synthesize pleasant micro-haptic click audio
  
  // ==================== ULTRA-LOW-LATENCY TACTILE SOUND ENGINE ====================
  var SoundFX = (function() {
    var ctx = null;
    var masterGain = null;
    var keepAliveNode = null;
    var enabled = true;
    var lastPlayTime = 0;
    var lastTickTime = 0;

    // Pre-rendered AudioBuffers
    var bClick = null;
    var bNavF = null;
    var bNavB = null;
    var bTab = null;
    var bFlip = null;
    var bTick = null;
    var bModal = null;
    var bSuccess = null;

    // Load initial preference safely from localStorage (defaults to true across production & local)
    try {
      try { localStorage.removeItem('portfolio_sound_enabled'); } catch(e) {}
      var saved = localStorage.getItem('portfolio_audio_active_v2');
      if (saved !== null) {
        enabled = (saved === 'true');
      } else {
        enabled = true;
      }
    } catch(e) {
      enabled = true;
    }

    function buildSweep(c, startFreq, endFreq, duration, peakGain) {
      var sr = c.sampleRate || 44100;
      var len = Math.floor(sr * duration);
      var buf = c.createBuffer(1, len, sr);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / sr;
        var p = i / len;
        var f = startFreq + (endFreq - startFreq) * p;
        var a = peakGain * Math.exp(-p * 6.0);
        d[i] = a * Math.sin(2 * Math.PI * f * t);
      }
      return buf;
    }

    function buildChord(c, freqs, duration, peakGain) {
      var sr = c.sampleRate || 44100;
      var len = Math.floor(sr * duration);
      var buf = c.createBuffer(1, len, sr);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / sr;
        var sum = 0;
        for (var f = 0; f < freqs.length; f++) {
          var stagger = f * 0.025;
          if (t >= stagger) {
            var pt = (t - stagger) / (duration - stagger);
            var a = (peakGain / freqs.length) * Math.exp(-pt * 5.0);
            sum += a * Math.sin(2 * Math.PI * freqs[f] * (t - stagger));
          }
        }
        d[i] = sum;
      }
      return buf;
    }

    function initBuffers(c) {
      if (bClick) return;
      try {
        bClick = buildSweep(c, 640, 160, 0.035, 0.12);
        bNavF = buildSweep(c, 520, 720, 0.040, 0.13);
        bNavB = buildSweep(c, 680, 460, 0.040, 0.13);
        bTab = buildSweep(c, 460, 920, 0.045, 0.11);
        bFlip = buildSweep(c, 340, 680, 0.050, 0.10);
        bTick = buildSweep(c, 880, 880, 0.012, 0.05);
        bModal = buildChord(c, [587.33, 880, 1174.66], 0.160, 0.08);
        bSuccess = buildChord(c, [523.25, 659.25, 783.99, 1046.50], 0.180, 0.09);
      } catch(e) {}
    }

    function getAudioCtx() {
      if (!ctx) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          try {
            ctx = new AudioContextClass({ latencyHint: 'interactive' });
          } catch(e) {
            try { ctx = new AudioContextClass(); } catch(e2) {}
          }
          if (ctx) {
            try {
              masterGain = ctx.createGain();
              masterGain.gain.setValueAtTime(enabled ? 1 : 0, ctx.currentTime);
              masterGain.connect(ctx.destination);
              initBuffers(ctx);
            } catch(e) {}
          }
        }
      }
      return ctx;
    }

    // Hardware keep-alive: keeps DAC awake with a zero-gain active graph node
    function startKeepAlive() {
      if (!ctx || keepAliveNode || ctx.state !== 'running') return;
      try {
        var osc = ctx.createOscillator();
        var silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.connect(silentGain);
        silentGain.connect(ctx.destination);
        osc.start(0);
        keepAliveNode = osc;
      } catch(e) {}
    }

    // Hardware unlocker: wakes AudioContext and primes hardware immediately
    function unlockAudio() {
      var c = getAudioCtx();
      if (!c) return;
      if (c.state === 'suspended') {
        try {
          c.resume().then(startKeepAlive).catch(function() {});
          var buffer = c.createBuffer(1, 1, 22050);
          var source = c.createBufferSource();
          source.buffer = buffer;
          source.connect(c.destination);
          source.start(0);
        } catch(e) {}
      } else if (c.state === 'running') {
        startKeepAlive();
      }
    }

    // Register hardware pre-warm on earliest touch/pointer/mouse/key events on window
    ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach(function(evt) {
      window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    });

    // Zero-latency playback: schedules pre-rendered AudioBuffer with robust async resumption support
    function playBuffer(buf, pitchRatio) {
      if (!enabled || !buf) return;
      var c = getAudioCtx();
      if (!c) return;

      var now = Date.now();
      // Hardware debounce: prevents multiple overlapping nodes
      if (now - lastPlayTime < 95) return;
      lastPlayTime = now;

      function scheduleNode() {
        try {
          var src = c.createBufferSource();
          src.buffer = buf;
          if (pitchRatio && pitchRatio !== 1.0) {
            src.playbackRate.setValueAtTime(pitchRatio, c.currentTime);
          }
          src.connect(masterGain || c.destination);
          src.start(0);
        } catch(e) {}
      }

      if (c.state === 'suspended') {
        c.resume().then(function() {
          startKeepAlive();
          scheduleNode();
        }).catch(function() {});
      } else {
        if (c.state !== 'running') {
          try { c.resume().catch(function() {}); } catch(e) {}
        }
        scheduleNode();
      }
    }

    // Raw playback for slider ticks (independent debounce)
    function playTickBuffer(buf) {
      if (!enabled || !buf) return;
      var c = getAudioCtx();
      if (!c) return;
      try {
        if (c.state === 'suspended') c.resume();
        var src = c.createBufferSource();
        src.buffer = buf;
        src.connect(masterGain || c.destination);
        src.start(0);
      } catch(e) {}
    }

    function setEnabled(state) {
      enabled = !!state;
      try {
        localStorage.setItem('portfolio_audio_active_v2', enabled ? 'true' : 'false');
      } catch(e) {}
      if (masterGain && ctx) {
        try {
          masterGain.gain.setValueAtTime(enabled ? 1 : 0, ctx.currentTime);
        } catch(e) {}
      }
      return enabled;
    }

    function silenceGraph() {
      // In-memory silent graph without persisting false to localStorage
      enabled = false;
      if (masterGain && ctx) {
        try {
          masterGain.gain.setValueAtTime(0, ctx.currentTime);
        } catch(e) {}
      }
    }

    // Auto-prime on script load
    try { getAudioCtx(); } catch(e) {}

    return {
      click: function(freq) {
        var ratio = freq ? (freq / 640) : 1.0;
        playBuffer(bClick, ratio);
      },
      nav: function(isForward) { playBuffer(isForward ? bNavF : bNavB); },
      tab: function() { playBuffer(bTab); },
      flip: function() { playBuffer(bFlip); },
      modalOpen: function() { playBuffer(bModal); },
      success: function() { playBuffer(bSuccess); },
      tick: function() {
        var now = Date.now();
        if (now - lastTickTime < 35) return;
        lastTickTime = now;
        playTickBuffer(bTick);
      },
      toggle: function() { return setEnabled(!enabled); },
      mute: function() { return setEnabled(false); },
      unmute: function() { return setEnabled(true); },
      silence: silenceGraph,
      isEnabled: function() { return enabled; },
      getLastPlayTime: function() { return lastPlayTime; },
      warm: unlockAudio,
      suspend: function() {
        if (ctx && ctx.state === 'running') {
          try { ctx.suspend(); } catch(e) {}
        }
      }
    };
  })();
  window.SoundFX = SoundFX;

  // Background/foreground power management
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (typeof SoundFX !== 'undefined' && SoundFX.suspend) SoundFX.suspend();
    } else {
      if (typeof SoundFX !== 'undefined' && SoundFX.warm) SoundFX.warm();
    }
  });

  // Tactile audio bridge helpers
  window.playClickAudio = function(freq) {
    if (typeof SoundFX !== 'undefined' && SoundFX.isEnabled && SoundFX.isEnabled()) {
      if (Date.now() - SoundFX.getLastPlayTime() < 250) return;
      SoundFX.click(freq);
    }
  };
  window.playSuccessAudio = function() {
    if (typeof SoundFX !== 'undefined' && SoundFX.isEnabled && SoundFX.isEnabled()) {
      if (Date.now() - SoundFX.getLastPlayTime() < 250) return;
      SoundFX.success();
    }
  };

  // ==================== INSTANT ZERO-LATENCY EVENT DELEGATION ====================
  var INTERACTIVE_SELECTOR = 'button, a, .btn, .dock-btn, .nav-anchor, .mobile-dropdown-anchor, .mobile-menu-trigger, .sql-preset-btn, .skills-tab-btn, .view-tab-btn, .filter-pill, .interactive-tag, .flip-card-unit, .schema-node-card, .schema-table-node, .pipeline-step-item, .cmdk-result-row, .code-copy-btn, .contact-submit-btn, [role="button"], [role="tab"]';

  var isTouchInteraction = false;
  var touchResetTimer = null;
  var lastTactileTriggerTime = 0;

  function handleTactileTrigger(e, isTouch) {
    if (!SoundFX || !SoundFX.isEnabled()) return;

    // Reject non-left clicks for mouse events
    if (!isTouch && e.button !== undefined && e.button !== 0) return;

    var target = e.target;
    if (!target || typeof target.closest !== 'function') return;

    var el = target.closest(INTERACTIVE_SELECTOR);
    if (!el) return;

    // Ignore sliders and form inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && el.type !== 'button' && el.type !== 'submit') {
      return;
    }

    // Mark interaction timestamp to eliminate any subsequent click event duplicate
    lastTactileTriggerTime = Date.now();

    // Pre-warm hardware immediately
    if (SoundFX.warm) SoundFX.warm();

    // Elements with dedicated custom sounds - skip generic click to prevent double sounds!
    var onclickStr = el.getAttribute('onclick') || '';
    if (el.id === 'btn-audio-toggle' || 
        el.classList.contains('contact-channel-item') || 
        el.classList.contains('code-copy-btn') || 
        el.classList.contains('contact-submit-btn') || 
        onclickStr.includes('copyContact') || 
        onclickStr.includes('copyResumeText') || 
        onclickStr.includes('copyFormulaCode') || 
        onclickStr.includes('handleContactSubmit') || 
        onclickStr.includes('enterPortfolioDirectly')) {
      return;
    }

    // 1. Directional Screen Navigation Audio
    if (el.classList.contains('nav-anchor') || 
        el.classList.contains('dock-btn') || 
        el.classList.contains('mobile-dropdown-anchor') || 
        onclickStr.includes('navigateToScreen') || 
        onclickStr.includes('jumpToSection') ||
        (el.getAttribute('href') && el.getAttribute('href').startsWith('#') && !el.getAttribute('href').startsWith('#privacy-sec-'))) {
      
      var targetScreen = null;
      if (onclickStr) {
        var m = onclickStr.match(/navigateToScreen\(['"]([^'"]+)['"]\)/);
        if (m) {
          targetScreen = m[1];
        } else {
          var m2 = onclickStr.match(/jumpToSection\(['"]([^'"]+)['"]\)/);
          if (m2) {
            var screenMap = { 'hero': 'overview', 'dashboard': 'dashboard', 'projects': 'projects', 'skills': 'skills', 'experience': 'experience', 'contact': 'contact', 'resume': 'resume' };
            targetScreen = screenMap[m2[1]] || m2[1];
          }
        }
      } else if (el.getAttribute('href')) {
        targetScreen = el.getAttribute('href').replace('#', '');
      }
      if (targetScreen && typeof screenOrder !== 'undefined') {
        var pIdx = screenOrder.indexOf(currentScreen);
        var nIdx = screenOrder.indexOf(targetScreen);
        SoundFX.nav(nIdx >= pIdx);
      } else {
        SoundFX.nav(true);
      }
      return;
    }

    // 2. Flip Cards
    if (el.classList.contains('flip-card-unit')) {
      SoundFX.flip();
      return;
    }

    // 3. Tabs, Filters and Pipeline Steppers
    if (el.classList.contains('filter-pill') || 
        el.classList.contains('tab-btn') || 
        el.classList.contains('view-tab-btn') || 
        el.classList.contains('skills-tab-btn') || 
        el.classList.contains('sql-preset-btn') ||
        el.classList.contains('schema-node-card') ||
        el.classList.contains('schema-table-node') ||
        el.classList.contains('pipeline-step-item')) {
      SoundFX.tab();
      return;
    }

    // 4. Default Crisp Click
    SoundFX.click();
  }

  // 1. TOUCH DEVICES: Capture phase touchstart fires at the instant finger touches glass (0ms delay)
  window.addEventListener('touchstart', function(e) {
    isTouchInteraction = true;
    clearTimeout(touchResetTimer);
    touchResetTimer = setTimeout(function() {
      isTouchInteraction = false;
    }, 600);
    handleTactileTrigger(e, true);
  }, { capture: true, passive: true });

  // 2. MOUSE DEVICES: Capture phase mousedown fires at the exact instant mouse button is pressed down (0ms delay)
  window.addEventListener('mousedown', function(e) {
    if (isTouchInteraction) return;
    handleTactileTrigger(e, false);
  }, { capture: true, passive: true });

  // 3. KEYBOARD / ACCESSIBILITY FALLBACK:
  // Fires ONLY if neither touchstart nor mousedown triggered audio within 450ms (e.g. Enter / Space key)
  window.addEventListener('click', function(e) {
    if (isTouchInteraction) return;
    if (Date.now() - lastTactileTriggerTime < 450) return;
    if (Date.now() - SoundFX.getLastPlayTime() < 250) return;
    handleTactileTrigger(e, false);
  }, { capture: true });

  // Range slider input ticks
  document.addEventListener('input', function(e) {
    if (e.target && e.target.type === 'range') {
      SoundFX.tick();
    }
  }, { passive: true });

  // ==================== INTRO SPLASH CONTROLLER ====================
  var introSequenceTimer = null;
  var introSafetyWatchdog = null;

  window.enterPortfolioDirectly = function(fromUser) {
    if (introSequenceTimer) {
      clearInterval(introSequenceTimer);
      introSequenceTimer = null;
    }
    if (introSafetyWatchdog) {
      clearTimeout(introSafetyWatchdog);
      introSafetyWatchdog = null;
    }
    try {
      if (fromUser && typeof SoundFX !== 'undefined' && SoundFX.modalOpen) {
        SoundFX.modalOpen();
      }
    } catch(e) {}

    var gate = document.getElementById('intro-splash-gate');
    if (gate) {
      gate.classList.add('dismissed');
      gate.style.setProperty('display', 'none', 'important');
      gate.style.setProperty('opacity', '0', 'important');
      gate.style.setProperty('visibility', 'hidden', 'important');
      gate.style.setProperty('pointer-events', 'none', 'important');
      gate.setAttribute('aria-hidden', 'true');
    }
  };

  window.replayIntro = function() {
    var gate = document.getElementById('intro-splash-gate');
    if (!gate) return;
    gate.classList.remove('dismissed');
    gate.style.removeProperty('display');
    gate.style.removeProperty('opacity');
    gate.style.removeProperty('visibility');
    gate.style.removeProperty('pointer-events');
    gate.removeAttribute('aria-hidden');
    runIntroSequence();
  };

  function runIntroSequence() {
    var fill = document.getElementById('intro-progress-fill');
    var label = document.getElementById('intro-status-label');
    var pct = document.getElementById('intro-status-pct');

    // If reduced motion is preferred, reveal immediately
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.enterPortfolioDirectly(false);
      return;
    }

    if (!fill) {
      window.enterPortfolioDirectly(false);
      return;
    }

    if (introSequenceTimer) clearInterval(introSequenceTimer);

    var steps = [
      { p: 32, msg: 'Loading Power BI & DAX Models...' },
      { p: 68, msg: 'Preparing Sales Data Model...' },
      { p: 92, msg: 'Verifying SQL Query Console...' },
      { p: 100, msg: 'All Systems Ready. Welcome!' }
    ];

    var idx = 0;
    introSequenceTimer = setInterval(function() {
      if (idx >= steps.length) {
        clearInterval(introSequenceTimer);
        introSequenceTimer = null;
        setTimeout(function() {
          window.enterPortfolioDirectly(false);
        }, 150);
        return;
      }
      var s = steps[idx];
      fill.style.width = s.p + '%';
      if (pct) pct.textContent = s.p + '%';
      if (label) label.textContent = s.msg;
      idx++;
    }, 110);
  }

  // Initial load kickoff
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(runIntroSequence, 40);
    });
  } else {
    setTimeout(runIntroSequence, 20);
  }

  // Unconditional fail-safe watchdog: guarantees entrance under any circumstance
  introSafetyWatchdog = setTimeout(function() {
    window.enterPortfolioDirectly(false);
  }, 1200);

  // Toast Helper
  var toastTimer = null;
  window.showToast = function(msg) {
    var banner = document.getElementById('site-toast');
    var textSlot = document.getElementById('toast-text-slot');
    if (!banner) return;
    if (textSlot && msg) textSlot.textContent = msg;
    banner.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      banner.classList.remove('show');
    }, 2800);
  };

  // ==========================================================================
  // SESSION RATE LIMITER ENGINE (Unified Throttling & Session Protection)
  // Protects Inquiries, PDF Print, Clipboard Operations & Interactive Sandboxes
  // ==========================================================================
  window.SessionRateLimiter = (function() {
    var memoryStore = {};

    function getStore() {
      try {
        var raw = sessionStorage.getItem('sr_session_rate_limits');
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return memoryStore;
      }
    }

    function saveStore(data) {
      try {
        sessionStorage.setItem('sr_session_rate_limits', JSON.stringify(data));
      } catch (e) {
        memoryStore = data;
      }
    }

    return {
      check: function(actionKey, maxPerSession, cooldownSeconds) {
        var store = getStore();
        var entry = store[actionKey] || { count: 0, lastTimestamp: 0 };
        var now = Date.now();
        var elapsedSec = (now - entry.lastTimestamp) / 1000;

        // 1. Maximum total limit for the current browser session
        if (maxPerSession && entry.count >= maxPerSession) {
          return {
            allowed: false,
            reason: 'session_limit',
            remainingSeconds: 0,
            totalInSession: entry.count
          };
        }

        // 2. Cooldown check between successive triggers
        if (cooldownSeconds && entry.lastTimestamp > 0 && elapsedSec < cooldownSeconds) {
          var remaining = Math.ceil(cooldownSeconds - elapsedSec);
          return {
            allowed: false,
            reason: 'cooldown',
            remainingSeconds: remaining,
            totalInSession: entry.count
          };
        }

        return {
          allowed: true,
          remainingSeconds: 0,
          totalInSession: entry.count
        };
      },

      record: function(actionKey) {
        var store = getStore();
        var entry = store[actionKey] || { count: 0, lastTimestamp: 0 };
        entry.count += 1;
        entry.lastTimestamp = Date.now();
        store[actionKey] = entry;
        saveStore(store);
        return entry;
      },

      reset: function(actionKey) {
        var store = getStore();
        if (actionKey) {
          delete store[actionKey];
        } else {
          store = {};
        }
        saveStore(store);
      }
    };
  })();

  // Copy helper with session rate limiting
  window.copyContact = function(content, successMsg) {
    if (window.SessionRateLimiter) {
      var check = window.SessionRateLimiter.check('copy_contact', 50, 1.2);
      if (!check.allowed) {
        window.showToast('Copied to clipboard!');
        return;
      }
      window.SessionRateLimiter.record('copy_contact');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(function() {
        window.showToast(successMsg || 'Copied to clipboard!');
      }).catch(function() {
        window.showToast(successMsg || 'Copied!');
      });
    } else {
      window.showToast(successMsg || 'Copied!');
    }
    SoundFX.success();
    window.closeModal('modal-cmdk');
  };

  // Copy DAX formula button
  window.copyFormulaCode = function() {
    var code = 
      "Projected_Profit = \n" +
      "CALCULATE(\n" +
      "    SUM(Fact_Sales[Revenue]) * 0.32,\n" +
      "    FILTER(Dim_Customer, Dim_Customer[RetentionRate] >= 0.40)\n" +
      ")";
    window.copyContact(code, 'DAX formula copied to clipboard!');
  };

  // Sound toggle button
  var audioBtn = document.getElementById('btn-audio-toggle');
  function syncAudioToggleUI() {
    if (!audioBtn || typeof SoundFX === 'undefined') return;
    var isEnabled = SoundFX.isEnabled();
    audioBtn.style.opacity = isEnabled ? '1' : '0.4';
    audioBtn.setAttribute('aria-label', isEnabled ? 'Mute sound feedback' : 'Enable sound feedback');
    audioBtn.title = isEnabled ? 'Tactile sound ON - Click to mute (M)' : 'Tactile sound MUTED - Click to enable (M)';
  }

  if (audioBtn) {
    syncAudioToggleUI();
    audioBtn.addEventListener('click', function() {
      if (typeof SoundFX !== 'undefined' && SoundFX.toggle) {
        soundEnabled = SoundFX.toggle();
      } else {
        soundEnabled = !soundEnabled;
      }
      syncAudioToggleUI();
      if (soundEnabled) {
        if (typeof SoundFX !== 'undefined' && SoundFX.click) SoundFX.click(750);
        window.showToast('Audio feedback enabled');
      } else {
        window.showToast('Audio feedback muted');
      }
    });
  }

  // Modal handlers with Focus Trapping & Accessibility
  var lastFocusedElement = null;
  window.openModal = function(id) {
    var el = document.getElementById(id);
    if (el) {
      lastFocusedElement = document.activeElement;
      el.classList.add('active');
      setTimeout(function() {
        var focusable = el.querySelectorAll('input:not([disabled]), button:not([disabled]), [href], textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }, 60);
    }
  };

  window.closeModal = function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        try { lastFocusedElement.focus(); } catch(e) {}
        lastFocusedElement = null;
      }
    }
  };

  document.querySelectorAll('.modal-backdrop').forEach(function(b) {
    b.addEventListener('click', function(e) {
      if (e.target === b) {
        window.closeModal(b.id);
      }
    });
  });

  // Global Keydown shortcuts & Tab Trap
  document.addEventListener('keydown', function(e) {
    var activeModal = document.querySelector('.modal-backdrop.active');
    if (activeModal) {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.closeModal(activeModal.id);
        return;
      }
      if (e.key === 'Tab') {
        var focusables = activeModal.querySelectorAll('input:not([disabled]), button:not([disabled]), [href], textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusables.length > 0) {
          var firstEl = focusables[0];
          var lastEl = focusables[focusables.length - 1];
          if (e.shiftKey && (document.activeElement === firstEl || !activeModal.contains(document.activeElement))) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && (document.activeElement === lastEl || !activeModal.contains(document.activeElement))) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var cmdk = document.getElementById('modal-cmdk');
      if (cmdk.classList.contains('active')) {
        window.closeModal('modal-cmdk');
      } else {
        window.openModal('modal-cmdk');
        setTimeout(function() {
          var inp = document.getElementById('cmdk-input-box');
          if (inp) inp.focus();
        }, 50);
      }
    }
    var isInput = e.target && typeof e.target.matches === 'function' && e.target.matches('input, textarea, select, [contenteditable="true"]');
    if (e.key && e.key.toLowerCase() === 'm' && !isInput) {
      if (audioBtn) audioBtn.click();
    }
  });

  // Filter Command Palette
  window.filterCmdkItems = function() {
    var q = document.getElementById('cmdk-input-box').value.toLowerCase();
    var rows = document.querySelectorAll('.cmdk-result-row');
    rows.forEach(function(row) {
      var t = row.textContent.toLowerCase();
      row.style.display = t.includes(q) ? 'flex' : 'none';
    });
  };

  window.jumpToSection = function(id) {
    window.closeModal('modal-cmdk');
    var screenMap = {
      'hero': 'overview',
      'dashboard': 'dashboard',
      'projects': 'projects',
      'skills': 'skills',
      'experience': 'experience',
      'contact': 'contact',
      'resume': 'resume'
    };
    var targetScreen = screenMap[id] || id;
    if (typeof window.navigateToScreen === 'function') {
      window.navigateToScreen(targetScreen);
    }
  };

  // iOS Glass Mobile Dropdown Controller
  window.toggleMobileMenu = function(forceState) {
    var dropdown = document.getElementById('mobile-glass-dropdown');
    var menuBtn = document.getElementById('btn-mobile-menu');
    if (!dropdown || !menuBtn) return;
    
    var isCurrentlyOpen = dropdown.classList.contains('open');
    var shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

    dropdown.classList.toggle('open', shouldOpen);
    menuBtn.classList.toggle('active', shouldOpen);
    menuBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    dropdown.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

    var barsIcon = menuBtn.querySelector('.icon-menu-bars');
    var closeIcon = menuBtn.querySelector('.icon-menu-close');
    if (barsIcon) barsIcon.style.display = shouldOpen ? 'none' : 'block';
    if (closeIcon) closeIcon.style.display = shouldOpen ? 'block' : 'none';
  };

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    var dropdown = document.getElementById('mobile-glass-dropdown');
    var menuBtn = document.getElementById('btn-mobile-menu');
    if (dropdown && dropdown.classList.contains('open')) {
      if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
        window.toggleMobileMenu(false);
      }
    }
  });

  // ==========================================================================
  // HIGH-PERFORMANCE MOUSE TRACKING & SPOTLIGHT GLOW (60/120 FPS rAF Architecture)
  // Zero layout thrashing, cached dimensions, disabled on touch/reduced-motion
  // ==========================================================================
  (function initMouseTracking() {
    var hasHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasHover || prefersReduced) return;

    // 1. Spotlight Cards: rAF Throttling, Cached Rectangles & Delta Threshold
    document.querySelectorAll('.spotlight-card').forEach(function(card) {
      var cachedRect = null;
      var mouseX = 0;
      var mouseY = 0;
      var lastAppliedX = -999;
      var lastAppliedY = -999;
      var rafId = null;

      function updateSpotlight() {
        if (Math.abs(mouseX - lastAppliedX) > 1.5 || Math.abs(mouseY - lastAppliedY) > 1.5) {
          lastAppliedX = mouseX;
          lastAppliedY = mouseY;
          card.style.setProperty('--mouse-x', mouseX + 'px');
          card.style.setProperty('--mouse-y', mouseY + 'px');
        }
        rafId = null;
      }

      card.addEventListener('mouseenter', function() {
        cachedRect = card.getBoundingClientRect();
      }, { passive: true });

      card.addEventListener('mousemove', function(e) {
        if (!cachedRect) {
          cachedRect = card.getBoundingClientRect();
        }
        mouseX = e.clientX - cachedRect.left;
        mouseY = e.clientY - cachedRect.top;

        if (!rafId) {
          rafId = requestAnimationFrame(updateSpotlight);
        }
      }, { passive: true });

      card.addEventListener('mouseleave', function() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        cachedRect = null;
      }, { passive: true });
    });

    // 2. Hero 3D Card Tilt: rAF Throttling, Cached Center Coordinates & Smooth Reset
    var heroCard = document.getElementById('hero-3d-card');
    if (heroCard) {
      var heroRect = null;
      var heroTargetDX = 0;
      var heroTargetDY = 0;
      var heroRafId = null;

      function updateHeroTilt() {
        heroCard.style.transform = 'perspective(1000px) rotateY(' + (heroTargetDX * 6) + 'deg) rotateX(' + (-heroTargetDY * 6) + 'deg)';
        heroRafId = null;
      }

      heroCard.addEventListener('mouseenter', function() {
        heroRect = heroCard.getBoundingClientRect();
      }, { passive: true });

      heroCard.addEventListener('mousemove', function(e) {
        if (!heroRect) {
          heroRect = heroCard.getBoundingClientRect();
        }
        var cx = heroRect.width / 2;
        var cy = heroRect.height / 2;
        heroTargetDX = ((e.clientX - heroRect.left) - cx) / cx;
        heroTargetDY = ((e.clientY - heroRect.top) - cy) / cy;

        if (!heroRafId) {
          heroRafId = requestAnimationFrame(updateHeroTilt);
        }
      }, { passive: true });

      heroCard.addEventListener('mouseleave', function() {
        if (heroRafId) {
          cancelAnimationFrame(heroRafId);
          heroRafId = null;
        }
        heroRect = null;
        heroCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      }, { passive: true });
    }
  })();

  // 3D Flip Card Toggle
  window.toggleFlip = function(cardEl) {
    cardEl.classList.toggle('flipped');
  };

  // Filter Skills
  window.filterSkills = function(category, btnEl) {
    var btns = document.querySelectorAll('.skills-tab-btn');
    btns.forEach(function(b) {
      var onclickAttr = b.getAttribute('onclick') || '';
      var isActive = (btnEl && b === btnEl) || onclickAttr.includes("'" + category + "'") || onclickAttr.includes('"' + category + '"');
      b.classList.toggle('active', isActive);
    });

    var cards = document.querySelectorAll('.flip-card-unit');
    cards.forEach(function(card) {
      var cat = card.getAttribute('data-cat');
      if (category === 'all' || cat === category) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  };

  // Visual Mode Switcher (Bars, Growth Area, Target Gauge)
  window.switchVisualMode = function(mode) {
    activeVisualMode = mode;
    document.querySelectorAll('.view-tab-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.id === 'tab-mode-' + mode);
    });

    var barsG = document.getElementById('chart-bars-group');
    var areaG = document.getElementById('chart-area-group');
    var gaugeG = document.getElementById('chart-gauge-group');
    var legendBox = document.getElementById('chart-legend-box');
    var caption = document.getElementById('chart-caption-text');
    var monthLabels = document.querySelector('.chart-month-labels');
    var gaugeLabels = document.getElementById('chart-gauge-labels');

    if (mode === 'bars') {
      barsG.style.display = 'block';
      areaG.style.display = 'none';
      gaugeG.style.display = 'none';
      legendBox.style.display = 'flex';
      if (monthLabels) monthLabels.style.display = 'flex';
      if (gaugeLabels) gaugeLabels.style.display = 'none';
      caption.textContent = 'Monthly Revenue vs. Profit Trajectory';
    } else if (mode === 'growth') {
      barsG.style.display = 'none';
      areaG.style.display = 'block';
      gaugeG.style.display = 'none';
      legendBox.style.display = 'none';
      if (monthLabels) monthLabels.style.display = 'flex';
      if (gaugeLabels) gaugeLabels.style.display = 'none';
      caption.textContent = 'Cumulative Growth Curve & Margin Trajectory';
    } else if (mode === 'gauge') {
      barsG.style.display = 'none';
      areaG.style.display = 'none';
      gaugeG.style.display = 'block';
      legendBox.style.display = 'none';
      if (monthLabels) monthLabels.style.display = 'none';
      if (gaugeLabels) gaugeLabels.style.display = 'flex';
      caption.textContent = 'Target Attainment & Performance Index';
    }
    window.recalculateSimulation();
  };

  // Star Schema Node Inspector
  var schemaInfo = {
    'fact_sales': '-- Inspecting Fact_Sales:\n-- Contains transactional records, foreign keys to Dimensions, and base additive measures (Revenue, Quantity, Discount).\nDAX Base Measure: [Total Sales] = SUM(Fact_Sales[Revenue])',
    'dim_customer': '-- Inspecting Dim_Customer:\n-- 1-to-many relationship with Fact_Sales via CustomerKey.\n-- Supports demographic filtering (Chennai, BLR) and customer retention cohorts.\nDAX: Retention = CALCULATE(COUNTROWS(Fact_Sales), Dim_Customer[RetentionRate] > 0.4)',
    'dim_product': '-- Inspecting Dim_Product:\n-- ProductKey 1-to-many join with Fact_Sales.\n-- Category taxonomy: Electronics, Commercial, Office Supplies.\nDAX: Margin = DIVIDE(Fact_Sales[GrossProfit], Fact_Sales[GrossRevenue])',
    'dim_date': '-- Inspecting Dim_Date:\n-- Continuous date calendar connecting DateKey with Fact_Sales.\n-- Supports Time Intelligence measures (YTD, QTD, YoY Growth %)\nDAX: Sales_YoY = CALCULATE([Total Sales], SAMEPERIODLASTYEAR(Dim_Date[Date]))'
  };

  window.inspectSchemaNode = function(tableName) {
    document.querySelectorAll('.schema-table-node').forEach(function(node) {
      var isTarget = node.getAttribute('onclick').includes(tableName);
      node.classList.toggle('active', isTarget);
    });
    var out = document.getElementById('sql-console-zone');
    if (out && schemaInfo[tableName]) {
      out.textContent = schemaInfo[tableName];
      out.style.opacity = '0.55';
      setTimeout(function() {
        out.textContent = schemaInfo[tableName];
        out.style.opacity = '1';
      }, 50);
    }
  };

  // Interactive BI Cockpit Simulation
  window.recalculateSimulation = function() {
    var rev = parseFloat(document.getElementById('range-rev').value) || 180000;
    var margin = parseFloat(document.getElementById('range-margin').value) || 32;
    var ret = parseFloat(document.getElementById('range-ret').value) || 40;
    var profit = Math.round((rev * margin) / 100);

    document.getElementById('ctrl-rev-display').textContent = '₹' + rev.toLocaleString('en-IN');
    document.getElementById('ctrl-margin-display').textContent = margin + '%';
    document.getElementById('ctrl-ret-display').textContent = ret + '%';

    document.getElementById('kpi-gross-rev').textContent = '₹' + rev.toLocaleString('en-IN');
    document.getElementById('kpi-margin-pct').textContent = margin.toFixed(1) + '%';
    document.getElementById('kpi-net-profit').textContent = '₹' + profit.toLocaleString('en-IN');

    // Update Status Label
    var statusEl = document.getElementById('kpi-margin-status');
    if (margin >= 30) {
      statusEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg><span>Optimal Tier</span>';
      statusEl.style.color = '#34D399';
    } else if (margin >= 18) {
      statusEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg><span>Healthy Margin</span>';
      statusEl.style.color = 'var(--accent-cyan)';
    } else {
      statusEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg><span>Moderate Margin</span>';
      statusEl.style.color = 'var(--accent-amber)';
    }

    // Dynamic Chart Heights
    var barActive = document.getElementById('chart-bar-p6');
    var barRev = document.getElementById('chart-bar-rev-active');
    if (barActive) {
      var barHeight = Math.min(130, Math.max(20, (profit / 80000) * 110));
      barActive.setAttribute('height', barHeight);
      barActive.setAttribute('y', 145 - barHeight);
    }
    if (barRev) {
      var revH = Math.min(130, Math.max(30, (rev / 400000) * 125));
      barRev.setAttribute('height', revH);
      barRev.setAttribute('y', 145 - revH);
    }

    // Dynamic Speedometer Gauge
    var gaugeCircle = document.getElementById('gauge-circle-fill');
    var gaugeText = document.getElementById('gauge-pct-text');
    var gaugeStatusBg = document.getElementById('gauge-status-bg');
    var gaugeStatusText = document.getElementById('gauge-status-text');
    var gaugeProjected = document.getElementById('gauge-projected-val');
    var gaugeSurplus = document.getElementById('gauge-surplus-val');

    if (gaugeCircle && gaugeText) {
      var baseTarget = 160000;
      var attainmentPct = Math.round((rev / baseTarget) * 100);
      gaugeText.textContent = attainmentPct + '%';

      // 180-degree arch with pathLength="100".
      // 200% represents the full arch (100% target is straight up at 12 o'clock).
      var fillPct = Math.min(100, Math.max(0, (attainmentPct / 200) * 100));
      gaugeCircle.setAttribute('stroke-dashoffset', (100 - fillPct).toFixed(1));

      if (gaugeProjected) {
        gaugeProjected.textContent = '₹' + rev.toLocaleString('en-IN');
      }

      var diff = rev - baseTarget;
      if (diff >= 0) {
        var overPct = attainmentPct - 100;
        if (gaugeStatusText) {
          gaugeStatusText.textContent = (overPct === 0 ? '★ ON TARGET BENCHMARK' : '★ ' + overPct + '% OVER TARGET');
          gaugeStatusText.setAttribute('fill', '#047857');
        }
        if (gaugeStatusBg) {
          gaugeStatusBg.setAttribute('fill', '#ECFDF5');
          gaugeStatusBg.setAttribute('stroke', '#A7F3D0');
        }
        if (gaugeSurplus) {
          gaugeSurplus.textContent = '+₹' + diff.toLocaleString('en-IN') + ' Surplus';
          gaugeSurplus.setAttribute('fill', '#10B981');
        }
      } else {
        var deficit = Math.abs(diff);
        var underPct = 100 - attainmentPct;
        if (gaugeStatusText) {
          gaugeStatusText.textContent = '▼ ' + underPct + '% BELOW TARGET';
          gaugeStatusText.setAttribute('fill', '#B91C1C');
        }
        if (gaugeStatusBg) {
          gaugeStatusBg.setAttribute('fill', '#FEF2F2');
          gaugeStatusBg.setAttribute('stroke', '#FECACA');
        }
        if (gaugeSurplus) {
          gaugeSurplus.textContent = '-₹' + deficit.toLocaleString('en-IN') + ' Deficit';
          gaugeSurplus.setAttribute('fill', '#EF4444');
        }
      }
    }

    // Render DAX formula
    var daxBox = document.getElementById('dax-formula-render');
    daxBox.innerHTML = 
      '<button class="code-copy-btn" onclick="copyFormulaCode()">' +
        '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '<span>Copy DAX</span>' +
      '</button>' +
      '// Realtime Power BI DAX Expression:\n' +
      'Projected_Profit = \n' +
      'CALCULATE(\n' +
      '    SUM(Fact_Sales[Revenue]) * ' + (margin / 100).toFixed(2) + ',\n' +
      '    FILTER(Dim_Customer, Dim_Customer[RetentionRate] >= ' + (ret / 100).toFixed(2) + ')\n' +
      ')';
  };

  // SQL Presets Engine
  var sqlData = {
    1: "-- Query 1: Sales Fact Table Aggregation\nSELECT \n    p.category_name, \n    COUNT(s.order_id) AS total_orders,\n    SUM(s.order_amount) AS gross_sales,\n    ROUND(AVG(s.margin_pct), 2) AS avg_margin\nFROM sales_fact s\nJOIN dim_product p ON s.product_id = p.product_id\nGROUP BY p.category_name;\n----------------------------------------------------------------------\n> Electronics    | 480 orders | ₹7,45,000 | 29.5% margin\n> Commercial     | 320 orders | ₹5,12,800 | 33.2% margin\n> Office Supplies| 620 orders | ₹2,18,400 | 24.1% margin\n[Query executed in 0.0018 seconds · Ready for Star Schema DirectQuery]",
    2: "-- Query 2: Star Schema Customer Join\nSELECT \n    c.city_name, \n    COUNT(DISTINCT c.customer_id) AS total_clients,\n    SUM(f.order_amount) AS gross_turnover\nFROM dim_customer c\nLEFT JOIN sales_fact f ON c.customer_id = f.customer_id\nGROUP BY c.city_name\nHAVING gross_turnover > 100000;\n----------------------------------------------------------------------\n> Chennai (HQ)   | 142 clients | ₹8,92,400\n> Bengaluru      |  88 clients | ₹5,40,100\n> Coimbatore     |  46 clients | ₹2,15,300\n[Query executed in 0.0022 seconds · Relational Indexes Verified]",
    3: "-- Query 3: Target Variance & Attainment\nSELECT \n    fiscal_month, target_amount, actual_revenue,\n    ROUND(((actual_revenue - target_amount) / target_amount) * 100, 1) AS attainment_pct\nFROM monthly_targets\nORDER BY fiscal_month DESC;\n----------------------------------------------------------------------\n> 2026-06 (June) | ₹1,50,000 | ₹1,68,200 | +12.1% (Above Target)\n> 2026-05 (May)  | ₹1,40,000 | ₹1,49,500 |  +6.8% (Above Target)\n[Query executed in 0.0014 seconds · Zero Execution Variance]"
  };

  window.runSQLTest = function(id) {
    if (window.SessionRateLimiter) {
      var check = window.SessionRateLimiter.check('sql_test', 60, 0.3);
      if (!check.allowed) {
        window.showToast('Query throttled: executing too fast.');
        return;
      }
      window.SessionRateLimiter.record('sql_test');
    }
    var out = document.getElementById('sql-console-zone');
    if (!out) return;
    document.querySelectorAll('.sql-preset-btn').forEach(function(b, idx) {
      b.classList.toggle('active', (idx % 3) + 1 === id);
    });
    out.style.opacity = '0.55';
    setTimeout(function() {
      out.textContent = sqlData[id];
      out.style.opacity = '1';
    }, 60);
  };

  // Pipeline Stepper Active state
  window.activatePipelineStep = function(stepIdx) {
    var steps = document.querySelectorAll('.pipeline-step-item');
    steps.forEach(function(s, idx) {
      s.classList.toggle('active', idx + 1 === stepIdx);
    });
  };

  // ==========================================================================
  // CONTACT SUBMISSION CONTROLLER & DISPATCH PROTECTION
  // Protects inquiry dispatch, prevents double-clicks, and preserves UI elegance
  // ==========================================================================
  var contactCooldownInterval = null;
  var isContactSubmitting = false;

  window.updateContactRateLimitUI = function() {
    var submitBtn = document.getElementById('btn-contact-submit');
    var nameEl = document.getElementById('f-name');
    var emailEl = document.getElementById('f-email');
    var msgEl = document.getElementById('f-msg');
    var feedbackEl = document.getElementById('contact-form-feedback');

    if (!window.SessionRateLimiter) return;
    var check = window.SessionRateLimiter.check('contact_inquiry', 3, 45);

    if (!check.allowed && check.reason === 'session_limit') {
      if (contactCooldownInterval) {
        clearInterval(contactCooldownInterval);
        contactCooldownInterval = null;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-disabled');
        submitBtn.setAttribute('aria-disabled', 'true');
        submitBtn.innerHTML = '<span>INQUIRY SUBMITTED</span>';
      }
      if (nameEl) nameEl.disabled = true;
      if (emailEl) emailEl.disabled = true;
      if (msgEl) msgEl.disabled = true;
      if (feedbackEl) {
        feedbackEl.className = 'form-feedback-msg success';
        feedbackEl.textContent = 'Thank you! Your message has been sent. To follow up directly, feel free to email Sanjai at sanjairam1179@gmail.com.';
        feedbackEl.style.display = 'block';
      }
    } else if (!check.allowed && check.reason === 'cooldown') {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-disabled');
        submitBtn.setAttribute('aria-disabled', 'true');
        submitBtn.innerHTML = '<span>PLEASE WAIT...</span>';
      }
      // Re-enable smoothly when cooldown window ends
      if (!contactCooldownInterval) {
        contactCooldownInterval = setInterval(function() {
          var recheck = window.SessionRateLimiter.check('contact_inquiry', 3, 45);
          if (recheck.allowed || recheck.reason !== 'cooldown') {
            clearInterval(contactCooldownInterval);
            contactCooldownInterval = null;
            window.updateContactRateLimitUI();
          }
        }, 1000);
      }
    } else {
      if (contactCooldownInterval) {
        clearInterval(contactCooldownInterval);
        contactCooldownInterval = null;
      }
      if (submitBtn && !isContactSubmitting) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-disabled');
        submitBtn.removeAttribute('aria-disabled');
        submitBtn.innerHTML = '<span>SEND INQUIRY VIA EMAIL</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
      }
      if (nameEl) nameEl.disabled = false;
      if (emailEl) emailEl.disabled = false;
      if (msgEl) msgEl.disabled = false;
    }
  };

  // Contact Form Submit with Validation & Anti-Spam Protection
  window.handleContactSubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (isContactSubmitting) {
      window.showToast('Inquiry dispatch already in progress. Please wait a moment...');
      return false;
    }

    // 1. Session Rate Limiter Check (Silent Protection)
    if (window.SessionRateLimiter) {
      var limitCheck = window.SessionRateLimiter.check('contact_inquiry', 3, 45);
      if (!limitCheck.allowed) {
        window.updateContactRateLimitUI();
        var errorMsg = limitCheck.reason === 'session_limit'
          ? 'Thank you! Your inquiry has been received. Please feel free to email sanjairam1179@gmail.com directly.'
          : 'Please wait a moment before sending another message.';
        window.showToast(errorMsg);
        playClickAudio(260);
        return false;
      }
    }

    var nameEl = document.getElementById('f-name');
    var emailEl = document.getElementById('f-email');
    var msgEl = document.getElementById('f-msg');
    var feedbackEl = document.getElementById('contact-form-feedback');
    var submitBtn = document.getElementById('btn-contact-submit');

    // Reset validation states
    [nameEl, emailEl, msgEl].forEach(function(el) {
      if (el) {
        el.classList.remove('input-error');
        el.removeAttribute('aria-invalid');
      }
    });
    if (feedbackEl) {
      feedbackEl.style.display = 'none';
      feedbackEl.className = 'form-feedback-msg';
      feedbackEl.textContent = '';
    }

    var name = (nameEl ? nameEl.value : '').trim();
    var email = (emailEl ? emailEl.value : '').trim();
    var msg = (msgEl ? msgEl.value : '').trim();

    function showFormError(el, message) {
      if (el) {
        el.classList.add('input-error');
        el.setAttribute('aria-invalid', 'true');
        el.focus();
      }
      if (feedbackEl) {
        feedbackEl.className = 'form-feedback-msg error';
        feedbackEl.textContent = message;
        feedbackEl.style.display = 'block';
      }
      window.showToast(message);
      playClickAudio(260);
    }

    // Validation checks
    if (!name || name.length < 2) {
      showFormError(nameEl, 'Please enter your name (at least 2 characters).');
      return false;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showFormError(emailEl, 'Please enter a valid email address (e.g. recruiter@company.com).');
      return false;
    }
    if (!msg || msg.length < 5) {
      showFormError(msgEl, 'Please enter inquiry message details (at least 5 characters).');
      return false;
    }

    // Rate-limiting lock & Visual Feedback
    isContactSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn-disabled');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = '<span>OPENING EMAIL CLIENT...</span>';
    }

    if (feedbackEl) {
      feedbackEl.className = 'form-feedback-msg success';
      feedbackEl.textContent = 'Valid inquiry! Launching your default email client addressed to sanjairam1179@gmail.com...';
      feedbackEl.style.display = 'block';
    }
    window.showToast('Preparing email dispatch to sanjairam1179@gmail.com...');
    playClickAudio(680);

    var subject = encodeURIComponent('[Data Analyst Inquiry] From ' + name);
    var body = encodeURIComponent('Hello Sanjai,\n\n' + msg + '\n\n---\nFrom: ' + name + '\nEmail: ' + email);

    setTimeout(function() {
      if (window.SessionRateLimiter) {
        window.SessionRateLimiter.record('contact_inquiry');
      }
      try {
        var mailtoLink = document.createElement('a');
        mailtoLink.href = 'mailto:sanjairam1179@gmail.com?subject=' + subject + '&body=' + body;
        mailtoLink.style.display = 'none';
        document.body.appendChild(mailtoLink);
        mailtoLink.click();
        setTimeout(function() {
          if (mailtoLink.parentNode) mailtoLink.parentNode.removeChild(mailtoLink);
        }, 150);
      } catch (e) {
        window.location.href = 'mailto:sanjairam1179@gmail.com?subject=' + subject + '&body=' + body;
      }
      
      // Update UI to show remaining limit and activate cooldown
      isContactSubmitting = false;
      window.updateContactRateLimitUI();
    }, 400);

    return false;
  };

  // Dedicated Print ATS Resume with session rate limiting
  window.printResume = function() {
    if (window.SessionRateLimiter) {
      var check = window.SessionRateLimiter.check('print_resume', 10, 4);
      if (!check.allowed) {
        window.showToast('Preparing printable ATS Resume...');
        return;
      }
      window.SessionRateLimiter.record('print_resume');
    }
    window.showToast('Preparing printable ATS Resume...');
    setTimeout(function() {
      try {
        window.print();
      } catch (err) {
        console.error('Print trigger failed:', err);
      }
    }, 150);
  };

  
  // ==========================================================================
  // REUSABLE TOP NAVIGATION SLIDING INDICATOR COMPONENT (60 FPS GPU Transforms)
  // ==========================================================================
  window.TopNavSlider = (function() {
    var navList = null;
    var indicator = null;
    var activeAnchor = null;
    var isInitialized = false;

    function getElements() {
      navList = document.getElementById('nav-link-list');
      if (!navList) return false;
      indicator = document.getElementById('nav-indicator-pill');
      if (!indicator) {
        indicator = document.createElement('li');
        indicator.id = 'nav-indicator-pill';
        indicator.className = 'nav-indicator-pill';
        indicator.setAttribute('aria-hidden', 'true');
        navList.prepend(indicator);
      }
      return true;
    }

    function init() {
      if (!getElements()) return;
      if (isInitialized) return;
      isInitialized = true;

      // Bind click on anchors
      var anchors = navList.querySelectorAll('.nav-anchor');
      anchors.forEach(function(anchor) {
        anchor.addEventListener('click', function() {
          updateIndicator(anchor, true);
        });
      });

      // Handle horizontal swipe and touch dragging on mobile
      setupTouchSwipe(navList);

      // Position indicator on initial active item immediately without animation
      var initialActive = navList.querySelector('.nav-anchor.active') || anchors[0];
      if (initialActive) {
        updateIndicator(initialActive, false);
      }

      // Automatically recalculate on window resize, zoom, orientation, or webfont load
      window.addEventListener('resize', debounce(function() {
        if (activeAnchor) updateIndicator(activeAnchor, false);
      }, 70), { passive: true });

      window.addEventListener('orientationchange', function() {
        setTimeout(function() {
          if (activeAnchor) updateIndicator(activeAnchor, false);
        }, 120);
      });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          if (activeAnchor) updateIndicator(activeAnchor, false);
        });
      }
    }

    function debounce(func, wait) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() { func.apply(context, args); }, wait);
      };
    }

    function updateIndicator(targetAnchor, animate) {
      if (!getElements() || !targetAnchor) return;
      activeAnchor = targetAnchor;

      // Update text classes and accessibility simultaneously
      navList.querySelectorAll('.nav-anchor').forEach(function(a) {
        var isActive = (a === targetAnchor);
        a.classList.toggle('active', isActive);
        if (isActive) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      });

      // Fast offset-based calculation (zero synchronous getBoundingClientRect layout reflow)
      var targetLeft = targetAnchor.offsetLeft;
      var targetTop = targetAnchor.offsetTop;
      var targetWidth = targetAnchor.offsetWidth;
      var targetHeight = targetAnchor.offsetHeight;

      // Fallback if offset is unrendered or zero
      if (targetWidth === 0) {
        var navRect = navList.getBoundingClientRect();
        var targetRect = targetAnchor.getBoundingClientRect();
        targetLeft = targetRect.left - navRect.left + navList.scrollLeft;
        targetTop = targetRect.top - navRect.top + navList.scrollTop;
        targetWidth = targetRect.width;
        targetHeight = targetRect.height;
      }

      // Respect prefers-reduced-motion or mobile format
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!animate || prefersReduced || window.innerWidth <= 900) {
        indicator.style.transition = 'none';
      } else {
        indicator.style.transition = 'transform 130ms cubic-bezier(0.16, 1, 0.3, 1), width 130ms cubic-bezier(0.16, 1, 0.3, 1), height 130ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms ease';
      }

      // Apply 120 FPS GPU-accelerated transform
      indicator.style.transform = 'translate3d(' + targetLeft + 'px, ' + targetTop + 'px, 0)';
      indicator.style.width = targetWidth + 'px';
      indicator.style.height = targetHeight + 'px';
      indicator.style.opacity = '1';

      // Keep active item in view on horizontally scrollable screens
      if (navList.scrollWidth > navList.clientWidth) {
        var scrollTarget = targetLeft - (navList.clientWidth / 2) + (targetWidth / 2);
        navList.scrollLeft = Math.max(0, scrollTarget);
      }
    }

    function setActiveScreen(screenId, animate) {
      if (typeof animate === 'undefined') animate = true;
      if (!getElements()) return;
      var target = document.getElementById('nav-link-' + screenId);
      if (target) {
        updateIndicator(target, animate);
      }
    }

    function setupTouchSwipe(list) {
      // Browser native overflow-x: auto handles touch scrolling at 120 FPS without JS churn
    }

    return {
      init: init,
      setActiveScreen: setActiveScreen,
      updateIndicator: updateIndicator,
      recalculate: function() {
        if (activeAnchor) updateIndicator(activeAnchor, false);
      }
    };
  })();

  // ==========================================================================
  // BUTTER-SMOOTH LIGHT GREY FROSTED SECTION TRANSITION ENGINE (<SectionTransition />)
  // Optimized for 60/120 FPS Mobile Stability & Refined Light Grey Aesthetic
  // ==========================================================================
  window.SectionTransition = {
    trigger: function(fromId, toId, onApex, onComplete) {
      if (typeof onApex === 'function') onApex();
      if (typeof onComplete === 'function') onComplete();
    },
    cancel: function() {},
    isTransitioning: function() { return false; }
  };

  // ==========================================================================
  // MULTI-PAGE SCREEN ROUTER (120 FPS Butter-Smooth Hardware Accelerated)
  // ==========================================================================
  var screenOrder = ['overview', 'dashboard', 'projects', 'skills', 'experience', 'resume', 'contact', 'privacy', '404'];
  var currentScreen = 'overview';
  var isNavigating = false;

  window.navigateToScreen = function(screenId, pushHash, playSound, isSwipe, isInitial) {
    if (typeof window.__verifyAttributionIntegrity === 'function' && !window.__verifyAttributionIntegrity()) {
      return;
    }
    if (typeof pushHash === 'undefined') pushHash = true;
    if (typeof playSound === 'undefined') playSound = true;
    if (typeof isSwipe === 'undefined') isSwipe = false;
    if (typeof isInitial === 'undefined') isInitial = false;
    if (isNavigating && screenId === currentScreen) return;
    if (screenId === currentScreen && !isInitial) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    var targetScreen = document.getElementById('screen-' + screenId);
    if (!targetScreen) {
      targetScreen = document.getElementById('screen-404');
      screenId = '404';
    }

    var oldScreen = document.getElementById('screen-' + currentScreen);
    var prevIndex = screenOrder.indexOf(currentScreen);
    var nextIndex = screenOrder.indexOf(screenId);
    var isForward = nextIndex >= prevIndex;
    var prevScreenId = currentScreen;

    // Play tactile navigation audio ONLY if enabled
    if (playSound && !isInitial && typeof SoundFX !== 'undefined' && SoundFX.isEnabled && SoundFX.isEnabled()) {
      if (Date.now() - SoundFX.getLastPlayTime() > 450) {
        SoundFX.nav(isForward);
      }
    }

    currentScreen = screenId;
    isNavigating = true;

    // Update Top Navigation Bar sliding indicator & active state
    if (window.TopNavSlider && typeof window.TopNavSlider.setActiveScreen === 'function') {
      window.TopNavSlider.setActiveScreen(screenId, !isInitial);
    } else {
      document.querySelectorAll('.nav-link-list .nav-anchor').forEach(function(link) {
        link.classList.remove('active');
      });
      var topLink = document.getElementById('nav-link-' + screenId);
      if (topLink) topLink.classList.add('active');
    }

    // Update Mobile Dock active state
    document.querySelectorAll('.bottom-nav-dock .dock-btn').forEach(function(btn) {
      btn.classList.remove('active');
    });
    var dockBtn = document.getElementById('dock-btn-' + screenId);
    if (dockBtn) dockBtn.classList.add('active');

    // Update Mobile Dropdown active state & auto-close menu
    document.querySelectorAll('.mobile-dropdown-anchor').forEach(function(anchor) {
      anchor.classList.toggle('active', anchor.getAttribute('href') === '#' + screenId);
    });
    if (typeof window.toggleMobileMenu === 'function') {
      window.toggleMobileMenu(false);
    }

    // Update URL hash without jumping
    if (pushHash && history.pushState) {
      history.pushState(null, null, '#' + screenId);
    }

    // Dismiss swipe hints
    if (!isInitial) {
      var swipeHint = document.getElementById('mobile-swipe-hint');
      if (swipeHint && !swipeHint.classList.contains('hint-dismissed')) {
        setTimeout(function() { swipeHint.classList.add('hint-dismissed'); }, 3000);
      }
      var laptopHint = document.getElementById('laptop-swipe-hint');
      if (laptopHint && !laptopHint.classList.contains('hint-dismissed')) {
        setTimeout(function() { laptopHint.classList.add('hint-dismissed'); }, 3000);
      }
    }

    // Direct, Instant, 120 FPS Screen Switch - Zero Canvas, Zero Particle Overhead
    document.querySelectorAll('.screen-view').forEach(function(s) {
      s.classList.remove('active', 'screen-entering-smooth', 'generative-reveal', 'screen-leaving-apple', 'screen-leaving', 'screen-entering', 'mobile-swipe-out-left', 'mobile-swipe-out-right', 'mobile-swipe-in-right', 'mobile-swipe-in-left');
      s.style.top = '';
    });

    targetScreen.classList.add('active');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    var isMobile = window.innerWidth <= 900;
    if (!isInitial && !isMobile) {
      targetScreen.classList.add('screen-entering-smooth');
      setTimeout(function() {
        if (targetScreen) targetScreen.classList.remove('screen-entering-smooth');
        isNavigating = false;
      }, 50);
    } else {
      isNavigating = false;
    }

    if (screenId === 'dashboard' && typeof renderActiveMode === 'function') {
      setTimeout(renderActiveMode, 30);
    }
  };

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('screen-' + hash)) {
      window.navigateToScreen(hash, false, true);
    } else {
      window.navigateToScreen('overview', false, true);
    }
  });

  // Initialize Top Navigation Slider & check initial hash on page load
  function checkInitialHash() {
    if (window.TopNavSlider && typeof window.TopNavSlider.init === 'function') {
      window.TopNavSlider.init();
    }
    var initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById('screen-' + initialHash)) {
      // Do NOT play audio or run generative transition during initial page load
      window.navigateToScreen(initialHash, false, false, false, true);
    } else {
      if (window.TopNavSlider && typeof window.TopNavSlider.setActiveScreen === 'function') {
        window.TopNavSlider.setActiveScreen('overview', false);
      }
    }
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', checkInitialHash);
  } else {
    checkInitialHash();
  }

  // Copy plain text resume helper with session rate limiting
  window.copyResumeText = function() {
    if (window.SessionRateLimiter) {
      var check = window.SessionRateLimiter.check('copy_resume', 20, 2.5);
      if (!check.allowed) {
        window.showToast('Resume already copied to clipboard!');
        return;
      }
      window.SessionRateLimiter.record('copy_resume');
    }
    var resumeEl = document.querySelector('#screen-resume .resume-sheet-doc');
    if (resumeEl) {
      var text = resumeEl.innerText;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          if (typeof playSuccessAudio === 'function') playSuccessAudio();
          if (typeof window.showToast === 'function') window.showToast('Resume copied to clipboard!');
        });
      }
    }
  };


  
  // ==========================================================================
  // AMBIENT GLOW CURSOR SHADE (Cleanly Disabled for 120 FPS Zero Jank)
  (function() {
    var glow = document.getElementById('cursor-ambient-glow');
    if (glow) glow.style.display = 'none';
  })();

  // REFINED TOUCH & BOTTOM SWIPE ENGINE (Zero click interference)
  // ==========================================================================
  var swipeScreens = ['overview', 'dashboard', 'projects', 'skills', 'experience', 'resume', 'contact'];
  var tStartX = 0;
  var tStartY = 0;
  var tStartTime = 0;
  var touchStartedOnDock = false;

  document.addEventListener('touchstart', function(e) {
    if (e.touches && e.touches.length === 1) {
      tStartX = e.touches[0].clientX;
      tStartY = e.touches[0].clientY;
      tStartTime = Date.now();
      touchStartedOnDock = !!(e.target && typeof e.target.closest === 'function' && e.target.closest('.bottom-nav-dock'));
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    var tEndX = e.changedTouches[0].clientX;
    var tEndY = e.changedTouches[0].clientY;
    var dX = tEndX - tStartX;
    var dY = tEndY - tStartY;
    var dTime = Date.now() - tStartTime;

    // Ignore if modal dialog is open or user is typing in inputs
    if (document.querySelector('.modal-backdrop.active') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    var curIdx = swipeScreens.indexOf(currentScreen);
    if (curIdx === -1) curIdx = 0;

    // CASE 1: Swiping explicitly on the bottom navigation dock
    if (touchStartedOnDock) {
      // Must be an intentional horizontal swipe (at least 38px horizontal distance, predominantly horizontal)
      if (Math.abs(dX) > 38 && Math.abs(dX) > Math.abs(dY) * 1.5 && dTime < 550) {
        // Temporarily disable dock pointer-events so button release doesn't fire an accidental tap
        var dockEl = document.querySelector('.bottom-nav-dock');
        if (dockEl) {
          dockEl.style.pointerEvents = 'none';
          setTimeout(function() {
            dockEl.style.pointerEvents = '';
          }, 140);
        }

        if (dX < 0 && curIdx < swipeScreens.length - 1) {
          // Swipe Left -> Next section with forward slide + scale
          window.navigateToScreen(swipeScreens[curIdx + 1], true, true, true);
        } else if (dX > 0 && curIdx > 0) {
          // Swipe Right -> Previous section with reverse slide + scale
          window.navigateToScreen(swipeScreens[curIdx - 1], true, true, true);
        }
      }
      // If movement is < 20px, it is a normal tap. Do nothing and let the button's native onclick run smoothly!
      return;
    }

    // CASE 2: Swiping on the main screen content
    // Protect vertical scrolling: if user moved vertically more than 25px, or vertical movement is greater, DO NOT SWIPE!
    if (Math.abs(dY) > 25 || Math.abs(dY) >= Math.abs(dX)) {
      return;
    }

    // Protect interactive elements on screen (sliders, buttons, links, tables, SQL workbench)
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, a, input, textarea, select, .schema-tables-grid, .star-schema-card, .sql-workbench-strip, .sql-console-output, .sql-preset-btn, .dax-code-block, .sim-slider-row')) {
      return;
    }

    // Deliberate horizontal page swipe: requires at least 65px horizontal swipe within 450ms with minimal vertical drift
    if (Math.abs(dX) > 65 && Math.abs(dY) < 35 && dTime < 450) {
      if (dX < 0 && curIdx < swipeScreens.length - 1) {
        window.navigateToScreen(swipeScreens[curIdx + 1], true, true, true);
      } else if (dX > 0 && curIdx > 0) {
        window.navigateToScreen(swipeScreens[curIdx - 1], true, true, true);
      }
    }
  }, { passive: true });

  // ==========================================================================
  // LAPTOP GESTURES: Trackpad Two-Finger Swipe & Mouse Click-and-Drag
  // ==========================================================================

  // 1. Laptop Trackpad Two-Finger Horizontal Swipe
  var isWheelSwiping = false;
  var wheelAccumulatorX = 0;
  var wheelResetTimer = null;

  window.addEventListener('wheel', function(e) {
    if (document.querySelector('.modal-backdrop.active') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }
    // Protect interactive code editors, tables, consoles, and sliders from wheel swipe navigation
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('.sql-console-output, .sql-workbench-strip, .schema-tables-grid, .dax-code-block, .sim-slider-row')) {
      return;
    }
    // Only capture distinct horizontal trackpad swipes (minimal vertical drift)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 12) {
      wheelAccumulatorX += e.deltaX;
      clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(function() {
        wheelAccumulatorX = 0;
        isWheelSwiping = false;
      }, 240);

      if (!isWheelSwiping && Math.abs(wheelAccumulatorX) > 65) {
        isWheelSwiping = true;
        var curIdx = swipeScreens.indexOf(currentScreen);
        if (curIdx === -1) curIdx = 0;

        if (wheelAccumulatorX > 0 && curIdx < swipeScreens.length - 1) {
          // Trackpad swipe right (deltaX positive) -> Next screen
          window.navigateToScreen(swipeScreens[curIdx + 1], true, true, true);
        } else if (wheelAccumulatorX < 0 && curIdx > 0) {
          // Trackpad swipe left (deltaX negative) -> Previous screen
          window.navigateToScreen(swipeScreens[curIdx - 1], true, true, true);
        }
      }
    }
  }, { passive: true });

  // 2. Laptop Mouse Click-and-Drag Horizontal Swipe
  var mStartX = 0, mStartY = 0, mStartTime = 0, isMouseDown = false;

  document.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return; // Left mouse click only
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, a, input, textarea, select, .modal-dialog-box, .schema-tables-grid, .code-copy-btn, .range-slider-input, .sql-workbench-strip, .sql-console-output, .sql-preset-btn')) {
      return;
    }
    isMouseDown = true;
    mStartX = e.clientX;
    mStartY = e.clientY;
    mStartTime = Date.now();
  });

  document.addEventListener('mouseup', function(e) {
    if (!isMouseDown) return;
    isMouseDown = false;
    var dX = e.clientX - mStartX;
    var dY = e.clientY - mStartY;
    var dTime = Date.now() - mStartTime;

    if (document.querySelector('.modal-backdrop.active') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    // Deliberate horizontal drag: at least 70px within 550ms with horizontal dominance
    if (Math.abs(dX) > 70 && Math.abs(dX) > Math.abs(dY) * 1.8 && dTime < 550) {
      var curIdx = swipeScreens.indexOf(currentScreen);
      if (curIdx === -1) curIdx = 0;

      if (dX < 0 && curIdx < swipeScreens.length - 1) {
        // Drag Left -> Next section
        window.navigateToScreen(swipeScreens[curIdx + 1], true, true, true);
      } else if (dX > 0 && curIdx > 0) {
        // Drag Right -> Previous section
        window.navigateToScreen(swipeScreens[curIdx - 1], true, true, true);
      }
    }
  });

  // 3. Laptop Keyboard Arrow Navigation (Left / Right)
  document.addEventListener('keydown', function(e) {
    if (document.querySelector('.modal-backdrop.active') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }
    var curIdx = swipeScreens.indexOf(currentScreen);
    if (curIdx === -1) curIdx = 0;
    if (e.key === 'ArrowRight' && curIdx < swipeScreens.length - 1) {
      window.navigateToScreen(swipeScreens[curIdx + 1], true, true, true);
    } else if (e.key === 'ArrowLeft' && curIdx > 0) {
      window.navigateToScreen(swipeScreens[curIdx - 1], true, true, true);
    }
  });

  // Update Year
  var yEl = document.getElementById('current-year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  // ==========================================================================
  // APPLICATION ATTRIBUTION & SECURITY INTEGRITY VERIFICATION SYSTEM
  // ==========================================================================
  var APP_INTEGRITY_MANIFEST = Object.freeze({
    CANONICAL_ATTRIBUTION: 'Powered by Sarvesh Padmanabhan',
    CANONICAL_HASH_FNV1A: 0xe1e06657,
    CANONICAL_HASH_DJB2: 0x9b8166fb,
    CANONICAL_AUTHOR: 'Sarvesh Padmanabhan',
    CANONICAL_LENGTH: 30,
    FAULT_MESSAGE: 'Application integrity verification failed. Required attribution has been modified or removed.'
  });

  function __computeFNV1a(str) {
    var hash = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function __computeDJB2(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 33) ^ str.charCodeAt(i)) >>> 0;
    }
    return hash >>> 0;
  }

  var isIntegrityCompromised = false;
  var integrityObserver = null;
  var integrityInterval = null;

  function triggerIntegrityLockdown() {
    if (isIntegrityCompromised) return;
    isIntegrityCompromised = true;

    if (integrityObserver) {
      try { integrityObserver.disconnect(); } catch (e) {}
      integrityObserver = null;
    }
    if (integrityInterval) {
      clearInterval(integrityInterval);
      integrityInterval = null;
    }

    // Completely conceal application viewports
    var viewport = document.querySelector('.screens-viewport');
    if (viewport) viewport.style.setProperty('display', 'none', 'important');
    var header = document.querySelector('.site-header');
    if (header) header.style.setProperty('display', 'none', 'important');

    // Immutable navigation lockout
    try {
      Object.defineProperty(window, 'navigateToScreen', {
        value: function() { return false; },
        writable: false,
        configurable: false
      });
    } catch (e) {
      window.navigateToScreen = function() { return false; };
    }

    // Silence audio engine in memory (without corrupting persistent localStorage)
    if (typeof SoundFX !== 'undefined') {
      if (SoundFX.silence) {
        try { SoundFX.silence(); } catch (e) {}
      } else if (SoundFX.mute) {
        try { SoundFX.mute(); } catch (e) {}
      }
    }

    // Render Fail-Closed Secure Lockdown Shield
    var shield = document.createElement('div');
    shield.id = 'app-integrity-shield';
    shield.setAttribute('role', 'alert');
    shield.setAttribute('aria-live', 'assertive');
    shield.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;width:100vw !important;height:100vh !important;background:#0A0D14 !important;color:#F8FAFC !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;justify-content:center !important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif !important;text-align:center !important;padding:24px !important;margin:0 !important;box-sizing:border-box !important;';

    var box = document.createElement('div');
    box.style.cssText = 'max-width:540px !important;width:100% !important;background:#161C26 !important;border:1px solid #EF4444 !important;border-radius:18px !important;padding:36px 28px !important;box-shadow:0 24px 60px rgba(0,0,0,0.6) !important;box-sizing:border-box !important;';

    var icon = document.createElement('div');
    icon.style.cssText = 'width:52px !important;height:52px !important;background:rgba(239,68,68,0.15) !important;border:1px solid rgba(239,68,68,0.3) !important;color:#EF4444 !important;border-radius:14px !important;display:flex !important;align-items:center !important;justify-content:center !important;margin:0 auto 18px !important;font-size:26px !important;font-weight:800 !important;font-family:monospace !important;';
    icon.textContent = '!';

    var title = document.createElement('h2');
    title.style.cssText = 'font-size:19px !important;font-weight:800 !important;margin:0 0 12px 0 !important;color:#F8FAFC !important;letter-spacing:-0.02em !important;';
    title.textContent = 'Attribution Integrity Fault';

    var desc = document.createElement('p');
    desc.style.cssText = 'font-size:14px !important;line-height:1.6 !important;color:#94A3B8 !important;margin:0 !important;';
    desc.textContent = APP_INTEGRITY_MANIFEST.FAULT_MESSAGE;

    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(desc);
    shield.appendChild(box);

    if (document.body) {
      document.body.appendChild(shield);
    } else if (document.documentElement) {
      document.documentElement.appendChild(shield);
    }
  }

  function verifyAttributionIntegrity() {
    if (isIntegrityCompromised) return false;

    // Media Print Safe Guard: Print styles deliberately hide site-footer
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) {
      return true;
    }

    var container = document.getElementById('attribution-container');
    var el = document.getElementById('attribution-content');

    if (!container || !el) {
      triggerIntegrityLockdown();
      return false;
    }

    if (!document.contains(container) || !document.contains(el) || !container.contains(el)) {
      triggerIntegrityLockdown();
      return false;
    }

    var text = (el.textContent || el.innerText || '').trim();

    // 1. Length validation
    if (text.length !== APP_INTEGRITY_MANIFEST.CANONICAL_LENGTH) {
      triggerIntegrityLockdown();
      return false;
    }

    // 2. Exact text validation
    if (text !== APP_INTEGRITY_MANIFEST.CANONICAL_ATTRIBUTION) {
      triggerIntegrityLockdown();
      return false;
    }

    // 3. FNV-1a Cryptographic Hash validation
    var hashFNV = __computeFNV1a(text);
    if (hashFNV !== APP_INTEGRITY_MANIFEST.CANONICAL_HASH_FNV1A) {
      triggerIntegrityLockdown();
      return false;
    }

    // 4. DJB2 Cryptographic Hash validation
    var hashDJB = __computeDJB2(text);
    if (hashDJB !== APP_INTEGRITY_MANIFEST.CANONICAL_HASH_DJB2) {
      triggerIntegrityLockdown();
      return false;
    }

    // 5. Author substring verification
    if (text.indexOf(APP_INTEGRITY_MANIFEST.CANONICAL_AUTHOR) === -1) {
      triggerIntegrityLockdown();
      return false;
    }

    // 6. Visual style & visibility verification
    var style = window.getComputedStyle(el);
    var parentStyle = window.getComputedStyle(container);

    if (style.display === 'none' || parentStyle.display === 'none' ||
        style.visibility === 'hidden' || parentStyle.visibility === 'hidden' ||
        parseFloat(style.opacity) < 0.05 || parseFloat(parentStyle.opacity) < 0.05 ||
        parseFloat(style.fontSize) < 5) {
      triggerIntegrityLockdown();
      return false;
    }

    return true;
  }

  try {
    Object.defineProperty(window, '__verifyAttributionIntegrity', {
      value: verifyAttributionIntegrity,
      writable: false,
      configurable: false
    });
  } catch (e) {
    window.__verifyAttributionIntegrity = verifyAttributionIntegrity;
  }

  function initAttributionIntegritySystem() {
    if (!verifyAttributionIntegrity()) return;

    var container = document.getElementById('attribution-container');
    var el = document.getElementById('attribution-content');

    if (container && window.MutationObserver) {
      integrityObserver = new MutationObserver(function() {
        verifyAttributionIntegrity();
      });

      integrityObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });

      if (el) {
        integrityObserver.observe(el, {
          childList: true,
          characterData: true,
          attributes: true
        });
      }

      if (container.parentElement) {
        integrityObserver.observe(container.parentElement, {
          childList: true,
          subtree: false
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAttributionIntegritySystem);
  } else {
    initAttributionIntegritySystem();
  }
  window.addEventListener('load', verifyAttributionIntegrity);

  // Auto-dismiss swipe hints after 25s idle
  setTimeout(function() {
    var swipeHint = document.getElementById('mobile-swipe-hint');
    if (swipeHint) swipeHint.classList.add('hint-dismissed');
    var laptopHint = document.getElementById('laptop-swipe-hint');
    if (laptopHint) laptopHint.classList.add('hint-dismissed');
  }, 25000);

})();