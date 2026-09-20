(function() {
  'use strict';

  // State
  var soundEnabled = true;
  var audioCtx = null;
  var activeVisualMode = 'bars';

  // Synthesize pleasant micro-haptic click audio
  
  // ==================== HIGH-END SATISFYING TACTILE SOUND SYNTHESIZER ====================
  var SoundFX = (function() {
    var ctx = null;
    var enabled = true;

    function getAudioCtx() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    // 1. Satisfying Tactile Click ("Acoustic Thock / Pop")
    function playClick() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        
        // Warm round body
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.045);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.045);

        // High crisp tactile edge
        var clickOsc = c.createOscillator();
        var clickGain = c.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1400, t);
        clickOsc.frequency.exponentialRampToValueAtTime(320, t + 0.02);
        clickGain.gain.setValueAtTime(0.04, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        clickOsc.connect(clickGain);
        clickGain.connect(c.destination);
        clickOsc.start(t);
        clickOsc.stop(t + 0.02);
      } catch(e) {}
    }

    // 2. Tab / Filter Switch ("Satisfying Plop")
    function playTab() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(460, t);
        osc.frequency.exponentialRampToValueAtTime(920, t + 0.055);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.055);
      } catch(e) {}
    }

    // 3. Card 3D Flip ("Smooth Swish & Tap")
    function playFlip() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(680, t + 0.07);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.07);
      } catch(e) {}
    }

    // 4. Modal Open ("Harmonic Uplifting Shimmer")
    function playModalOpen() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        [587.33, 880, 1174.66].forEach(function(freq, i) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.038);
          gain.gain.setValueAtTime(0.045, t + i * 0.038);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.038 + 0.2);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(t + i * 0.038);
          osc.stop(t + i * 0.038 + 0.2);
        });
      } catch(e) {}
    }

    // 5. Success / Copy Confirmation ("Affirming Major Chord")
    function playSuccess() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach(function(freq, i) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.045);
          gain.gain.setValueAtTime(0.048, t + i * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.24);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(t + i * 0.045);
          osc.stop(t + i * 0.045 + 0.24);
        });
      } catch(e) {}
    }

    // 6. Interactive Slider Tick
    function playTick() {
      if (!enabled) return;
      try {
        var c = getAudioCtx();
        var t = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.025, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.015);
      } catch(e) {}
    }

    return {
      click: playClick,
      tab: playTab,
      flip: playFlip,
      modalOpen: playModalOpen,
      success: playSuccess,
      tick: playTick,
      toggle: function() {
        enabled = !enabled;
        return enabled;
      },
      isEnabled: function() { return enabled; }
    };
  })();

  // Tactile audio bridge helpers
  window.playClickAudio = function(freq) {
    if (typeof SoundFX !== 'undefined' && SoundFX.isEnabled && SoundFX.isEnabled()) {
      SoundFX.click();
    }
  };
  window.playSuccessAudio = function() {
    if (typeof SoundFX !== 'undefined' && SoundFX.isEnabled && SoundFX.isEnabled()) {
      SoundFX.success();
    }
  };

  // Global Click Listener for Satisfying Audio Feedback
  document.addEventListener('click', function(e) {
    var el = e.target.closest('button, a, .flip-card-unit, .schema-node-card, .btn, .interactive-tag');
    if (el) {
      if (el.classList.contains('flip-card-unit')) {
        SoundFX.flip();
      } else if (el.classList.contains('filter-pill') || el.classList.contains('tab-btn')) {
        SoundFX.tab();
      } else {
        SoundFX.click();
      }
    }
  });

  // Slider ticks
  document.addEventListener('input', function(e) {
    if (e.target && e.target.type === 'range') {
      SoundFX.tick();
    }
  });

  // ==================== INTRO SPLASH CONTROLLER ====================
  window.enterPortfolioDirectly = function() {
    SoundFX.modalOpen();
    var gate = document.getElementById('intro-splash-gate');
    if (gate) gate.classList.add('dismissed');
  };

  window.replayIntro = function() {
    var gate = document.getElementById('intro-splash-gate');
    if (!gate) return;
    gate.classList.remove('dismissed');
    runIntroSequence();
  };

  function runIntroSequence() {
    var fill = document.getElementById('intro-progress-fill');
    var label = document.getElementById('intro-status-label');
    var pct = document.getElementById('intro-status-pct');
    if (!fill) return;

    var steps = [
      { p: 25, msg: 'Loading Power BI & DAX Models...' },
      { p: 58, msg: 'Preparing Sales Data Model...' },
      { p: 86, msg: 'Verifying SQL Query Console...' },
      { p: 100, msg: 'All Systems Ready. Welcome!' }
    ];

    var idx = 0;
    var timer = setInterval(function() {
      if (idx >= steps.length) {
        clearInterval(timer);
        setTimeout(function() {
          var gate = document.getElementById('intro-splash-gate');
          if (gate && !gate.classList.contains('dismissed')) {
            window.enterPortfolioDirectly();
          }
        }, 650);
        return;
      }
      var s = steps[idx];
      fill.style.width = s.p + '%';
      if (pct) pct.textContent = s.p + '%';
      if (label) label.textContent = s.msg;
      SoundFX.tick();
      idx++;
    }, 320);
  }

  // Run intro on initial load
  setTimeout(runIntroSequence, 150);


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

  // Copy helper
  window.copyContact = function(content, successMsg) {
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
  if (audioBtn) {
    audioBtn.addEventListener('click', function() {
      if (typeof SoundFX !== 'undefined' && SoundFX.toggle) {
        soundEnabled = SoundFX.toggle();
      } else {
        soundEnabled = !soundEnabled;
      }
      audioBtn.style.opacity = soundEnabled ? '1' : '0.4';
      if (soundEnabled) {
        window.playClickAudio(750);
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
      playClickAudio(680);
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
      playClickAudio(340);
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
    if (e.key.toLowerCase() === 'm' && !e.target.matches('input, textarea')) {
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

  // Dynamic Specular Cursor Spotlight across cards
  document.querySelectorAll('.spotlight-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });

  // 3D Tilt on Hero Card on mouse move
  var heroCard = document.getElementById('hero-3d-card');
  if (heroCard && window.innerWidth > 1024) {
    heroCard.addEventListener('mousemove', function(e) {
      var rect = heroCard.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var dx = (x - cx) / cx;
      var dy = (y - cy) / cy;
      heroCard.style.transform = 'perspective(1000px) rotateY(' + (dx * 7) + 'deg) rotateX(' + (-dy * 7) + 'deg)';
    });
    heroCard.addEventListener('mouseleave', function() {
      heroCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }

  // 3D Flip Card Toggle
  window.toggleFlip = function(cardEl) {
    cardEl.classList.toggle('flipped');
    playClickAudio(480);
  };

  // Filter Skills
  window.filterSkills = function(category) {
    var btns = document.querySelectorAll('.skills-tab-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    event.currentTarget.classList.add('active');

    var cards = document.querySelectorAll('.flip-card-unit');
    cards.forEach(function(card) {
      var cat = card.getAttribute('data-cat');
      if (category === 'all' || cat === category) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
    playClickAudio(500);
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

    if (mode === 'bars') {
      barsG.style.display = 'block';
      areaG.style.display = 'none';
      gaugeG.style.display = 'none';
      legendBox.style.display = 'flex';
      caption.textContent = 'Monthly Revenue vs. Profit Trajectory';
    } else if (mode === 'growth') {
      barsG.style.display = 'none';
      areaG.style.display = 'block';
      gaugeG.style.display = 'none';
      legendBox.style.display = 'none';
      caption.textContent = 'Cumulative Growth Curve & Margin Trajectory';
    } else if (mode === 'gauge') {
      barsG.style.display = 'none';
      areaG.style.display = 'none';
      gaugeG.style.display = 'block';
      legendBox.style.display = 'none';
      caption.textContent = 'Target Attainment & Performance Index';
    }
    playClickAudio(620);
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
    }
    playClickAudio(580);
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

    // Dynamic Gauge
    var gaugeCircle = document.getElementById('gauge-circle-fill');
    var gaugeText = document.getElementById('gauge-pct-text');
    if (gaugeCircle && gaugeText) {
      var attainmentPct = Math.round((rev / 160000) * 100);
      gaugeText.textContent = attainmentPct + '%';
      var offset = Math.max(0, 377 - (377 * (attainmentPct / 150)));
      gaugeCircle.setAttribute('stroke-dashoffset', offset);
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
    1: "-- Query 1: Sales Fact Table Aggregation\nSELECT \n    p.category_name, \n    COUNT(s.order_id) AS total_orders,\n    SUM(s.order_amount) AS gross_sales,\n    ROUND(AVG(s.margin_pct), 2) AS avg_margin\nFROM sales_fact s\nJOIN dim_product p ON s.product_id = p.product_id\nGROUP BY p.category_name;\n----------------------------------------------------------------------\n> Electronics    | 480 orders | ₹7,45,000 | 29.5% margin\n> Commercial     | 320 orders | ₹5,12,800 | 33.2% margin\n> Office Supplies| 620 orders | ₹2,18,400 | 24.1% margin\n[Query executed in 0.0018 seconds &middot; Ready for Star Schema DirectQuery]",
    2: "-- Query 2: Star Schema Customer Join\nSELECT \n    c.city_name, \n    COUNT(DISTINCT c.customer_id) AS total_clients,\n    SUM(f.order_amount) AS gross_turnover\nFROM dim_customer c\nLEFT JOIN sales_fact f ON c.customer_id = f.customer_id\nGROUP BY c.city_name\nHAVING gross_turnover > 100000;\n----------------------------------------------------------------------\n> Chennai (HQ)   | 142 clients | ₹8,92,400\n> Bengaluru      |  88 clients | ₹5,40,100\n> Coimbatore     |  46 clients | ₹2,15,300\n[Query executed in 0.0022 seconds &middot; Relational Indexes Verified]",
    3: "-- Query 3: Target Variance & Attainment\nSELECT \n    fiscal_month, target_amount, actual_revenue,\n    ROUND(((actual_revenue - target_amount) / target_amount) * 100, 1) AS attainment_pct\nFROM monthly_targets\nORDER BY fiscal_month DESC;\n----------------------------------------------------------------------\n> 2026-06 (June) | ₹1,50,000 | ₹1,68,200 | +12.1% (Above Target)\n> 2026-05 (May)  | ₹1,40,000 | ₹1,49,500 |  +6.8% (Above Target)\n[Query executed in 0.0014 seconds &middot; Zero Execution Variance]"
  };

  window.runSQLTest = function(id) {
    var out = document.getElementById('sql-console-zone');
    if (!out) return;
    out.textContent = '-- Executing query in MySQL runtime engine...';
    document.querySelectorAll('.sql-preset-btn').forEach(function(b, idx) {
      b.classList.toggle('active', idx + 1 === id);
    });
    setTimeout(function() {
      out.textContent = sqlData[id];
      playClickAudio(700);
    }, 160);
  };

  // Pipeline Stepper Active state
  window.activatePipelineStep = function(stepIdx) {
    var steps = document.querySelectorAll('.pipeline-step-item');
    steps.forEach(function(s, idx) {
      s.classList.toggle('active', idx + 1 === stepIdx);
    });
    playClickAudio(480);
  };

  // Contact Form Submit with Validation & Anti-Spam Rate Limiting
  var isContactSubmitting = false;
  window.handleContactSubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (isContactSubmitting) {
      return false;
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

    // Rate-limiting lock
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
      window.location.href = 'mailto:sanjairam1179@gmail.com?subject=' + subject + '&body=' + body;
      
      // Cooldown timer (3 seconds) to prevent spamming
      setTimeout(function() {
        isContactSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-disabled');
          submitBtn.removeAttribute('aria-busy');
          submitBtn.innerHTML = '<span>SEND INQUIRY VIA EMAIL</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        }
      }, 3000);
    }, 400);

    return false;
  };

  // Dedicated Print ATS Resume
  window.printResume = function() {
    playClickAudio(650);
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

      // Calculate target position and dimensions relative to navList
      var navRect = navList.getBoundingClientRect();
      var targetRect = targetAnchor.getBoundingClientRect();
      var targetLeft = targetRect.left - navRect.left + navList.scrollLeft;
      var targetTop = targetRect.top - navRect.top + navList.scrollTop;
      var targetWidth = targetRect.width;
      var targetHeight = targetRect.height;

      // Respect prefers-reduced-motion
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!animate || prefersReduced) {
        indicator.style.transition = 'none';
      } else {
        indicator.style.transition = 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), width 380ms cubic-bezier(0.16, 1, 0.3, 1), height 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease';
      }

      // Apply 60 FPS GPU-accelerated transform
      indicator.style.transform = 'translate3d(' + targetLeft + 'px, ' + targetTop + 'px, 0)';
      indicator.style.width = targetWidth + 'px';
      indicator.style.height = targetHeight + 'px';
      indicator.style.opacity = '1';

      // Keep active item in view on horizontally scrollable screens (mobile)
      if (navList.scrollWidth > navList.clientWidth) {
        var scrollTarget = targetLeft - (navList.clientWidth / 2) + (targetWidth / 2);
        if (animate && !prefersReduced) {
          navList.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
        } else {
          navList.scrollLeft = Math.max(0, scrollTarget);
        }
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
      var startX = 0;
      var scrollStart = 0;
      var isDown = false;

      list.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          startX = e.touches[0].pageX - list.offsetLeft;
          scrollStart = list.scrollLeft;
          isDown = true;
        }
      }, { passive: true });

      list.addEventListener('touchmove', function(e) {
        if (!isDown || e.touches.length !== 1) return;
        var x = e.touches[0].pageX - list.offsetLeft;
        var walk = (x - startX);
        list.scrollLeft = scrollStart - walk;
      }, { passive: true });

      list.addEventListener('touchend', function() {
        isDown = false;
      }, { passive: true });
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
  // MULTI-PAGE SCREEN ROUTER (sarveshworks.vercel.app style)
  // ==========================================================================
  var screenOrder = ['overview', 'dashboard', 'projects', 'skills', 'experience', 'resume', 'contact', 'privacy', '404'];
  var currentScreen = 'overview';

  var isNavigating = false;

  window.navigateToScreen = function(screenId, pushHash) {
    if (typeof pushHash === 'undefined') pushHash = true;
    if (isNavigating && screenId === currentScreen) return;
    if (screenId === currentScreen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Play tactile navigation audio (ascending forward, descending reverse)
    if (typeof playClickAudio === 'function') playClickAudio(isForward ? 580 : 480);

    var prevScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    currentScreen = screenId;
    isNavigating = true;

    // Update Top Navigation Bar sliding indicator & active state
    if (window.TopNavSlider && typeof window.TopNavSlider.setActiveScreen === 'function') {
      window.TopNavSlider.setActiveScreen(screenId, true);
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

    // Update URL hash without jumping
    if (pushHash && history.pushState) {
      history.pushState(null, null, '#' + screenId);
    }

    // Perform Dual-Screen Simultaneous Slide + Scale Transition
    var isMobile = window.innerWidth <= 900;
    var animDuration = isMobile ? 260 : 340;

    if (oldScreen && oldScreen !== targetScreen) {
      document.body.classList.add('is-screen-transitioning');

      // Dismiss mobile & laptop swipe guides 4 seconds after user's first actual screen navigation
      var swipeHint = document.getElementById('mobile-swipe-hint');
      if (swipeHint && !swipeHint.classList.contains('hint-dismissed')) {
        setTimeout(function() {
          swipeHint.classList.add('hint-dismissed');
        }, 4000);
      }
      var laptopHint = document.getElementById('laptop-swipe-hint');
      if (laptopHint && !laptopHint.classList.contains('hint-dismissed')) {
        setTimeout(function() {
          laptopHint.classList.add('hint-dismissed');
        }, 4000);
      }

      // Outgoing screen stays visible in place and animates out
      oldScreen.className = 'screen-view active screen-leaving ' + (isForward ? 'slide-out-left-scale' : 'slide-out-right-scale');
      oldScreen.style.top = '-' + prevScrollY + 'px';

      // Incoming screen animates in smoothly
      targetScreen.className = 'screen-view active screen-entering ' + (isForward ? 'slide-in-right-scale' : 'slide-in-left-scale');

      // Reset scroll position for incoming screen
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      setTimeout(function() {
        if (oldScreen) {
          oldScreen.className = 'screen-view';
          oldScreen.style.top = '';
        }
        if (targetScreen) {
          targetScreen.className = 'screen-view active';
        }
        document.body.classList.remove('is-screen-transitioning');
        isNavigating = false;
        window.scrollTo(0, 0);
      }, animDuration);
    } else {
      document.querySelectorAll('.screen-view').forEach(function(s) {
        s.className = 'screen-view';
      });
      targetScreen.className = 'screen-view active';
      window.scrollTo(0, 0);
      isNavigating = false;
    }

    // Refresh animations or interactive stages if needed
    if (screenId === 'dashboard' && typeof renderActiveMode === 'function') {
      setTimeout(renderActiveMode, 100);
    }
  };

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('screen-' + hash)) {
      window.navigateToScreen(hash, false);
    } else {
      window.navigateToScreen('overview', false);
    }
  });

  // Initialize Top Navigation Slider & check initial hash on page load
  function checkInitialHash() {
    if (window.TopNavSlider && typeof window.TopNavSlider.init === 'function') {
      window.TopNavSlider.init();
    }
    var initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById('screen-' + initialHash)) {
      window.navigateToScreen(initialHash, false);
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

  // Copy plain text resume helper
  window.copyResumeText = function() {
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
  // FLUID AMBER/GOLD CURSOR FOLLOWER
  // ==========================================================================
  (function() {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    // Completely disable on mobile and touch devices to save GPU/CPU cycles
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (isTouch || window.innerWidth <= 1024) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    var mouseX = -100, mouseY = -100;
    var ringX = -100, ringY = -100;

    window.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    // Animate ring smoothly behind dot
    function updateCursorRing() {
      if (window.innerWidth <= 1024) return;
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(updateCursorRing);
    }
    requestAnimationFrame(updateCursorRing);

    // Enlarge ring when hovering interactive elements
    var hoverTargets = 'button, a, input, [onclick], .pipeline-step-item, .schema-table-node, .flip-card-front, .spotlight-card, .dock-btn';
    document.addEventListener('mouseover', function(e) {
      if (e.target.closest(hoverTargets)) {
        ring.classList.add('cursor-active');
      }
    });
    document.addEventListener('mouseout', function(e) {
      if (e.target.closest(hoverTargets)) {
        ring.classList.remove('cursor-active');
      }
    });
  })();

  
  // ==========================================================================
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
          window.navigateToScreen(swipeScreens[curIdx + 1]);
        } else if (dX > 0 && curIdx > 0) {
          // Swipe Right -> Previous section with reverse slide + scale
          window.navigateToScreen(swipeScreens[curIdx - 1]);
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

    // Protect interactive elements on screen (sliders, buttons, links, tables)
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, a, input, textarea, select, .schema-tables-grid, .star-schema-card')) {
      return;
    }

    // Deliberate horizontal page swipe: requires at least 65px horizontal swipe within 450ms with minimal vertical drift
    if (Math.abs(dX) > 65 && Math.abs(dY) < 35 && dTime < 450) {
      if (dX < 0 && curIdx < swipeScreens.length - 1) {
        window.navigateToScreen(swipeScreens[curIdx + 1]);
      } else if (dX > 0 && curIdx > 0) {
        window.navigateToScreen(swipeScreens[curIdx - 1]);
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
          window.navigateToScreen(swipeScreens[curIdx + 1]);
        } else if (wheelAccumulatorX < 0 && curIdx > 0) {
          // Trackpad swipe left (deltaX negative) -> Previous screen
          window.navigateToScreen(swipeScreens[curIdx - 1]);
        }
      }
    }
  }, { passive: true });

  // 2. Laptop Mouse Click-and-Drag Horizontal Swipe
  var mStartX = 0, mStartY = 0, mStartTime = 0, isMouseDown = false;

  document.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return; // Left mouse click only
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, a, input, textarea, select, .modal-dialog-box, .schema-tables-grid, .code-copy-btn, .range-slider-input')) {
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
        window.navigateToScreen(swipeScreens[curIdx + 1]);
      } else if (dX > 0 && curIdx > 0) {
        // Drag Right -> Previous section
        window.navigateToScreen(swipeScreens[curIdx - 1]);
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
      window.navigateToScreen(swipeScreens[curIdx + 1]);
    } else if (e.key === 'ArrowLeft' && curIdx > 0) {
      window.navigateToScreen(swipeScreens[curIdx - 1]);
    }
  });

  // Update Year
  var yEl = document.getElementById('current-year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  // Auto-dismiss swipe hints after 25s idle
  setTimeout(function() {
    var swipeHint = document.getElementById('mobile-swipe-hint');
    if (swipeHint) swipeHint.classList.add('hint-dismissed');
    var laptopHint = document.getElementById('laptop-swipe-hint');
    if (laptopHint) laptopHint.classList.add('hint-dismissed');
  }, 25000);

})();