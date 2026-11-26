/**
 * Sanjai Ram M — Multi-Screen Horizontal Swipe Deck Architecture
 * Inspired by sarveshworks.vercel.app · 6 Discrete Full-Viewport Screens
 * GPU-Composited Hardware Accelerated Navigation · Zero Mobile Lag
 */

(function () {
  'use strict';

  // Screen Names Registry (6 discrete full-viewport screens)
  var screenNames = ['overview', 'cockpit', 'projects', 'skills', 'experience', 'resume'];
  var currentScreenIndex = 0;
  var isNavigating = false;

  Object.defineProperty(window, 'currentScreenIndex', {
    get: function () { return currentScreenIndex; },
    set: function (val) { window.goToScreen(val); },
    configurable: true
  });

  // Cache DOM Elements
  var deckTrack = null;
  var deckScreens = [];
  var deckNavLinks = [];
  var drawerNavRows = [];
  var dockPillItems = [];
  var dockActivePillBg = null;
  var mobileDrawerPane = null;
  var mobileHamburgerBtn = null;

  /* --------------------------------------------------------------------------
     1. SCREEN DECK NAVIGATION CONTROLLER (translate3d Hardware Compositing)
     -------------------------------------------------------------------------- */
  function updateDockPillPosition(idx) {
    if (!dockActivePillBg) dockActivePillBg = document.getElementById('dock-active-pill-bg');
    if (!dockActivePillBg || !dockPillItems[idx]) return;

    var activeBtn = dockPillItems[idx];
    dockActivePillBg.style.transform = 'translate3d(' + activeBtn.offsetLeft + 'px, 0, 0)';
    dockActivePillBg.style.width = activeBtn.offsetWidth + 'px';
  }

  window.goToScreen = function (idx, updateHash) {
    if (typeof updateHash === 'undefined') updateHash = true;
    idx = Math.max(0, Math.min(screenNames.length - 1, parseInt(idx, 10) || 0));

    currentScreenIndex = idx;
    var targetScreen = screenNames[idx];

    // Hardware-accelerated 280ms cubic-bezier translation
    if (!deckTrack) deckTrack = document.getElementById('deck-track');
    if (deckTrack) {
      deckTrack.style.transform = 'translate3d(-' + (idx * 100) + 'vw, 0, 0)';
    }

    // Update Screen Active States
    deckScreens.forEach(function (screen, sIdx) {
      if (sIdx === idx) {
        screen.classList.add('active');
        screen.setAttribute('aria-hidden', 'false');
      } else {
        screen.classList.remove('active');
        screen.setAttribute('aria-hidden', 'true');
      }
    });

    // Update Desktop Header Links
    deckNavLinks.forEach(function (btn, bIdx) {
      if (bIdx === idx) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update Mobile Drawer Rows
    drawerNavRows.forEach(function (row, rIdx) {
      if (rIdx === idx) row.classList.add('active');
      else row.classList.remove('active');
    });

    // Update Bottom Dock Pills
    dockPillItems.forEach(function (pill, pIdx) {
      if (pIdx === idx) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    updateDockPillPosition(idx);

    // Update URL hash
    if (updateHash && window.location.hash !== '#' + targetScreen) {
      try {
        history.replaceState(null, null, '#' + targetScreen);
      } catch (e) {}
    }

    // Reset vertical scroll inside the target screen to top
    if (deckScreens[idx]) {
      deckScreens[idx].scrollTop = 0;
    }
  };

  window.nextScreen = function () {
    if (currentScreenIndex < screenNames.length - 1) {
      window.goToScreen(currentScreenIndex + 1);
    }
  };

  window.prevScreen = function () {
    if (currentScreenIndex > 0) {
      window.goToScreen(currentScreenIndex - 1);
    }
  };

  /* --------------------------------------------------------------------------
     2. MULTI-INPUT GESTURE CONTROLLER (Touch Swipe, Trackpad Wheel, Keys)
     -------------------------------------------------------------------------- */
  function initGestureControls() {
    // 2A. Mobile Touch Swipe
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;
    var isTouchScrolling = false;
    var isInteractiveTarget = false;

    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      var target = e.target;
      
      // Ignore gestures originating in sliders, code blocks, form inputs, modals, or buttons
      if (target && typeof target.closest === 'function') {
        if (target.closest('input[type="range"], pre, code, textarea, input, select, .modal-backdrop, .modal-card, button, a')) {
          isInteractiveTarget = true;
          return;
        }
      }
      isInteractiveTarget = false;
      isTouchScrolling = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (isInteractiveTarget || e.touches.length !== 1 || isTouchScrolling) return;
      var curX = e.touches[0].clientX;
      var curY = e.touches[0].clientY;
      var dx = curX - touchStartX;
      var dy = curY - touchStartY;

      // If predominantly vertical scrolling inside screen, don't hijack
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        isTouchScrolling = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (isInteractiveTarget || isTouchScrolling) return;
      var endX = e.changedTouches[0].clientX;
      var endY = e.changedTouches[0].clientY;
      var dx = endX - touchStartX;
      var dy = endY - touchStartY;
      var dt = Date.now() - touchStartTime;

      // Swipe threshold: |dx| > 48px, horizontal dominance |dx| > |dy| * 1.4, duration < 600ms
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
        if (dx < -48) {
          window.nextScreen();
        } else if (dx > 48) {
          window.prevScreen();
        }
      }
    }, { passive: true });

    // 2B. Laptop Trackpad 2-Finger Horizontal Swipe & Wheel
    var wheelAccumulatorX = 0;
    var wheelResetTimer = null;
    var isWheelDebounced = false;

    window.addEventListener('wheel', function (e) {
      // Protect horizontal code blocks and tables from wheel swipe navigation
      if (e.target && typeof e.target.closest === 'function') {
        if (e.target.closest('pre, code, .table-responsive-box')) return;
      }

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        wheelAccumulatorX += e.deltaX;
        clearTimeout(wheelResetTimer);
        wheelResetTimer = setTimeout(function () {
          wheelAccumulatorX = 0;
        }, 200);

        if (!isWheelDebounced && Math.abs(wheelAccumulatorX) > 35) {
          isWheelDebounced = true;
          if (wheelAccumulatorX > 0) {
            window.nextScreen();
          } else {
            window.prevScreen();
          }
          wheelAccumulatorX = 0;
          setTimeout(function () {
            isWheelDebounced = false;
          }, 420);
        }
      }
    }, { passive: true });

    // 2C. Keyboard Arrow Navigation & Command Palette Shortcuts
    document.addEventListener('keydown', function (e) {
      var activeEl = document.activeElement;
      var isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // Command Palette Trigger: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        window.toggleCommandPalette();
        return;
      }

      // Escape key closes modals
      if (e.key === 'Escape') {
        window.closeAllModals();
        return;
      }

      // If user is typing in a form or palette, don't trigger deck arrow keys
      if (isInputFocused) {
        if (activeEl.id === 'palette-search-input') {
          handlePaletteKeydown(e);
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        window.nextScreen();
      } else if (e.key === 'ArrowLeft') {
        window.prevScreen();
      }
    });

    // Resize event updates active pill position
    window.addEventListener('resize', function () {
      updateDockPillPosition(currentScreenIndex);
    });
  }

  /* --------------------------------------------------------------------------
     3. MODAL CONTROLLERS (Recruiter Summary, Command Palette, Avatar)
     -------------------------------------------------------------------------- */
  window.openModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  window.closeAllModals = function () {
    var modals = document.querySelectorAll('.modal-backdrop.open');
    modals.forEach(function (m) {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
    window.closeMobileMenu();
  };

  window.openRecruiterSummaryModal = function () {
    window.openModal('modal-recruiter-summary');
  };

  window.openAvatarModal = function () {
    window.openModal('modal-avatar-preview');
  };

  window.toggleCommandPalette = function () {
    var modal = document.getElementById('modal-command-palette');
    if (!modal) return;
    if (modal.classList.contains('open')) {
      window.closeModal('modal-command-palette');
    } else {
      window.openModal('modal-command-palette');
      var searchInput = document.getElementById('palette-search-input');
      if (searchInput) {
        searchInput.value = '';
        window.filterPaletteItems('');
        setTimeout(function () { searchInput.focus(); }, 50);
      }
    }
  };

  window.filterPaletteItems = function (query) {
    query = (query || '').toLowerCase().trim();
    var items = document.querySelectorAll('.palette-item');
    var headings = document.querySelectorAll('.palette-group-heading');

    items.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      if (!query || text.indexOf(query) !== -1) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // Hide empty group headings if query is active
    if (query) {
      headings.forEach(function (h) { h.style.display = 'none'; });
    } else {
      headings.forEach(function (h) { h.style.display = 'block'; });
    }

    // Set first visible item active
    var firstVisible = document.querySelector('.palette-item[style*="display: flex"]');
    items.forEach(function (it) { it.classList.remove('active'); });
    if (firstVisible) firstVisible.classList.add('active');
  };

  function handlePaletteKeydown(e) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.palette-item')).filter(function (it) {
      return it.style.display !== 'none';
    });
    if (!items.length) return;

    var curIdx = -1;
    items.forEach(function (it, idx) {
      if (it.classList.contains('active')) curIdx = idx;
    });

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var nextIdx = (curIdx + 1) % items.length;
      items.forEach(function (it) { it.classList.remove('active'); });
      items[nextIdx].classList.add('active');
      items[nextIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      var prevIdx = (curIdx - 1 + items.length) % items.length;
      items.forEach(function (it) { it.classList.remove('active'); });
      items[prevIdx].classList.add('active');
      items[prevIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (curIdx >= 0 && items[curIdx]) {
        items[curIdx].click();
      }
    }
  }

  /* --------------------------------------------------------------------------
     4. MOBILE DRAWER NAVIGATION MENU
     -------------------------------------------------------------------------- */
  window.toggleMobileMenu = function () {
    if (!mobileDrawerPane) mobileDrawerPane = document.getElementById('mobile-drawer-pane');
    if (!mobileHamburgerBtn) mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');
    if (!mobileDrawerPane) return;

    var isOpen = mobileDrawerPane.classList.contains('open');
    if (isOpen) {
      window.closeMobileMenu();
    } else {
      mobileDrawerPane.classList.add('open');
      mobileDrawerPane.setAttribute('aria-hidden', 'false');
      if (mobileHamburgerBtn) {
        mobileHamburgerBtn.classList.add('active');
        mobileHamburgerBtn.setAttribute('aria-expanded', 'true');
      }
    }
  };

  window.closeMobileMenu = function () {
    if (!mobileDrawerPane) mobileDrawerPane = document.getElementById('mobile-drawer-pane');
    if (!mobileHamburgerBtn) mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');
    if (mobileDrawerPane) {
      mobileDrawerPane.classList.remove('open');
      mobileDrawerPane.setAttribute('aria-hidden', 'true');
    }
    if (mobileHamburgerBtn) {
      mobileHamburgerBtn.classList.remove('active');
      mobileHamburgerBtn.setAttribute('aria-expanded', 'false');
    }
  };

  /* --------------------------------------------------------------------------
     5. ROTATING SINGLE-PLAY RELOAD ANIMATION CONTROLLER (850ms)
     -------------------------------------------------------------------------- */
  function initReloadPreloader() {
    var gate = document.getElementById('sw-reload-gate');
    if (!gate) return;

    var variant = 0;
    try {
      variant = parseInt(localStorage.getItem('sr_preloader_variant') || '0', 10);
      localStorage.setItem('sr_preloader_variant', ((variant + 1) % 4).toString());
    } catch (e) {}

    // Auto-dismiss in exactly 850ms
    setTimeout(function () {
      gate.classList.add('dismissed');
      setTimeout(function () {
        if (gate.parentNode) gate.parentNode.removeChild(gate);
      }, 350);
    }, 850);
  }

  /* --------------------------------------------------------------------------
     6. LIVE BI COCKPIT & DAX SIMULATOR ENGINE
     -------------------------------------------------------------------------- */
  function formatINR(val) {
    val = Math.round(val);
    var isNeg = val < 0;
    val = Math.abs(val);
    var s = val.toString();
    var lastThree = s.substring(s.length - 3);
    var otherNumbers = s.substring(0, s.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return (isNeg ? '-' : '') + '₹' + res;
  }

  function flashDaxParam(id, valText) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = valText;
    el.classList.remove('dax-active-pulse');
    void el.offsetWidth;
    el.classList.add('dax-active-pulse');
  }

  window.recalculateSimulation = function () {
    var revSlider = document.getElementById('slider-revenue');
    var marginSlider = document.getElementById('slider-margin');
    var retSlider = document.getElementById('slider-retention');

    if (!revSlider || !marginSlider || !retSlider) return;

    var revenue = parseFloat(revSlider.value);
    var marginPct = parseFloat(marginSlider.value) / 100;
    var retentionPct = parseFloat(retSlider.value) / 100;

    // Display slider labels
    var revValEl = document.getElementById('val-revenue');
    var marginValEl = document.getElementById('val-margin');
    var retValEl = document.getElementById('val-retention');

    if (revValEl) revValEl.textContent = formatINR(revenue);
    if (marginValEl) marginValEl.textContent = (marginPct * 100).toFixed(0) + '%';
    if (retValEl) retValEl.textContent = (retentionPct * 100).toFixed(0) + '%';

    // Core Metrics
    var grossProfit = revenue * marginPct;
    var netProfit = grossProfit * 0.78;
    var avgOrderVal = 1850;
    var customerCount = Math.round(revenue / (avgOrderVal * 4.2));
    var clv = avgOrderVal * (marginPct / (1.05 - retentionPct));
    var retentionEfficiency = (retentionPct * marginPct * 100).toFixed(1) + 'x';

    // Update KPI Scorecards
    var kpiProfit = document.getElementById('kpi-gross-profit');
    var kpiMargin = document.getElementById('kpi-net-margin');
    var kpiClv = document.getElementById('kpi-clv');
    var kpiEff = document.getElementById('kpi-retention-eff');

    if (kpiProfit) kpiProfit.textContent = formatINR(grossProfit);
    if (kpiMargin) kpiMargin.textContent = formatINR(netProfit);
    if (kpiClv) kpiClv.textContent = formatINR(clv);
    if (kpiEff) kpiEff.textContent = retentionEfficiency;

    // Update Operating Margin Progress Bar & Status
    var marginBar = document.getElementById('kpi-margin-bar');
    if (marginBar) {
      var pctWidth = Math.min(100, Math.max(0, (marginPct / 0.50) * 100));
      marginBar.style.width = pctWidth.toFixed(1) + '%';
    }
    var marginStatus = document.getElementById('kpi-margin-status');
    if (marginStatus) {
      var tier = marginPct >= 0.30 ? 'Optimal Margin Tier' : (marginPct >= 0.20 ? 'Standard Margin Tier' : 'Low Margin Alert');
      marginStatus.innerHTML = '<span>' + tier + ' &middot; ' + (marginPct * 100).toFixed(0) + '% Target</span>';
    }


    // Flash DAX Measure Formula Parameters
    flashDaxParam('dax-param-margin', (marginPct * 100).toFixed(0) + '%');
    flashDaxParam('dax-param-retention', (retentionPct * 100).toFixed(0) + '%');
    flashDaxParam('dax-param-revenue', formatINR(revenue));

    // Update Visual Chart Canvas
    updateChartCanvas(revenue, marginPct, retentionPct);
  };

  var currentChartMode = 'trajectory';
  window.switchChartMode = function (mode) {
    currentChartMode = mode;
    var tabs = document.querySelectorAll('.chart-mode-btn');
    tabs.forEach(function (t) {
      if (t.getAttribute('data-mode') === mode) t.classList.add('active');
      else t.classList.remove('active');
    });
    window.recalculateSimulation();
  };

  function updateChartCanvas(rev, margin, ret) {
    var canvas = document.getElementById('bi-visual-canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    var isDark = (document.documentElement.dataset.theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark' || document.body.getAttribute('data-theme') === 'dark');
    var gridColor = isDark ? '#2B333E' : '#E2DFD7';
    var textColor = isDark ? '#76808F' : '#6E7681';
    var primaryColor = isDark ? '#58A6FF' : '#1E40AF';
    var orangeColor = isDark ? '#E3B341' : '#B45309';
    var profitColor = isDark ? '#3FB950' : '#15803D';

    // Draw baseline axes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, h - 30);
    ctx.lineTo(w - 20, h - 30);
    ctx.stroke();

    if (currentChartMode === 'trajectory') {
      var points = 6;
      var step = (w - 70) / (points - 1);
      ctx.beginPath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;

      for (var i = 0; i < points; i++) {
        var progress = i / (points - 1);
        var growth = Math.pow(1 + margin * 0.45, i) * (0.8 + ret * 0.25);
        var yVal = (h - 40) - (growth / 2.2) * (h - 70);
        var xVal = 45 + i * step;

        if (i === 0) ctx.moveTo(xVal, yVal);
        else ctx.lineTo(xVal, yVal);
      }
      ctx.stroke();

      // Points & labels
      for (var j = 0; j < points; j++) {
        var pX = 45 + j * step;
        var pGrowth = Math.pow(1 + margin * 0.45, j) * (0.8 + ret * 0.25);
        var pY = (h - 40) - (pGrowth / 2.2) * (h - 70);

        ctx.fillStyle = orangeColor;
        ctx.beginPath();
        ctx.arc(pX, pY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText('Q' + (j + 1), pX - 6, h - 14);
      }
    } else if (currentChartMode === 'breakdown') {
      var categories = ['Electronics', 'Grocery', 'Fashion', 'Home'];
      var shares = [0.38 * margin, 0.28, 0.20 * (1 + ret * 0.2), 0.14];
      var totalShare = shares.reduce(function (a, b) { return a + b; }, 0);
      var barStep = (w - 70) / categories.length;

      categories.forEach(function (cat, idx) {
        var barW = barStep * 0.55;
        var barH = ((shares[idx] / totalShare) * (h - 70));
        var bX = 55 + idx * barStep;
        var bY = (h - 30) - barH;

        ctx.fillStyle = idx % 2 === 0 ? primaryColor : orangeColor;
        ctx.fillRect(bX, bY, barW, barH);

        ctx.fillStyle = textColor;
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText(cat.substring(0, 5), bX, h - 14);
      });
    } else {
      // Margin trends
      ctx.strokeStyle = profitColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var mX = 45 + k * ((w - 70) / 5);
        var mY = (h - 40) - (margin * 1.6 + (k * 0.04)) * (h - 80);
        if (k === 0) ctx.moveTo(mX, mY);
        else ctx.lineTo(mX, mY);
      }
      ctx.stroke();
    }
  }

  window.switchModelMode = function (mode) {
    var btn3nf = document.getElementById('btn-model-3nf');
    var btnCsv = document.getElementById('btn-model-csv');
    var view3nf = document.getElementById('model-view-3nf');
    var viewCsv = document.getElementById('model-view-csv');

    if (!btn3nf || !btnCsv || !view3nf || !viewCsv) return;

    if (mode === '3nf') {
      btn3nf.classList.add('active');
      btnCsv.classList.remove('active');
      view3nf.style.display = 'block';
      viewCsv.style.display = 'none';
    } else {
      btnCsv.classList.add('active');
      btn3nf.classList.remove('active');
      viewCsv.style.display = 'block';
      view3nf.style.display = 'none';
    }
  };

  /* --------------------------------------------------------------------------
     7. SQL QUERY RUNNER
     -------------------------------------------------------------------------- */
  var sqlPresets = {
    top_stores: {
      query: "SELECT s.store_name, s.region,\n       COUNT(f.transaction_id) AS total_orders,\n       ROUND(SUM(f.sales_amount), 2) AS gross_revenue\nFROM fact_sales f\nJOIN dim_store s ON f.store_id = s.store_id\nGROUP BY s.store_id, s.store_name, s.region\nORDER BY gross_revenue DESC\nLIMIT 5;",
      timing: "1.8ms execution · 5 rows returned",
      headers: ["store_name", "region", "total_orders", "gross_revenue"],
      rows: [
        ["Izeon Anna Nagar", "Chennai Central", "3,412", "₹48,24,190.00"],
        ["Izeon T. Nagar Hub", "Chennai South", "2,984", "₹42,10,800.00"],
        ["Izeon Velachery Depot", "Chennai South", "2,450", "₹34,60,250.00"],
        ["Izeon OMR Express Hub", "Chennai Suburban", "2,190", "₹31,04,500.00"],
        ["Izeon Tambaram Center", "Chennai South", "1,876", "₹26,45,000.00"]
      ]
    },
    retention: {
      query: "SELECT c.customer_tier,\n       COUNT(DISTINCT c.customer_id) AS active_accounts,\n       ROUND(AVG(f.sales_amount), 2) AS aov,\n       ROUND(AVG(c.retention_score), 2) AS avg_score\nFROM dim_customer c\nJOIN fact_sales f ON c.customer_id = f.customer_id\nGROUP BY c.customer_tier\nORDER BY avg_score DESC;",
      timing: "2.1ms execution · 3 rows returned",
      headers: ["customer_tier", "active_accounts", "aov", "avg_score"],
      rows: [
        ["Enterprise Platinum", "142", "₹8,450.00", "0.94"],
        ["Growth Gold", "488", "₹3,210.00", "0.82"],
        ["Standard Retail", "1,620", "₹1,450.00", "0.68"]
      ]
    },
    margin: {
      query: "SELECT p.category_name,\n       ROUND(SUM(f.sales_amount), 2) AS revenue,\n       ROUND(SUM(f.margin_amount), 2) AS margin_inr,\n       ROUND((SUM(f.margin_amount) / SUM(f.sales_amount)) * 100, 1) AS margin_pct\nFROM fact_sales f\nJOIN dim_product p ON f.product_id = p.product_id\nGROUP BY p.category_name\nORDER BY margin_inr DESC;",
      timing: "1.6ms execution · 4 rows returned",
      headers: ["category_name", "revenue", "margin_inr", "margin_pct"],
      rows: [
        ["BI & Analytics Tooling", "₹64,20,000.00", "₹24,39,600.00", "38.0%"],
        ["Cloud Warehousing", "₹42,10,000.00", "₹13,47,200.00", "32.0%"],
        ["Database Services", "₹31,50,000.00", "₹8,82,000.00", "28.0%"],
        ["Advisory & Consulting", "₹18,20,000.00", "₹3,82,200.00", "21.0%"]
      ]
    }
  };

  var currentSqlPreset = 'top_stores';
  window.switchSqlPreset = function (presetKey) {
    if (!sqlPresets[presetKey]) return;
    currentSqlPreset = presetKey;

    var btns = document.querySelectorAll('.sql-preset-btn');
    btns.forEach(function (b) {
      if (b.getAttribute('data-preset') === presetKey) b.classList.add('active');
      else b.classList.remove('active');
    });

    var editor = document.getElementById('sql-editor-code');
    if (editor) editor.textContent = sqlPresets[presetKey].query;
    window.runSqlQuery();
  };

  window.runSqlQuery = function () {
    var data = sqlPresets[currentSqlPreset];
    if (!data) return;

    var timingEl = document.getElementById('sql-exec-timing');
    var thead = document.getElementById('sql-table-head');
    var tbody = document.getElementById('sql-table-body');

    if (timingEl) timingEl.textContent = data.timing;

    if (thead) {
      thead.innerHTML = '<tr>' + data.headers.map(function (h) {
        return '<th>' + h + '</th>';
      }).join('') + '</tr>';
    }

    if (tbody) {
      tbody.innerHTML = data.rows.map(function (row) {
        return '<tr>' + row.map(function (col) {
          return '<td class="mono">' + col + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }
  };

  /* --------------------------------------------------------------------------
     8. PROJECTS FILTERING
     -------------------------------------------------------------------------- */
  window.filterProjects = function (cat) {
    var pills = document.querySelectorAll('.project-filter-pill');
    pills.forEach(function (p) {
      if (p.getAttribute('data-category') === cat) p.classList.add('active');
      else p.classList.remove('active');
    });

    var cards = document.querySelectorAll('.project-card');
    cards.forEach(function (card) {
      var cardCat = card.getAttribute('data-category') || '';
      if (cat === 'all' || cardCat.indexOf(cat) !== -1) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  /* --------------------------------------------------------------------------
     9. THEME CONTROLLER (Warm Alabaster Light / Graphite Obsidian Dark)
     -------------------------------------------------------------------------- */
  function updateThemeUI(theme) {
    var btnDesktop = document.getElementById('btn-theme-toggle');
    var btnDrawer = document.getElementById('btn-drawer-theme-toggle');
    var labelText = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    var nextTitle = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    if (btnDesktop) {
      btnDesktop.setAttribute('title', nextTitle);
      btnDesktop.setAttribute('aria-label', nextTitle);
    }
    if (btnDrawer) {
      btnDrawer.setAttribute('title', nextTitle);
      btnDrawer.setAttribute('aria-label', nextTitle);
      var labelSpan = btnDrawer.querySelector('.theme-toggle-label');
      if (labelSpan) labelSpan.textContent = labelText;
    }
  }

  function initTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem('sa_theme') || localStorage.getItem('sr_portfolio_theme');
    } catch (e) {}
    var theme = stored;
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.dataset.theme = theme;
    document.body.setAttribute('data-theme', theme);
    updateThemeUI(theme);
  }

  window.toggleTheme = function () {
    var current = document.documentElement.dataset.theme || document.body.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.dataset.theme = next;
    document.body.setAttribute('data-theme', next);
    try {
      localStorage.setItem('sa_theme', next);
      localStorage.setItem('sr_portfolio_theme', next);
    } catch (e) {}
    updateThemeUI(next);
    if (typeof window.recalculateSimulation === 'function') {
      window.recalculateSimulation();
    }
  };

  /* --------------------------------------------------------------------------
     10. ATS RESUME ACTIONS & PRINT
     -------------------------------------------------------------------------- */
  window.printResume = function () {
    // If not already on resume screen, jump to it first
    if (currentScreenIndex !== 5) {
      window.goToScreen(5);
    }
    setTimeout(function () {
      window.print();
    }, 100);
  };

  window.copyResumeText = function () {
    var text = [
      "SANJAI RAM M — Data Analyst & Business Intelligence Specialist",
      "Chennai, Tamil Nadu, India | sanjairam1179@gmail.com | +91 9445780179",
      "Portfolio: https://sanjai-analytics.vercel.app/ | GitHub: github.com/sanj2006-ram",
      "",
      "PROFESSIONAL SUMMARY:",
      "Commerce & Computer Applications graduate with practical internship experience in Power BI, DAX modeling, Power Query, and MySQL. Proficient in transforming 12,000+ raw sales records into normalized 3NF schemas and star-schema dimensional models.",
      "",
      "WORK EXPERIENCE:",
      "Data Analytics & BI Intern — Izeon Innovative Pvt Ltd (May 2026 - June 2026)",
      "- Ingested and normalized 12,000+ transactional sales records into 3NF MySQL schema.",
      "- Automated Power Query M-code ETL pipelines, cutting reporting turnaround by 65%.",
      "- Formulated 18+ DAX calculated measures (YTD Revenue, Gross Margin %, Retention Score).",
      "- Built executive Power BI operational reporting cockpits.",
      "",
      "EDUCATION:",
      "Bachelor of Commerce in Computer Applications — Guru Nanak College (2024 - 2027)",
      "Current CGPA: 8.6 / 10 | Coursework: DBMS, Financial Accounting, Statistics.",
      "Higher Secondary Certificate (HSC) — Commerce with CA (2024, 86.2%)",
      "",
      "TECHNICAL COMPETENCIES:",
      "Power BI Desktop, DAX, Power Query (M-Code), MySQL, 3NF Normalization, Complex SQL Joins, Advanced Excel (VLOOKUP, Pivot, What-If), Tally Prime."
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.showToast("Resume plain text copied for ATS portals!");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      window.showToast("Resume plain text copied!");
    } catch (e) {}
    document.body.removeChild(ta);
  }

  window.showToast = function (msg) {
    var pill = document.getElementById('toast-message-pill');
    if (!pill) return;
    pill.textContent = msg;
    pill.classList.add('active');
    setTimeout(function () {
      pill.classList.remove('active');
    }, 2400);
  };

  window.handleContactSubmit = function (form) {
    var name = (form.name ? form.name.value : '').trim();
    var email = (form.email ? form.email.value : '').trim();
    var message = (form.message ? form.message.value : '').trim();

    var subject = encodeURIComponent("Data Analytics & BI Inquiry — " + (name || "Recruiter"));
    var body = encodeURIComponent("From: " + name + " (" + email + ")\n\nMessage / Opportunity Details:\n" + message);
    var gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=sanjairam1179@gmail.com&su=" + subject + "&body=" + body;

    window.open(gmailUrl, '_blank');
    window.showToast("Opening Gmail draft for direct message...");
    form.reset();
  };

  /* --------------------------------------------------------------------------
     11. SARVESH WORKS ATTRIBUTION & INTEGRITY FAIL-SAFE
     -------------------------------------------------------------------------- */
  function initIntegrityGuard() {
    var anchor = document.getElementById('sw-credit-anchor');
    var colophon = document.getElementById('sw-footer-colophon');
    var overlay = document.getElementById('integrity-error-overlay');

    function verifyAttribution() {
      if (!anchor || !colophon || !anchor.isConnected) {
        triggerLockdown();
        return;
      }
      var href = anchor.getAttribute('href') || '';
      var text = anchor.textContent || '';
      if (href.indexOf('sarveshworks.vercel.app') === -1) {
        triggerLockdown();
        return;
      }
      if (text.indexOf('Maintained & Developed by Sarvesh Works') === -1 && text.indexOf('Sarvesh Works') === -1) {
        triggerLockdown();
        return;
      }
      var style = window.getComputedStyle(anchor);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.05) {
        triggerLockdown();
        return;
      }
    }

    function triggerLockdown() {
      if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
      }
      if (deckTrack) {
        deckTrack.style.filter = 'grayscale(1) contrast(0.5)';
        deckTrack.style.pointerEvents = 'none';
      }
    }

    if (colophon && window.MutationObserver) {
      var observer = new MutationObserver(verifyAttribution);
      observer.observe(colophon, { childList: true, subtree: true, attributes: true, characterData: true });
    }

    setInterval(verifyAttribution, 1500);
    verifyAttribution();
  }

  /* --------------------------------------------------------------------------
     12. INITIALIZATION ON DOM READY
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    deckTrack = document.getElementById('deck-track');
    deckScreens = Array.prototype.slice.call(document.querySelectorAll('.deck-screen'));
    deckNavLinks = Array.prototype.slice.call(document.querySelectorAll('.deck-nav-link'));
    drawerNavRows = Array.prototype.slice.call(document.querySelectorAll('.drawer-nav-row'));
    dockPillItems = Array.prototype.slice.call(document.querySelectorAll('.dock-pill-item'));
    dockActivePillBg = document.getElementById('dock-active-pill-bg');
    mobileDrawerPane = document.getElementById('mobile-drawer-pane');
    mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');

    initReloadPreloader();
    initTheme();
    initGestureControls();
    initIntegrityGuard();

    // Check initial hash
    var hash = (window.location.hash || '').replace('#', '');
    var initialIdx = screenNames.indexOf(hash);
    if (initialIdx >= 0) {
      window.goToScreen(initialIdx, false);
    } else {
      window.goToScreen(0, false);
    }

    // Initialize BI simulator
    window.recalculateSimulation();
    window.runSqlQuery();
  });

})();
