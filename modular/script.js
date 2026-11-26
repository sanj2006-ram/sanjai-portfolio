/**
 * SANJAI RAM M — EDITORIAL BI & ANALYTICS PORTFOLIO JAVASCRIPT
 * Zero GPU Lag · Real-time DAX Binding · Star Schema Interactivity · Recruiter Tools
 */

(function () {
  'use strict';

  // State Management
  var currentVisualMode = 'bars';
  var lastMarginVal = 32;
  var lastRetVal = 40;

  // Format INR Currency
  function formatINR(val) {
    var str = Math.round(val).toString();
    var lastThree = str.substring(str.length - 3);
    var otherNumbers = str.substring(0, str.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    return '₹' + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  }

  // Toast Notification System
  window.showToast = function (message) {
    var pill = document.getElementById('toast-message-pill');
    if (!pill) return;
    pill.textContent = message;
    pill.classList.add('active');
    clearTimeout(pill._timer);
    pill._timer = setTimeout(function () {
      pill.classList.remove('active');
    }, 2400);
  };

  // Copy Helpers
  window.copyContact = function (text, successMsg) {
    navigator.clipboard.writeText(text).then(function () {
      window.showToast(successMsg || 'Copied to clipboard!');
    }).catch(function () {
      window.showToast('Copied: ' + text);
    });
  };

  window.copyFormulaCode = function () {
    var marginInput = document.getElementById('range-margin');
    var retInput = document.getElementById('range-ret');
    var marginDec = (parseFloat(marginInput ? marginInput.value : 32) / 100).toFixed(2);
    var retDec = (parseFloat(retInput ? retInput.value : 40) / 100).toFixed(2);

    var daxText = '// Realtime Power BI DAX Expression:\n' +
      'Projected_Profit = \n' +
      'CALCULATE(\n' +
      '    SUM(Fact_Sales[Revenue]) * ' + marginDec + ',\n' +
      '    FILTER(\n' +
      '        Dim_Customer,\n' +
      '        Dim_Customer[RetentionRate] >= ' + retDec + '\n' +
      '    )\n' +
      ')';

    navigator.clipboard.writeText(daxText).then(function () {
      window.showToast('DAX formula copied to clipboard!');
    }).catch(function () {
      window.showToast('DAX copied!');
    });
  };

  window.copyResumeText = function () {
    var plainResume = [
      'SANJAI RAM M',
      'Data Analyst & Business Intelligence Specialist',
      'Location: Chennai, Tamil Nadu, India',
      'Email: sanjairam1179@gmail.com | Phone: +91 ******0179',
      'GitHub: https://github.com/sanj2006-ram',
      '',
      'PROFESSIONAL SUMMARY',
      'B.Com (Computer Applications) student at Guru Nanak College, Chennai, with verified internship experience in business intelligence, data modeling, and ETL engineering. Experienced in ingesting and normalizing 12,000+ sales records into 3NF MySQL databases, automating Power Query transformations, and developing production Power BI dashboards with DAX measures that reduced weekly reporting turnaround by 40%.',
      '',
      'TECHNICAL PROFICIENCIES',
      '- Business Intelligence: Power BI Desktop, Power BI Service, DAX Measures (CALCULATE, Time Intelligence), Report Design, Star Schema Modeling',
      '- Databases & ETL: MySQL 8.0, 3NF Normalization, Complex Joins, CTEs, Window Functions, Power Query M-Code',
      '- Finance & Analytics: B.Com Financial Accounting, Trial Balance, General Ledgers, Variance Analysis, Tally Prime, Advanced Excel (XLOOKUP, Power Pivot)',
      '',
      'PROFESSIONAL EXPERIENCE',
      'Data Analytics & BI Intern — Izeon Innovative Pvt Ltd (2024 - 2025 | Chennai, India)',
      '- Ingested and normalized 12,000+ transactional sales records into a 3NF MySQL database.',
      '- Automated Power Query M-code ETL workflows to eliminate duplicates and standardize currencies.',
      '- Constructed interactive Power BI reporting models featuring 18+ DAX calculated measures, cutting weekly reporting turnaround by 40%.',
      '- Conducted regional sales variance analyses to isolate gross margin leakages.',
      '',
      'EDUCATION',
      'Bachelor of Commerce in Computer Applications — B.Com (CA) (2024 - 2027)',
      'Guru Nanak College (Autonomous), Velachery, Chennai'
    ].join('\n');

    navigator.clipboard.writeText(plainResume).then(function () {
      var label = document.getElementById('copy-resume-btn-label');
      if (label) {
        label.textContent = 'Copied Plain Text!';
        setTimeout(function () { label.textContent = 'Copy Plain Text'; }, 2000);
      }
      window.showToast('Full plain-text ATS resume copied!');
    });
  };

  // Flash DAX Parameter on slider move
  function flashDaxParam(el) {
    if (!el) return;
    el.classList.add('dax-flash');
    clearTimeout(el._flashTimer);
    el._flashTimer = setTimeout(function () {
      el.classList.remove('dax-flash');
    }, 350);
  }

  // Recalculate Simulation and Bind to DAX & Chart
  window.recalculateSimulation = function () {
    var rangeRev = document.getElementById('range-rev');
    var rangeMargin = document.getElementById('range-margin');
    var rangeRet = document.getElementById('range-ret');

    if (!rangeRev || !rangeMargin || !rangeRet) return;

    var rev = parseFloat(rangeRev.value);
    var margin = parseFloat(rangeMargin.value);
    var ret = parseFloat(rangeRet.value);

    // Update Slider Labels
    var dispRev = document.getElementById('ctrl-rev-display');
    var dispMargin = document.getElementById('ctrl-margin-display');
    var dispRet = document.getElementById('ctrl-ret-display');

    if (dispRev) dispRev.textContent = formatINR(rev);
    if (dispMargin) dispMargin.textContent = margin + '%';
    if (dispRet) dispRet.textContent = ret + '%';

    // Calculate Derived KPIs
    var profit = rev * (margin / 100);
    var retentionGmv = rev * (ret / 100);
    var targetAttainment = Math.round((rev / 160000) * 100);

    // Update KPI Scorecards
    var kpiRev = document.getElementById('kpi-gross-rev');
    var kpiMargin = document.getElementById('kpi-margin-pct');
    var kpiProfit = document.getElementById('kpi-net-profit');
    var kpiRetGmv = document.getElementById('kpi-retention-gmv');
    var kpiDelta = document.getElementById('kpi-gross-delta');

    if (kpiRev) kpiRev.textContent = formatINR(rev);
    if (kpiMargin) kpiMargin.textContent = margin.toFixed(1) + '%';
    if (kpiProfit) kpiProfit.textContent = formatINR(profit);
    if (kpiRetGmv) kpiRetGmv.textContent = formatINR(retentionGmv);
    if (kpiDelta) {
      var diff = targetAttainment - 100;
      kpiDelta.textContent = (diff >= 0 ? '+' : '') + diff + '% Target Attainment';
    }

    // Dynamic DAX Parameter Binding
    var daxMarginParam = document.getElementById('dax-margin-param');
    var daxRetParam = document.getElementById('dax-retention-param');

    if (daxMarginParam) {
      var marginDec = (margin / 100).toFixed(2);
      daxMarginParam.textContent = marginDec;
      if (margin !== lastMarginVal) {
        flashDaxParam(daxMarginParam);
        lastMarginVal = margin;
      }
    }

    if (daxRetParam) {
      var retDec = (ret / 100).toFixed(2);
      daxRetParam.textContent = retDec;
      if (ret !== lastRetVal) {
        flashDaxParam(daxRetParam);
        lastRetVal = ret;
      }
    }

    // Update SVG Visual based on active visual mode
    updateChartCanvas(rev, profit, targetAttainment);
  };

  function updateChartCanvas(rev, profit, targetAttainment) {
    // 1. Bar Chart updates
    var revBar = document.getElementById('chart-bar-rev-active');
    var profitBar = document.getElementById('chart-bar-profit-active');

    if (revBar && profitBar) {
      // Scale revenue: 50,000 -> height 40; 500,000 -> height 140
      var revHeight = 40 + ((rev - 50000) / 450000) * 100;
      var revY = 145 - revHeight;
      revBar.setAttribute('height', Math.round(revHeight));
      revBar.setAttribute('y', Math.round(revY));

      // Scale profit relative to revenue
      var profitHeight = revHeight * (profit / rev);
      var profitY = 145 - profitHeight;
      profitBar.setAttribute('height', Math.round(profitHeight));
      profitBar.setAttribute('y', Math.round(profitY));
    }

    // 2. Growth Area Polygon updates
    var areaPoly = document.getElementById('chart-area-polygon');
    var areaLine = document.getElementById('chart-area-line');
    var areaPoint = document.getElementById('chart-area-point');

    if (areaPoly && areaLine && areaPoint) {
      var ptY = Math.round(145 - (35 + ((rev - 50000) / 450000) * 105));
      var polyPoints = '60,145 60,75 145,55 230,45 315,48 400,32 485,' + ptY + ' 485,145';
      var linePoints = '60,75 145,55 230,45 315,48 400,32 485,' + ptY;
      areaPoly.setAttribute('points', polyPoints);
      areaLine.setAttribute('points', linePoints);
      areaPoint.setAttribute('cy', ptY);
    }

    // 3. Gauge Updates
    var gaugeText = document.getElementById('gauge-pct-text');
    var gaugeFill = document.getElementById('gauge-circle-fill');
    var gaugeProj = document.getElementById('gauge-projected-val');
    var gaugeSurplus = document.getElementById('gauge-surplus-val');

    if (gaugeText) gaugeText.textContent = targetAttainment + '%';
    if (gaugeFill) {
      // pathLength 100: offset 100 = 0% filled; offset 0 = 100% filled
      var offset = Math.max(0, 100 - targetAttainment);
      gaugeFill.setAttribute('stroke-dashoffset', offset);
    }
    if (gaugeProj) gaugeProj.textContent = formatINR(rev);
    if (gaugeSurplus) {
      var surplus = rev - 160000;
      if (surplus >= 0) {
        gaugeSurplus.textContent = '+' + formatINR(surplus) + ' Surplus';
        gaugeSurplus.style.color = 'var(--accent-green)';
      } else {
        gaugeSurplus.textContent = '-' + formatINR(Math.abs(surplus)) + ' Gap';
        gaugeSurplus.style.color = 'var(--accent-amber)';
      }
    }
  }

  // Switch Visual Mode (Bars / Growth / Gauge)
  window.switchVisualMode = function (mode) {
    currentVisualMode = mode;
    var barsTab = document.getElementById('tab-mode-bars');
    var growthTab = document.getElementById('tab-mode-growth');
    var gaugeTab = document.getElementById('tab-mode-gauge');

    var barsGroup = document.getElementById('chart-bars-group');
    var areaGroup = document.getElementById('chart-area-group');
    var gaugeGroup = document.getElementById('chart-gauge-group');
    var monthLabels = document.getElementById('chart-month-labels');

    if (barsTab) barsTab.classList.remove('active');
    if (growthTab) growthTab.classList.remove('active');
    if (gaugeTab) gaugeTab.classList.remove('active');

    if (barsGroup) barsGroup.style.display = 'none';
    if (areaGroup) areaGroup.style.display = 'none';
    if (gaugeGroup) gaugeGroup.style.display = 'none';

    if (mode === 'bars') {
      if (barsTab) barsTab.classList.add('active');
      if (barsGroup) barsGroup.style.display = 'inline';
      if (monthLabels) monthLabels.style.display = 'flex';
    } else if (mode === 'growth') {
      if (growthTab) growthTab.classList.add('active');
      if (areaGroup) areaGroup.style.display = 'inline';
      if (monthLabels) monthLabels.style.display = 'flex';
    } else if (mode === 'gauge') {
      if (gaugeTab) gaugeTab.classList.add('active');
      if (gaugeGroup) gaugeGroup.style.display = 'inline';
      if (monthLabels) monthLabels.style.display = 'none';
    }

    window.recalculateSimulation();
  };

  // Switch Data Model View (Raw Messy CSV vs. Normalized 3NF Schema)
  window.switchDataModelView = function (mode) {
    var btnRaw = document.getElementById('btn-view-raw');
    var btnSchema = document.getElementById('btn-view-schema');
    var zoneRaw = document.getElementById('container-view-raw');
    var zoneSchema = document.getElementById('container-view-schema');

    if (!btnRaw || !btnSchema || !zoneRaw || !zoneSchema) return;

    if (mode === 'raw') {
      btnRaw.classList.add('active');
      btnRaw.setAttribute('aria-selected', 'true');
      btnSchema.classList.remove('active');
      btnSchema.setAttribute('aria-selected', 'false');

      zoneRaw.style.display = 'block';
      zoneSchema.style.display = 'none';
    } else {
      btnSchema.classList.add('active');
      btnSchema.setAttribute('aria-selected', 'true');
      btnRaw.classList.remove('active');
      btnRaw.setAttribute('aria-selected', 'false');

      zoneSchema.style.display = 'block';
      zoneRaw.style.display = 'none';
    }
  };

  // Trace and Highlight Foreign Key on Dimension Click
  window.highlightSchemaFK = function (dimKey) {
    var fkCust = document.getElementById('fk-cust-line');
    var fkProd = document.getElementById('fk-prod-line');
    var fkDate = document.getElementById('fk-date-line');

    if (fkCust) fkCust.classList.remove('fk-highlighted');
    if (fkProd) fkProd.classList.remove('fk-highlighted');
    if (fkDate) fkDate.classList.remove('fk-highlighted');

    var targetEl = null;
    var name = '';

    if (dimKey === 'cust') {
      targetEl = fkCust;
      name = 'CustomerKey (FK)';
    } else if (dimKey === 'prod') {
      targetEl = fkProd;
      name = 'ProductKey (FK)';
    } else if (dimKey === 'date') {
      targetEl = fkDate;
      name = 'DateKey (FK)';
    }

    if (targetEl) {
      targetEl.classList.add('fk-highlighted');
      window.showToast('Highlighted ' + name + ' in Fact_Sales');
    }
  };

  // Zero-Lag Power BI Embed Facade Launcher
  window.launchPowerBIEmbed = function () {
    var overlay = document.getElementById('pbi-launch-overlay');
    var previewCanvas = document.getElementById('pbi-preview-canvas');
    var interactiveContainer = document.getElementById('pbi-interactive-container');

    if (!interactiveContainer) return;

    if (overlay) overlay.style.display = 'none';
    if (previewCanvas) previewCanvas.style.display = 'none';

    interactiveContainer.style.display = 'block';
    interactiveContainer.innerHTML = [
      '<div style="background:var(--bg-card); border-radius:var(--radius-md); padding:1.5rem; text-align:center;">',
      '  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:8px;">',
      '    <div style="display:flex; align-items:center; gap:8px;">',
      '      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-green);"></span>',
      '      <span style="font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:var(--text-pure);">LIVE POWER BI REPORT ACTIVE</span>',
      '    </div>',
      '    <button class="btn btn-outline" onclick="window.resetPowerBIFacade()" style="padding:4px 10px; font-size:0.75rem;">Reset Facade</button>',
      '  </div>',
      '  <div style="background:var(--bg-subtle); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:2rem 1rem; color:var(--text-secondary);">',
      '    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="1.5" style="margin:0 auto 12px;"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
      '    <div style="font-weight:800; font-size:1.05rem; color:var(--text-pure); margin-bottom:6px;">Interactive Production Report Sandbox</div>',
      '    <p style="font-size:0.85rem; max-width:520px; margin:0 auto 1rem;">DirectQuery connections, slicer cross-filtering, and RLS (Row-Level Security) models configured for enterprise stakeholders.</p>',
      '    <div style="display:inline-flex; gap:8px; font-family:var(--font-mono); font-size:0.75rem;">',
      '      <span style="background:var(--bg-card); border:1px solid var(--border-subtle); padding:4px 8px; border-radius:4px;">12,000+ Records Loaded</span>',
      '      <span style="background:var(--bg-card); border:1px solid var(--border-subtle); padding:4px 8px; border-radius:4px;">3NF Schema Mapped</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    window.showToast('Power BI Interactive Report Loaded!');
  };

  window.resetPowerBIFacade = function () {
    var overlay = document.getElementById('pbi-launch-overlay');
    var previewCanvas = document.getElementById('pbi-preview-canvas');
    var interactiveContainer = document.getElementById('pbi-interactive-container');

    if (interactiveContainer) {
      interactiveContainer.style.display = 'none';
      interactiveContainer.innerHTML = '';
    }
    if (previewCanvas) previewCanvas.style.display = 'block';
    if (overlay) overlay.style.display = 'flex';
  };

  // MySQL Workbench SQL Presets
  window.runSQLTest = function (presetId) {
    var consoleZone = document.getElementById('sql-console-zone');
    var buttons = document.querySelectorAll('.sql-preset-btn');

    buttons.forEach(function (btn, idx) {
      btn.classList.toggle('active', idx === presetId - 1);
    });

    if (!consoleZone) return;

    if (presetId === 1) {
      consoleZone.textContent = '-- Query 1: Sales Fact Table Aggregation\n' +
        'SELECT \n' +
        '    p.category_name, \n' +
        '    COUNT(s.order_id) AS total_orders,\n' +
        '    SUM(s.order_amount) AS gross_sales,\n' +
        '    ROUND(AVG(s.margin_pct), 2) AS avg_margin\n' +
        'FROM sales_fact s\n' +
        'JOIN dim_product p ON s.product_id = p.product_id\n' +
        'GROUP BY p.category_name;\n' +
        '----------------------------------------------------------------------\n' +
        '> Electronics    | 480 orders | ₹7,45,000 | 29.5% margin\n' +
        '> Commercial     | 320 orders | ₹5,12,800 | 33.2% margin\n' +
        '> Office Supplies| 620 orders | ₹2,18,400 | 24.1% margin\n' +
        '[Query executed in 0.0018 seconds · Ready for Star Schema DirectQuery]';
    } else if (presetId === 2) {
      consoleZone.textContent = '-- Query 2: Star Schema 3NF Multi-Table Join\n' +
        'SELECT \n' +
        '    c.city, d.fiscal_quarter, \n' +
        '    COUNT(DISTINCT s.customer_id) AS active_clients,\n' +
        '    SUM(s.order_amount) AS quarterly_rev\n' +
        'FROM sales_fact s\n' +
        'JOIN dim_customer c ON s.customer_id = c.customer_id\n' +
        'JOIN dim_date d ON s.date_id = d.date_id\n' +
        'WHERE c.retention_rate >= 0.40\n' +
        'GROUP BY c.city, d.fiscal_quarter;\n' +
        '----------------------------------------------------------------------\n' +
        '> Chennai   | Q1-FY25 | 142 clients | ₹4,85,000\n' +
        '> Bangalore | Q1-FY25 | 188 clients | ₹6,12,000\n' +
        '[Query executed in 0.0022 seconds · 100% Referential Integrity]';
    } else if (presetId === 3) {
      consoleZone.textContent = '-- Query 3: Target Attainment & Regional Variance CTE\n' +
        'WITH RegionalSummary AS (\n' +
        '    SELECT city, SUM(order_amount) AS actual_sales, 160000 AS target_base\n' +
        '    FROM sales_fact s JOIN dim_customer c ON s.customer_id = c.customer_id\n' +
        '    GROUP BY city\n' +
        ')\n' +
        'SELECT city, actual_sales, target_base, \n' +
        '       ROUND(((actual_sales - target_base) / target_base) * 100, 2) AS variance_pct\n' +
        'FROM RegionalSummary;\n' +
        '----------------------------------------------------------------------\n' +
        '> Chennai   | ₹1,82,400 | ₹1,60,000 | +14.0% Over Target\n' +
        '> Bangalore | ₹1,94,200 | ₹1,60,000 | +21.4% Over Target\n' +
        '[Query executed in 0.0020 seconds · CTE Materialized]';
    }

    window.showToast('Executed SQL Query ' + presetId);
  };

  // Recruiter Project Filters
  window.filterProjects = function (category, btnEl) {
    var buttons = document.querySelectorAll('.recruiter-filter-bar .filter-pill-btn');
    var cards = document.querySelectorAll('.project-card');

    if (btnEl) {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      btnEl.classList.add('active');
    }

    cards.forEach(function (card) {
      var cardCat = card.getAttribute('data-category') || '';
      if (category === 'all' || cardCat.indexOf(category) !== -1) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  };

  // Recruiter Skill Filters
  window.filterSkills = function (category, btnEl) {
    var buttons = document.querySelectorAll('#skills .filter-pill-btn');
    var cards = document.querySelectorAll('.skill-bento-card');

    if (btnEl) {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      btnEl.classList.add('active');
    }

    cards.forEach(function (card) {
      var cardCat = card.getAttribute('data-category') || '';
      if (category === 'all' || cardCat.indexOf(category) !== -1) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  // Pipeline Stepper (Flagship Case Study)
  window.activatePipelineStep = function (stepNum) {
    var items = document.querySelectorAll('.pipeline-step-item');
    items.forEach(function (item, idx) {
      item.classList.toggle('active', idx === stepNum - 1);
    });
  };

  // Mobile Menu Navigation Drawer
  window.toggleMobileMenu = function () {
    var drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;
    drawer.classList.toggle('active');
  };

  window.closeMobileMenu = function () {
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.remove('active');
  };

  // Modals (Recruiter Summary & CmdK)
  window.openModal = function (modalId) {
    var m = document.getElementById(modalId);
    if (m) {
      m.style.display = 'flex';
      var input = m.querySelector('input');
      if (input) setTimeout(function () { input.focus(); }, 100);
    }
  };

  window.closeModal = function (modalId) {
    var m = document.getElementById(modalId);
    if (m) m.style.display = 'none';
  };

  // CmdK Search Handler
  window.handleCmdkSearch = function (query) {
    var zone = document.getElementById('cmdk-results-zone');
    if (!zone) return;
    var q = query.toLowerCase().trim();
    var items = zone.querySelectorAll('.cmdk-item');

    items.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      if (!q || text.indexOf(q) !== -1) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  };

  // Contact Inquiry Form Submission
  window.handleContactSubmit = function (e) {
    e.preventDefault();
    var feedback = document.getElementById('form-feedback-zone');
    var btn = document.getElementById('btn-submit-inquiry');
    var nameInput = document.getElementById('form-name');
    var emailInput = document.getElementById('form-email');
    var msgInput = document.getElementById('form-message');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Delivering Message...</span>';
    }

    setTimeout(function () {
      if (feedback) {
        feedback.className = 'form-feedback-msg feedback-success';
        feedback.textContent = 'Thank you, ' + (nameInput ? nameInput.value : 'Recruiter') + '! Your message has been prepared for Sanjai Ram M. He will review and respond promptly.';
        feedback.style.display = 'block';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Message Sent Successfully</span>';
      }
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (msgInput) msgInput.value = '';

      window.showToast('Inquiry delivered successfully!');
    }, 450);
  };

  // Theme Toggle (Light Default / Flat Dark)
  function initTheme() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var activeTheme = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', activeTheme);

    var toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        window.showToast('Switched to ' + next + ' theme');
      });
    }
  }

  // Scroll Spy for Nav Anchors
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link-list .nav-anchor');
    if (!sections.length || !navLinks.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              var href = link.getAttribute('href');
              link.classList.toggle('active', href === '#' + id);
            });
          }
        });
      }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      });

      sections.forEach(function (sec) {
        observer.observe(sec);
      });
    }
  }

  // Keyboard Shortcuts: Cmd+K and Escape
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var cmdk = document.getElementById('modal-cmdk');
      if (cmdk && cmdk.style.display === 'flex') {
        window.closeModal('modal-cmdk');
      } else {
        window.openModal('modal-cmdk');
      }
    }
    if (e.key === 'Escape') {
      window.closeModal('modal-cmdk');
      window.closeModal('modal-recruiter');
      window.closeMobileMenu();
    }
  });

  // Modal Backdrop Click to Close
  document.querySelectorAll('.modal-backdrop').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // DOMContentLoaded Initialization
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initScrollSpy();
    window.recalculateSimulation();
  });

})();
