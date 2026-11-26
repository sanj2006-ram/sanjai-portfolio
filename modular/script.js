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
      if (bIdx === idx) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });

    // Update Mobile Drawer Rows
    drawerNavRows.forEach(function (row, rIdx) {
      if (rIdx === idx) {
        row.classList.add('active');
        row.setAttribute('aria-current', 'page');
      } else {
        row.classList.remove('active');
        row.removeAttribute('aria-current');
      }
    });

    // Update Bottom Dock Pills
    dockPillItems.forEach(function (pill, pIdx) {
      if (pIdx === idx) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    updateDockPillPosition(idx);

    // Update URL hash smoothly
    if (updateHash && window.location.hash !== '#' + targetScreen) {
      try {
        if (window.history && window.history.pushState) {
          window.history.pushState(null, null, '#' + targetScreen);
        } else {
          window.location.hash = '#' + targetScreen;
        }
      } catch (e) {
        window.location.hash = '#' + targetScreen;
      }
    }

    // Reset vertical scroll inside the target screen to top
    if (deckScreens[idx]) {
      deckScreens[idx].scrollTop = 0;
    }
  };

  window.scrollToDossierSection = function (id) {
    var el = document.getElementById(id);
    var resumeContainer = document.getElementById('resume');
    if (!el || !resumeContainer) return;
    var targetPos = el.offsetTop - 76;
    resumeContainer.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
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

  // Synchronize browser history and direct hash routing
  window.addEventListener('hashchange', function () {
    var hash = (window.location.hash || '').replace('#', '');
    var idx = screenNames.indexOf(hash);
    if (idx >= 0 && idx !== currentScreenIndex) {
      window.goToScreen(idx, false);
    }
  });

  window.addEventListener('popstate', function () {
    var hash = (window.location.hash || '').replace('#', '');
    var idx = screenNames.indexOf(hash);
    if (idx >= 0 && idx !== currentScreenIndex) {
      window.goToScreen(idx, false);
    }
  });

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

    // 2B. Laptop Trackpad Horizontal Swipe (Strict Dominance & Threshold)
    var wheelAccumulatorX = 0;
    var wheelResetTimer = null;
    var isWheelDebounced = false;

    window.addEventListener('wheel', function (e) {
      // Protect horizontal code blocks and tables from wheel swipe navigation
      if (e.target && typeof e.target.closest === 'function') {
        if (e.target.closest('pre, code, .table-responsive-box, .dock-container-pill')) return;
      }

      // Only respond to strictly horizontal gestures with significant intent
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2.5 && Math.abs(e.deltaX) > 20) {
        wheelAccumulatorX += e.deltaX;
        clearTimeout(wheelResetTimer);
        wheelResetTimer = setTimeout(function () {
          wheelAccumulatorX = 0;
        }, 220);

        if (!isWheelDebounced && Math.abs(wheelAccumulatorX) > 95) {
          isWheelDebounced = true;
          if (wheelAccumulatorX > 0) {
            window.nextScreen();
          } else {
            window.prevScreen();
          }
          wheelAccumulatorX = 0;
          setTimeout(function () {
            isWheelDebounced = false;
          }, 450);
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
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.style.overflow = '';
    }
  };

  window.closeAllModals = function () {
    var modals = document.querySelectorAll('.modal-backdrop.open');
    modals.forEach(function (m) {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
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
  window.openMobileMenu = function () {
    if (!mobileDrawerPane) mobileDrawerPane = document.getElementById('mobile-drawer-pane');
    if (!mobileHamburgerBtn) mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');
    if (mobileDrawerPane) {
      mobileDrawerPane.classList.add('open');
      mobileDrawerPane.classList.add('active');
      mobileDrawerPane.setAttribute('aria-hidden', 'false');
    }
    if (mobileHamburgerBtn) {
      mobileHamburgerBtn.classList.add('active');
      mobileHamburgerBtn.setAttribute('aria-expanded', 'true');
    }
  };

  window.toggleMobileMenu = function () {
    if (!mobileDrawerPane) mobileDrawerPane = document.getElementById('mobile-drawer-pane');
    if (!mobileHamburgerBtn) mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');
    if (!mobileDrawerPane) return;

    var isOpen = mobileDrawerPane.classList.contains('open') || mobileDrawerPane.classList.contains('active');
    if (isOpen) {
      window.closeMobileMenu();
    } else {
      mobileDrawerPane.classList.add('open');
      mobileDrawerPane.classList.add('active');
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
      mobileDrawerPane.classList.remove('active');
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
    if (isNaN(val) || val === null || val === undefined) return '₹0';
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

  var currentVisualMode = 'bars';

  window.recalculateSimulation = function () {
    var revSlider = document.getElementById('range-rev') || document.getElementById('slider-revenue');
    var marginSlider = document.getElementById('range-margin') || document.getElementById('slider-margin');
    var retSlider = document.getElementById('range-ret') || document.getElementById('slider-retention');

    var revenue = revSlider ? parseFloat(revSlider.value) : 180000;
    var marginPct = marginSlider ? parseFloat(marginSlider.value) / 100 : 0.32;
    var retentionPct = retSlider ? parseFloat(retSlider.value) / 100 : 0.40;

    if (isNaN(revenue)) revenue = 180000;
    if (isNaN(marginPct)) marginPct = 0.32;
    if (isNaN(retentionPct)) retentionPct = 0.40;

    // Display slider controls value indicators
    var revDisplay = document.getElementById('ctrl-rev-display') || document.getElementById('val-revenue');
    var marginDisplay = document.getElementById('ctrl-margin-display') || document.getElementById('val-margin');
    var retDisplay = document.getElementById('ctrl-ret-display') || document.getElementById('val-retention');

    if (revDisplay) revDisplay.textContent = formatINR(revenue);
    if (marginDisplay) marginDisplay.textContent = (marginPct * 100).toFixed(0) + '%';
    if (retDisplay) retDisplay.textContent = (retentionPct * 100).toFixed(0) + '%';

    // Core Metrics
    var grossProfit = revenue * marginPct;
    var retentionVolume = revenue * retentionPct;

    // Update KPI Scorecards
    var kpiMargin = document.getElementById('kpi-margin-pct');
    var kpiMarginBar = document.getElementById('kpi-margin-bar');
    var kpiMarginStatus = document.getElementById('kpi-margin-status');
    var kpiNetProfit = document.getElementById('kpi-net-profit') || document.getElementById('kpi-gross-profit');
    var kpiRetentionGmv = document.getElementById('kpi-retention-gmv');

    if (kpiMargin) kpiMargin.textContent = (marginPct * 100).toFixed(1) + '%';
    if (kpiMarginBar) {
      var pctWidth = Math.min(100, Math.max(0, (marginPct / 0.50) * 100));
      kpiMarginBar.style.width = pctWidth.toFixed(1) + '%';
    }
    if (kpiMarginStatus) {
      var tier = marginPct >= 0.30 ? 'Optimal Margin Tier' : (marginPct >= 0.20 ? 'Standard Margin Tier' : 'Low Margin Alert');
      kpiMarginStatus.innerHTML = '<span>' + tier + ' &middot; ' + (marginPct * 100).toFixed(0) + '% Target</span>';
    }

    if (kpiNetProfit) kpiNetProfit.textContent = formatINR(grossProfit);
    if (kpiRetentionGmv) kpiRetentionGmv.textContent = formatINR(retentionVolume);

    // Flash DAX Measure Formula Parameters
    flashDaxParam('dax-margin-param', marginPct.toFixed(2));
    flashDaxParam('dax-retention-param', retentionPct.toFixed(2));
    flashDaxParam('dax-param-margin', (marginPct * 100).toFixed(0) + '%');
    flashDaxParam('dax-param-retention', (retentionPct * 100).toFixed(0) + '%');
    flashDaxParam('dax-param-revenue', formatINR(revenue));

    // Update Visual Chart Mode
    renderCockpitChart(revenue, marginPct, retentionPct);

    // Update Regional Performance Report & Category Metrics
    updateRegionalPerformanceMetrics(revenue, marginPct);
  };

  window.switchVisualMode = function (mode) {
    currentVisualMode = mode;
    var tabBars = document.getElementById('tab-mode-bars');
    var tabGrowth = document.getElementById('tab-mode-growth');
    var tabGauge = document.getElementById('tab-mode-gauge');

    if (tabBars) {
      tabBars.classList.toggle('active', mode === 'bars');
      tabBars.setAttribute('aria-selected', mode === 'bars' ? 'true' : 'false');
    }
    if (tabGrowth) {
      tabGrowth.classList.toggle('active', mode === 'growth');
      tabGrowth.setAttribute('aria-selected', mode === 'growth' ? 'true' : 'false');
    }
    if (tabGauge) {
      tabGauge.classList.toggle('active', mode === 'gauge');
      tabGauge.setAttribute('aria-selected', mode === 'gauge' ? 'true' : 'false');
    }

    window.recalculateSimulation();
  };

  function renderCockpitChart(revenue, marginPct, retentionPct) {
    var svg = document.getElementById('main-cockpit-chart');
    if (!svg) return;

    var monthLabels = document.getElementById('chart-month-labels');

    if (currentVisualMode === 'bars') {
      if (monthLabels) monthLabels.style.display = 'flex';
      var maxScaleRev = 200000;
      var revH = Math.min(125, Math.max(16, (revenue / maxScaleRev) * 120));
      var revY = 145 - revH;

      var profitVal = revenue * marginPct;
      var profitH = Math.min(125, Math.max(12, (profitVal / 80000) * 120));
      var profitY = 145 - profitH;

      svg.innerHTML = [
        '<defs>',
        '  <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">',
        '    <stop offset="0%" stop-color="var(--accent-primary)" />',
        '    <stop offset="100%" stop-color="var(--accent-primary-hover, #1D4ED8)" />',
        '  </linearGradient>',
        '  <linearGradient id="barProfitGrad" x1="0" y1="0" x2="0" y2="1">',
        '    <stop offset="0%" stop-color="var(--positive, #10B981)" />',
        '    <stop offset="100%" stop-color="#059669" />',
        '  </linearGradient>',
        '  <linearGradient id="barHighlight" x1="0" y1="0" x2="1" y2="0">',
        '    <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />',
        '    <stop offset="100%" stop-color="rgba(255,255,255,0)" />',
        '  </linearGradient>',
        '</defs>',
        '<line x1="40" y1="25" x2="520" y2="25" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<text x="35" y="28" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="monospace">200k</text>',
        '<line x1="40" y1="65" x2="520" y2="65" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<text x="35" y="68" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="monospace">150k</text>',
        '<line x1="40" y1="105" x2="520" y2="105" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<text x="35" y="108" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="monospace">100k</text>',
        '<line x1="40" y1="145" x2="520" y2="145" stroke="var(--border-hairline)" />',
        '<text x="35" y="148" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="monospace">0</text>',
        '<!-- Jan -->',
        '<rect x="58" y="70" width="22" height="75" rx="3" fill="url(#barRevGrad)" />',
        '<rect x="84" y="105" width="22" height="40" rx="3" fill="url(#barProfitGrad)" />',
        '<!-- Feb -->',
        '<rect x="138" y="62" width="22" height="83" rx="3" fill="url(#barRevGrad)" />',
        '<rect x="164" y="100" width="22" height="45" rx="3" fill="url(#barProfitGrad)" />',
        '<!-- Mar -->',
        '<rect x="218" y="55" width="22" height="90" rx="3" fill="url(#barRevGrad)" />',
        '<rect x="244" y="94" width="22" height="51" rx="3" fill="url(#barProfitGrad)" />',
        '<!-- Apr -->',
        '<rect x="298" y="48" width="22" height="97" rx="3" fill="url(#barRevGrad)" />',
        '<rect x="324" y="87" width="22" height="58" rx="3" fill="url(#barProfitGrad)" />',
        '<!-- May Baseline -->',
        '<rect x="378" y="42" width="22" height="103" rx="3" fill="url(#barRevGrad)" />',
        '<rect x="404" y="80" width="22" height="65" rx="3" fill="url(#barProfitGrad)" />',
        '<!-- Jun Simulated Target -->',
        '<rect id="svg-bar-rev" x="458" y="' + revY + '" width="22" height="' + revH + '" rx="3" fill="var(--accent-primary)" />',
        '<rect x="458" y="' + revY + '" width="22" height="2" rx="1" fill="#FFFFFF" opacity="0.6" />',
        '<rect id="svg-bar-profit" x="484" y="' + profitY + '" width="22" height="' + profitH + '" rx="3" fill="var(--positive, #10B981)" />',
        '<rect x="484" y="' + profitY + '" width="22" height="2" rx="1" fill="#FFFFFF" opacity="0.6" />'
      ].join('\n');

    } else if (currentVisualMode === 'growth') {
      if (monthLabels) monthLabels.style.display = 'flex';
      var junGrowthH = Math.min(130, Math.max(20, (revenue / 200000) * 125));
      var junGrowthY = 145 - junGrowthH;
      
      svg.innerHTML = [
        '<defs>',
        '  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">',
        '    <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.35" />',
        '    <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.0" />',
        '  </linearGradient>',
        '</defs>',
        '<line x1="40" y1="25" x2="520" y2="25" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<line x1="40" y1="65" x2="520" y2="65" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<line x1="40" y1="105" x2="520" y2="105" stroke="var(--border-hairline)" stroke-dasharray="4,4" />',
        '<line x1="40" y1="145" x2="520" y2="145" stroke="var(--border-hairline)" />',
        '<!-- Growth Area -->',
        '<polygon points="69,145 69,72 149,64 229,56 309,50 389,42 470,' + junGrowthY + ' 470,145" fill="url(#areaGrad)" />',
        '<polyline points="69,72 149,64 229,56 309,50 389,42 470,' + junGrowthY + '" fill="none" stroke="var(--accent-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />',
        '<!-- Data Dots -->',
        '<circle cx="69" cy="72" r="4" fill="var(--accent-primary)" stroke="#FFFFFF" stroke-width="2" />',
        '<circle cx="149" cy="64" r="4" fill="var(--accent-primary)" stroke="#FFFFFF" stroke-width="2" />',
        '<circle cx="229" cy="56" r="4" fill="var(--accent-primary)" stroke="#FFFFFF" stroke-width="2" />',
        '<circle cx="309" cy="50" r="4" fill="var(--accent-primary)" stroke="#FFFFFF" stroke-width="2" />',
        '<circle cx="389" cy="42" r="4" fill="var(--accent-primary)" stroke="#FFFFFF" stroke-width="2" />',
        '<circle cx="470" cy="' + junGrowthY + '" r="6" fill="#10B981" stroke="#FFFFFF" stroke-width="2" />',
        '<text x="470" y="' + (junGrowthY - 10) + '" fill="var(--text-primary)" font-size="10" font-weight="bold" text-anchor="middle" font-family="monospace">' + formatINR(revenue) + '</text>'
      ].join('\n');

    } else if (currentVisualMode === 'gauge') {
      if (monthLabels) monthLabels.style.display = 'none';
      var attainPct = Math.min(150, Math.round((revenue / 180000) * 100));
      var strokeDash = (Math.min(100, attainPct) / 100) * 220;
      var statusColor = attainPct >= 100 ? '#10B981' : (attainPct >= 75 ? 'var(--accent-primary)' : '#F59E0B');
      var statusText = attainPct >= 100 ? 'Target Exceeded (Optimal Pace)' : (attainPct >= 75 ? 'On Track (Normal Velocity)' : 'Pace Warning (Needs Push)');

      svg.innerHTML = [
        '<g transform="translate(270, 130)">',
        '  <!-- Background Semicircle Arc -->',
        '  <path d="M -90 0 A 90 90 0 0 1 90 0" fill="none" stroke="var(--border-hairline)" stroke-width="14" stroke-linecap="round" />',
        '  <!-- Active Value Arc -->',
        '  <path d="M -90 0 A 90 90 0 0 1 90 0" fill="none" stroke="' + statusColor + '" stroke-width="14" stroke-dasharray="' + strokeDash + ', 300" stroke-linecap="round" />',
        '  <!-- Center KPI Readout -->',
        '  <text x="0" y="-24" text-anchor="middle" font-size="28" font-weight="800" fill="var(--text-primary)" font-family="monospace">' + attainPct + '%</text>',
        '  <text x="0" y="-6" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-muted)">OF ' + formatINR(180000) + ' BASELINE</text>',
        '  <text x="0" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="' + statusColor + '">' + statusText + '</text>',
        '</g>'
      ].join('\n');
    }
  }

  window.copyFormulaCode = function () {
    var codeEl = document.querySelector('.dax-pre-code');
    var text = codeEl ? codeEl.innerText : '';
    if (!text) return;

    var btn = document.querySelector('.code-copy-btn');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (btn) {
          var original = btn.innerHTML;
          btn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(function () { btn.innerHTML = original; }, 1800);
        }
        window.showToast("DAX calculated measure copied to clipboard!");
      });
    }
  };

  /* --------------------------------------------------------------------------
     7. DATA MODEL TOGGLE & SQL RUNNER
     -------------------------------------------------------------------------- */
  window.switchDataModelView = function (mode) {
    var btnRaw = document.getElementById('btn-view-raw');
    var btnSchema = document.getElementById('btn-view-schema');
    var containerRaw = document.getElementById('container-view-raw');
    var containerSchema = document.getElementById('container-view-schema');

    if (!btnRaw || !btnSchema || !containerRaw || !containerSchema) return;

    if (mode === 'schema') {
      btnSchema.classList.add('active');
      btnSchema.setAttribute('aria-selected', 'true');
      btnRaw.classList.remove('active');
      btnRaw.setAttribute('aria-selected', 'false');
      containerSchema.style.display = 'block';
      containerRaw.style.display = 'none';
    } else {
      btnRaw.classList.add('active');
      btnRaw.setAttribute('aria-selected', 'true');
      btnSchema.classList.remove('active');
      btnSchema.setAttribute('aria-selected', 'false');
      containerRaw.style.display = 'block';
      containerSchema.style.display = 'none';
    }
  };

  window.highlightSchemaFK = function (dim) {
    var fkCust = document.getElementById('fk-cust-line');
    var fkProd = document.getElementById('fk-prod-line');
    var fkDate = document.getElementById('fk-date-line');
    
    [fkCust, fkProd, fkDate].forEach(function (el) {
      if (el) el.style.background = 'transparent';
    });

    if (dim === 'cust' && fkCust) {
      fkCust.style.background = 'rgba(37, 99, 235, 0.18)';
    } else if (dim === 'prod' && fkProd) {
      fkProd.style.background = 'rgba(16, 185, 129, 0.18)';
    } else if (dim === 'date' && fkDate) {
      fkDate.style.background = 'rgba(245, 158, 11, 0.18)';
    }
  };

  var sqlSandboxQueries = {
    1: "-- Query 1: Sales Fact Table Aggregation\nSELECT \n    p.category_name, \n    COUNT(s.order_id) AS total_orders,\n    SUM(s.order_amount) AS gross_sales,\n    ROUND(AVG(s.margin_pct), 2) AS avg_margin\nFROM sales_fact s\nJOIN dim_product p ON s.product_id = p.product_id\nGROUP BY p.category_name;\n----------------------------------------------------------------------\n> Electronics    | 480 orders | ₹7,45,000 | 29.5% margin\n> Commercial     | 320 orders | ₹5,12,800 | 33.2% margin\n> Office Supplies| 620 orders | ₹2,18,400 | 24.1% margin\n[Query executed in 0.0018 seconds · Ready for Star Schema DirectQuery]",
    2: "-- Query 2: Star Schema 3NF Customer & Date Dimension Join\nSELECT \n    c.city,\n    d.fiscal_month,\n    COUNT(DISTINCT s.customer_key) AS active_buyers,\n    ROUND(SUM(s.order_revenue), 2) AS regional_revenue\nFROM fact_sales s\nJOIN dim_customer c ON s.customer_key = c.customer_key\nJOIN dim_date d ON s.date_key = d.date_key\nGROUP BY c.city, d.fiscal_month\nORDER BY regional_revenue DESC;\n----------------------------------------------------------------------\n> Chennai   | May 2026 | 312 buyers | ₹8,42,100\n> Bangalore | May 2026 | 284 buyers | ₹6,89,500\n> Hyderabad | May 2026 | 196 buyers | ₹4,21,800\n[Query executed in 0.0021 seconds · 3NF Indexes Validated]",
    3: "-- Query 3: Monthly Target Margin Attainment\nSELECT \n    p.category_name,\n    p.target_margin_pct,\n    ROUND(AVG(s.gross_margin / s.order_revenue) * 100, 1) AS actual_margin_pct,\n    CASE \n        WHEN AVG(s.gross_margin / s.order_revenue) >= p.target_margin_pct / 100 THEN 'TARGET MET'\n        ELSE 'BELOW TARGET'\n    END AS attainment_flag\nFROM fact_sales s\nJOIN dim_product p ON s.product_key = p.product_key\nGROUP BY p.category_name, p.target_margin_pct;\n----------------------------------------------------------------------\n> Hardware & IT         | 35.0% Target | 35.6% Actual | [TARGET MET]\n> Electronics           | 30.0% Target | 32.4% Actual | [TARGET MET]\n> Commercial Supplies   | 30.0% Target | 28.1% Actual | [BELOW TARGET]\n[Query executed in 0.0016 seconds · DAX Variance Aligned]"
  };

  window.runSQLTest = function (testId) {
    var btns = document.querySelectorAll('.sql-preset-btn');
    btns.forEach(function (b, idx) {
      b.classList.toggle('active', (idx + 1) === testId);
    });

    var consoleZone = document.getElementById('sql-console-zone');
    if (consoleZone && sqlSandboxQueries[testId]) {
      consoleZone.textContent = sqlSandboxQueries[testId];
    }
  };

  window.runSqlQuery = function (testId) {
    window.runSQLTest(testId || 1);
  };

  window.launchPowerBIEmbed = function () {
    var overlay = document.getElementById('pbi-launch-overlay');
    var container = document.getElementById('pbi-interactive-container');
    if (overlay) overlay.style.display = 'none';
    if (container) {
      container.style.display = 'block';
      container.innerHTML = [
        '<div class="pbi-live-interactive-panel" style="padding:16px; background:var(--bg-card); border-radius:12px; border:1px solid var(--border-subtle); margin-top:12px;">',
        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">',
        '    <div style="display:flex; align-items:center; gap:8px;">',
        '      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>',
        '      <strong style="font-size:13px; color:var(--text-primary);">LIVE INTERACTIVE POWER BI PRO SIMULATOR</strong>',
        '    </div>',
        '    <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono, monospace);">DirectQuery · MySQL 8.0 · 60fps Native</div>',
        '  </div>',
        '  <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">',
        '    <span style="font-size:11px; font-weight:700; color:var(--text-muted); align-self:center;">REGION SLICER:</span>',
        '    <button type="button" class="btn btn-outline pbi-slicer-btn active" style="padding:4px 10px; font-size:11px; height:28px;" onclick="slicePbiData(\'All\', this)">All Regions</button>',
        '    <button type="button" class="btn btn-outline pbi-slicer-btn" style="padding:4px 10px; font-size:11px; height:28px;" onclick="slicePbiData(\'Chennai\', this)">Chennai</button>',
        '    <button type="button" class="btn btn-outline pbi-slicer-btn" style="padding:4px 10px; font-size:11px; height:28px;" onclick="slicePbiData(\'Bangalore\', this)">Bangalore</button>',
        '  </div>',
        '  <div id="pbi-sliced-metrics" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">',
        '    <div style="background:var(--bg-subtle); padding:10px; border-radius:8px; border:1px solid var(--border-hairline);">',
        '      <span style="font-size:10px; color:var(--text-muted); display:block;">SLICED REVENUE</span>',
        '      <strong id="pbi-slice-rev" class="mono" style="font-size:16px; color:var(--text-primary);">₹18,45,200</strong>',
        '    </div>',
        '    <div style="background:var(--bg-subtle); padding:10px; border-radius:8px; border:1px solid var(--border-hairline);">',
        '      <span style="font-size:10px; color:var(--text-muted); display:block;">SLICED ORDERS</span>',
        '      <strong id="pbi-slice-orders" class="mono" style="font-size:16px; color:var(--accent-primary);">12,480</strong>',
        '    </div>',
        '    <div style="background:var(--bg-subtle); padding:10px; border-radius:8px; border:1px solid var(--border-hairline);">',
        '      <span style="font-size:10px; color:var(--text-muted); display:block;">AVG MARGIN</span>',
        '      <strong id="pbi-slice-margin" class="mono" style="font-size:16px; color:var(--accent-green, #10B981);">32.4%</strong>',
        '    </div>',
        '  </div>',
        '  <div style="text-align:right;">',
        '    <button type="button" class="btn btn-outline" style="font-size:11px; height:28px; padding:0 10px;" onclick="resetPowerBIEmbed()">↺ Reset to Static Facade</button>',
        '  </div>',
        '</div>'
      ].join('\n');
    }
  };

  window.slicePbiData = function (region, btn) {
    var btns = document.querySelectorAll('.pbi-slicer-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    var revEl = document.getElementById('pbi-slice-rev');
    var ordersEl = document.getElementById('pbi-slice-orders');
    var marginEl = document.getElementById('pbi-slice-margin');

    if (region === 'Chennai') {
      if (revEl) revEl.textContent = '₹9,84,500';
      if (ordersEl) ordersEl.textContent = '6,420';
      if (marginEl) marginEl.textContent = '33.8%';
    } else if (region === 'Bangalore') {
      if (revEl) revEl.textContent = '₹8,60,700';
      if (ordersEl) ordersEl.textContent = '6,060';
      if (marginEl) marginEl.textContent = '31.2%';
    } else {
      if (revEl) revEl.textContent = '₹18,45,200';
      if (ordersEl) ordersEl.textContent = '12,480';
      if (marginEl) marginEl.textContent = '32.4%';
    }
  };

  window.resetPowerBIEmbed = function () {
    var overlay = document.getElementById('pbi-launch-overlay');
    var container = document.getElementById('pbi-interactive-container');
    if (overlay) overlay.style.display = 'flex';
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  };

  /* --------------------------------------------------------------------------
     7B. REGIONAL PERFORMANCE REPORT INTERACTIVITY & CROSS-FILTERING
     -------------------------------------------------------------------------- */
  function formatLakhs(val) {
    if (isNaN(val) || val === null || val === undefined) return '₹0.00L';
    return '₹' + (val / 100000).toFixed(2) + 'L';
  }

  function updateRegionalPerformanceMetrics(revenue, marginPct) {
    if (isNaN(revenue)) revenue = 180000;
    if (isNaN(marginPct)) marginPct = 0.32;

    var ratio = revenue / 180000;
    var blrRev = 689500 * ratio;
    var chnRev = 584200 * ratio;
    var cbeRev = 342800 * ratio;
    var hydRev = 228700 * ratio;
    var totalRev = 1845200 * ratio;

    // Bar Top Value Labels
    var valBlr = document.getElementById('bar-val-blr');
    var valChn = document.getElementById('bar-val-chn');
    var valCbe = document.getElementById('bar-val-cbe');
    var valHyd = document.getElementById('bar-val-hyd');
    if (valBlr) valBlr.innerHTML = formatLakhs(blrRev) + ' <span class="bar-share-pct">37.4%</span>';
    if (valChn) valChn.innerHTML = formatLakhs(chnRev) + ' <span class="bar-share-pct">31.7%</span>';
    if (valCbe) valCbe.innerHTML = formatLakhs(cbeRev) + ' <span class="bar-share-pct">18.6%</span>';
    if (valHyd) valHyd.innerHTML = formatLakhs(hydRev) + ' <span class="bar-share-pct">12.4%</span>';

    // Hover Tooltip Revenue Displays
    var tipBlr = document.getElementById('tip-rev-blr');
    var tipChn = document.getElementById('tip-rev-chn');
    var tipCbe = document.getElementById('tip-rev-cbe');
    var tipHyd = document.getElementById('tip-rev-hyd');
    if (tipBlr) tipBlr.textContent = formatINR(blrRev);
    if (tipChn) tipChn.textContent = formatINR(chnRev);
    if (tipCbe) tipCbe.textContent = formatINR(cbeRev);
    if (tipHyd) tipHyd.textContent = formatINR(hydRev);

    // Lower Drill-Down Matrix Table Revenues
    var tdBlr = document.getElementById('td-rev-blr');
    var tdChn = document.getElementById('td-rev-chn');
    var tdCbe = document.getElementById('td-rev-cbe');
    var tdHyd = document.getElementById('td-rev-hyd');
    var tdTotal = document.getElementById('td-total-rev');
    if (tdBlr) tdBlr.textContent = formatINR(blrRev);
    if (tdChn) tdChn.textContent = formatINR(chnRev);
    if (tdCbe) tdCbe.textContent = formatINR(cbeRev);
    if (tdHyd) tdHyd.textContent = formatINR(hydRev);
    if (tdTotal) tdTotal.textContent = formatINR(totalRev);

    // Right Card: Category Gross Margin Breakdown
    var baseMargin = marginPct * 100;
    var elecMargin = (baseMargin + 0.4).toFixed(1);
    var commMargin = (baseMargin - 3.9).toFixed(1);
    var hardMargin = (baseMargin + 3.6).toFixed(1);

    var elElecMargin = document.getElementById('cat-margin-electronics');
    var elElecDiff = document.getElementById('cat-diff-electronics');
    var elElecBar = document.getElementById('cat-bar-electronics');
    if (elElecMargin) elElecMargin.textContent = elecMargin + '%';
    if (elElecDiff) {
      var diffE = (parseFloat(elecMargin) - 30.0).toFixed(1);
      elElecDiff.textContent = (diffE >= 0 ? '+' : '') + diffE + '% vs Target';
      elElecDiff.className = 'target-diff-pill ' + (diffE >= 0 ? 'text-green' : 'text-amber');
    }
    if (elElecBar) elElecBar.style.width = Math.min(100, Math.max(0, parseFloat(elecMargin) * 2)) + '%';

    var elCommMargin = document.getElementById('cat-margin-commercial');
    var elCommDiff = document.getElementById('cat-diff-commercial');
    var elCommBar = document.getElementById('cat-bar-commercial');
    if (elCommMargin) elCommMargin.textContent = commMargin + '%';
    if (elCommDiff) {
      var diffC = (parseFloat(commMargin) - 30.0).toFixed(1);
      elCommDiff.textContent = (diffC >= 0 ? '+' : '') + diffC + '% vs Target';
      elCommDiff.className = 'target-diff-pill ' + (diffC >= 0 ? 'text-green' : 'text-amber');
    }
    if (elCommBar) elCommBar.style.width = Math.min(100, Math.max(0, parseFloat(commMargin) * 2)) + '%';

    var elHardMargin = document.getElementById('cat-margin-hardware');
    var elHardDiff = document.getElementById('cat-diff-hardware');
    var elHardBar = document.getElementById('cat-bar-hardware');
    if (elHardMargin) elHardMargin.textContent = hardMargin + '%';
    if (elHardDiff) {
      var diffH = (parseFloat(hardMargin) - 35.0).toFixed(1);
      elHardDiff.textContent = (diffH >= 0 ? '+' : '') + diffH + '% vs Target';
      elHardDiff.className = 'target-diff-pill ' + (diffH >= 0 ? 'text-green' : 'text-amber');
    }
    if (elHardBar) elHardBar.style.width = Math.min(100, Math.max(0, parseFloat(hardMargin) * 2)) + '%';
  }

  var selectedRegionState = 'All';

  window.sliceRegionalData = function (region, btn) {
    selectedRegionState = region || 'All';

    // 1. Update Slicer Pills
    var pills = document.querySelectorAll('.hub-slicer-pill');
    pills.forEach(function (p) {
      p.classList.remove('active');
    });
    if (btn) {
      btn.classList.add('active');
    } else {
      var targetId = 'slicer-' + (region === 'All' ? 'all' : (region === 'Bangalore' ? 'blr' : (region === 'Chennai' ? 'chn' : (region === 'Coimbatore' ? 'cbe' : 'hyd'))));
      var activePill = document.getElementById(targetId);
      if (activePill) activePill.classList.add('active');
    }

    // 2. Cross-Highlight Chart Bar Columns
    var bars = [
      { id: 'bar-col-blr', region: 'Bangalore' },
      { id: 'bar-col-chn', region: 'Chennai' },
      { id: 'bar-col-cbe', region: 'Coimbatore' },
      { id: 'bar-col-hyd', region: 'Hyderabad' }
    ];

    bars.forEach(function (item) {
      var col = document.getElementById(item.id);
      if (!col) return;
      if (selectedRegionState === 'All') {
        col.classList.remove('dimmed');
        col.classList.remove('active');
      } else if (item.region.toLowerCase() === selectedRegionState.toLowerCase()) {
        col.classList.remove('dimmed');
        col.classList.add('active');
      } else {
        col.classList.remove('active');
        col.classList.add('dimmed');
      }
    });

    // 3. Cross-Highlight Table Rows
    var rows = [
      { id: 'row-bangalore', region: 'Bangalore' },
      { id: 'row-chennai', region: 'Chennai' },
      { id: 'row-coimbatore', region: 'Coimbatore' },
      { id: 'row-hyderabad', region: 'Hyderabad' }
    ];

    rows.forEach(function (item) {
      var r = document.getElementById(item.id);
      if (!r) return;
      if (selectedRegionState === 'All') {
        r.classList.remove('active');
        r.classList.remove('dimmed');
      } else if (item.region.toLowerCase() === selectedRegionState.toLowerCase()) {
        r.classList.add('active');
        r.classList.remove('dimmed');
      } else {
        r.classList.remove('active');
        r.classList.add('dimmed');
      }
    });

    // 4. Update Status Indicators
    var filterStatus = document.getElementById('table-filter-status');
    if (filterStatus) {
      if (selectedRegionState === 'All') {
        filterStatus.textContent = 'Filter: All Hubs (Active)';
      } else {
        filterStatus.textContent = 'Filter: ' + selectedRegionState + ' Hub (Active)';
      }
    }

    var topPerformerText = document.getElementById('top-performer-text');
    if (topPerformerText) {
      if (selectedRegionState === 'All') {
        topPerformerText.textContent = 'Top Hub: Bangalore';
      } else if (selectedRegionState === 'Bangalore') {
        topPerformerText.textContent = 'Top Hub: Bangalore (Selected)';
      } else {
        topPerformerText.textContent = 'Selected Hub: ' + selectedRegionState;
      }
    }
  };

  window.selectRegion = function (region) {
    if (selectedRegionState.toLowerCase() === (region || '').toLowerCase()) {
      window.sliceRegionalData('All');
    } else {
      window.sliceRegionalData(region);
    }
  };

  window.resetRegionalFilter = function () {
    window.sliceRegionalData('All');
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
      "- Automated Power Query M-code ETL pipelines, cutting reporting turnaround by 40%.",
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

  /* --------------------------------------------------------------------------
     10b. CONTACT FORM, ANTI-SPAM & SESSION DRAFTS
     -------------------------------------------------------------------------- */
  function hasSentEmailThisSession() {
    try {
      if (sessionStorage.getItem('sa_email_sent') === '1') return true;
      var match = document.cookie.match(/(?:^|;\s*)sa_email_sent=([^;]*)/);
      if (match && match[1] === '1') return true;
    } catch (e) {}
    return false;
  }

  function markEmailSentThisSession() {
    try {
      sessionStorage.setItem('sa_email_sent', '1');
      document.cookie = "sa_email_sent=1; SameSite=Strict; Secure; path=/";
    } catch (e) {}
  }

  function sanitizeInput(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
  }

  window.handleContactSubmit = function (form) {
    var feedback = document.getElementById('contact-status-feedback');
    if (feedback) {
      feedback.style.display = 'none';
      feedback.textContent = '';
      feedback.className = '';
    }

    // 1. Invisible honeypot anti-bot trap check
    if (form._hp_trap && form._hp_trap.value) {
      console.warn("Spam bot submission blocked via honeypot trap.");
      return false;
    }

    // 2. Duplicate submission prevention via session state & cookie
    if (hasSentEmailThisSession()) {
      var dupMsg = "Message already sent in this session. Please check your inbox or try again later.";
      if (feedback) {
        feedback.textContent = dupMsg;
        feedback.className = 'contact-status-warning';
        feedback.style.display = 'block';
      }
      window.showToast(dupMsg);
      return false;
    }

    // 3. Privacy consent check
    if (form.privacy_consent && !form.privacy_consent.checked) {
      var consentMsg = "Please agree to the Privacy Policy & Terms to proceed.";
      if (feedback) {
        feedback.textContent = consentMsg;
        feedback.className = 'contact-status-error';
        feedback.style.display = 'block';
      }
      window.showToast(consentMsg);
      return false;
    }

    // 4. Input sanitization (strip HTML tags)
    var rawName = form.name ? form.name.value : '';
    var rawEmail = form.email ? form.email.value : '';
    var rawMsg = form.message ? form.message.value : '';

    var name = sanitizeInput(rawName);
    var email = sanitizeInput(rawEmail);
    var message = sanitizeInput(rawMsg);

    if (!email || !message) {
      var reqMsg = "Please provide your email address and message details.";
      if (feedback) {
        feedback.textContent = reqMsg;
        feedback.className = 'contact-status-error';
        feedback.style.display = 'block';
      }
      return false;
    }

    // 5. Mark session anti-spam
    markEmailSentThisSession();

    // 6. Clear session draft
    try {
      sessionStorage.removeItem('sa_contact_draft');
    } catch (e) {}

    // 7. Compose direct Gmail draft
    var subject = encodeURIComponent("Data Analytics & BI Opportunity — " + (name || "Recruiter"));
    var body = encodeURIComponent("From: " + (name || "Recruiter") + " (" + email + ")\n\nMessage / Opportunity Details:\n" + message);
    var gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=sanjairam1179@gmail.com&su=" + subject + "&body=" + body;

    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    window.showToast("Opening pre-filled Gmail draft...");

    if (feedback) {
      feedback.textContent = "Gmail draft launched! Thank you for getting in touch.";
      feedback.className = 'contact-status-success';
      feedback.style.display = 'block';
    }

    // Disable button to prevent spamming
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
      submitBtn.style.cursor = 'not-allowed';
    }

    form.reset();
    return false;
  };

  function initContactDrafts() {
    var nameInput = document.getElementById('sender-name-input');
    var emailInput = document.getElementById('sender-email-input');
    var msgInput = document.getElementById('sender-msg-input');
    var form = document.querySelector('.contact-card-form');

    if (!form || !nameInput || !emailInput || !msgInput) return;

    // Check if duplicate already sent in session
    if (hasSentEmailThisSession()) {
      var feedback = document.getElementById('contact-status-feedback');
      if (feedback) {
        feedback.textContent = "Message already sent in this session. Please check your inbox or try again later.";
        feedback.className = 'contact-status-warning';
        feedback.style.display = 'block';
      }
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
      }
      return;
    }

    // Restore draft if present
    try {
      var saved = sessionStorage.getItem('sa_contact_draft');
      if (saved) {
        var data = JSON.parse(saved);
        if (data.name) nameInput.value = data.name;
        if (data.email) emailInput.value = data.email;
        if (data.message) msgInput.value = data.message;
      }
    } catch (e) {}

    function saveDraft() {
      try {
        var draft = {
          name: nameInput.value,
          email: emailInput.value,
          message: msgInput.value
        };
        sessionStorage.setItem('sa_contact_draft', JSON.stringify(draft));
      } catch (e) {}
    }

    nameInput.addEventListener('input', saveDraft);
    emailInput.addEventListener('input', saveDraft);
    msgInput.addEventListener('input', saveDraft);

    form.addEventListener('reset', function () {
      try {
        sessionStorage.removeItem('sa_contact_draft');
      } catch (e) {}
    });
  }

  /* --------------------------------------------------------------------------
     10c. COOKIE CONSENT BANNER & LEGAL MODALS
     -------------------------------------------------------------------------- */
  window.initCookieConsent = function () {
    var banner = document.getElementById('cookie-consent-banner');
    if (!banner) return;
    try {
      var consent = localStorage.getItem('sa_cookie_consent');
      var dismissed = sessionStorage.getItem('sa_cookie_dismissed');
      if (consent || dismissed === '1') {
        banner.style.display = 'none';
      } else {
        banner.style.display = 'block';
      }
    } catch (e) {
      banner.style.display = 'block';
    }
  };

  window.acceptCookies = function (type) {
    try {
      localStorage.setItem('sa_cookie_consent', type || 'accepted');
    } catch (e) {}
    var banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.add('fade-out');
      setTimeout(function () { banner.style.display = 'none'; }, 280);
    }
    window.showToast("Cookie preferences saved.");
  };

  window.closeCookieBanner = function () {
    try {
      sessionStorage.setItem('sa_cookie_dismissed', '1');
    } catch (e) {}
    var banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.add('fade-out');
      setTimeout(function () { banner.style.display = 'none'; }, 280);
    }
  };

  window.openPrivacyModal = function () {
    window.openModal('modal-privacy-policy');
  };

  window.closePrivacyModal = function () {
    window.closeModal('modal-privacy-policy');
  };

  window.openTermsModal = function () {
    window.openModal('modal-terms-conditions');
  };

  window.closeTermsModal = function () {
    window.closeModal('modal-terms-conditions');
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
    initContactDrafts();
    window.initCookieConsent();

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
