const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = 'C:\\Users\\DELL\\Desktop\\Sanjai_Ram_Portfolio';
const modularHtmlPath = path.join(baseDir, 'modular', 'index.html');
const modularCssPath = path.join(baseDir, 'modular', 'style.css');
const p404Path = path.join(baseDir, '404.html');
const modular404Path = path.join(baseDir, 'modular', '404.html');

console.log('=== IMPLEMENTING PRODUCTION-GRADE SEO & METADATA OPTIMIZATIONS ===\n');

// 1. Update modular/style.css to include .sr-only
let css = fs.readFileSync(modularCssPath, 'utf8');
if (!css.includes('.sr-only')) {
  const srOnlyCss = `\n/* Accessibility & SEO utility for screen readers and semantic hierarchy */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}\n`;
  css += srOnlyCss;
  fs.writeFileSync(modularCssPath, css, 'utf8');
  console.log('  [+] Added .sr-only utility to modular/style.css');
}

// 2. Update modular/index.html
let html = fs.readFileSync(modularHtmlPath, 'utf8');

// A. Meta Description
const newMetaDesc = '<meta name="description" content="Executive portfolio of Sanjai Ram M, Data Analyst &amp; BI Specialist. Specialized in Power BI dashboards, DAX modeling, Power Query ETL, and MySQL analytics.">';
html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, newMetaDesc);

// B. Robots Meta tag
if (!html.includes('name="robots"')) {
  const robotsTag = '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">';
  html = html.replace(/(<meta\s+name=["']google-site-verification["'][^>]*>)/i, `$1\n<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);
}

// C. Apple Touch Icon
if (!html.includes('rel="apple-touch-icon"')) {
  html = html.replace(/(<link\s+rel=["']alternate icon["'][^>]*>)/i, `$1\n<link rel="apple-touch-icon" href="assets/favicon.svg">`);
}

// D. OpenGraph Enhancements (og:image, og:locale, og:image:type, etc.)
const newOgBlock = `<!-- OpenGraph / Social Metadata (Optimized for LinkedIn, WhatsApp, X, Facebook) -->
<meta property="og:type" content="website">
<meta property="og:title" content="Sanjai Ram M | Data Analyst &amp; Business Intelligence Specialist">
<meta property="og:description" content="Executive portfolio of Sanjai Ram M, Data Analyst &amp; BI Specialist. Interactive Power BI dashboards, DAX modeling, Power Query ETL, and SQL data analytics.">
<meta property="og:url" content="https://sanjai-analytics.vercel.app/">
<meta property="og:site_name" content="Sanjai Ram M Portfolio">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="https://sanjai-analytics.vercel.app/assets/og-image.jpg">
<meta property="og:image:secure_url" content="https://sanjai-analytics.vercel.app/assets/og-image.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sanjai Ram M - Data Analyst &amp; Business Intelligence Specialist Portfolio Dossier">`;

html = html.replace(/<!-- OpenGraph \/ Social Metadata[\s\S]*?<!-- Twitter Card Metadata -->/i, newOgBlock + '\n\n<!-- Twitter Card Metadata -->');

// E. Twitter Card Metadata
const newTwitterBlock = `<!-- Twitter Card Metadata -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Sanjai Ram M | Data Analyst &amp; Business Intelligence Specialist">
<meta name="twitter:description" content="Executive portfolio of Sanjai Ram M, Data Analyst &amp; BI Specialist. Interactive Power BI dashboards, DAX modeling, Power Query ETL, and SQL data analytics.">
<meta name="twitter:image" content="https://sanjai-analytics.vercel.app/assets/og-image.jpg">
<meta name="twitter:image:alt" content="Sanjai Ram M - Data Analyst &amp; Business Intelligence Specialist Portfolio Dossier">`;

html = html.replace(/<!-- Twitter Card Metadata -->[\s\S]*?<!-- Favicon/i, newTwitterBlock + '\n\n<!-- Favicon');

// F. Schema.org JSON-LD Updates (image, sameAs, cleaner identifiers)
const oldLdJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
if (oldLdJsonMatch) {
  try {
    const ldObj = JSON.parse(oldLdJsonMatch[1]);
    const person = ldObj['@graph'].find(item => item['@type'] === 'Person');
    if (person) {
      person.image = "https://sanjai-analytics.vercel.app/assets/og-image.jpg";
      person.sameAs = [
        "https://github.com/sanj2006-ram"
      ];
    }
    const newLdJsonStr = '<script type="application/ld+json">\n' + JSON.stringify(ldObj, null, 2) + '\n</script>';
    html = html.replace(oldLdJsonMatch[0], newLdJsonStr);
    console.log('  [+] Enriched Schema.org JSON-LD graph with image and sameAs');
  } catch (err) {
    console.error('  [!] Error parsing JSON-LD:', err.message);
  }
}

// G. Heading Hierarchy Refinement:
// 1. Splash gate (Line ~159): Change <h1> to <p>
html = html.replace(/<h1 class="intro-name-lead">Sanjai Ram M<\/h1>/i, '<p class="intro-name-lead">Sanjai Ram M</p>');

// 2. Hero Giant Title: Add sr-only primary title
const oldHeroTitle = `<h1 class="hero-giant-title">
          Turning complex data <br>
          <span class="hero-title-highlight">into strategic decisions.</span>
        </h1>`;
const newHeroTitle = `<h1 class="hero-giant-title">
          <span class="sr-only">Sanjai Ram M &mdash; Data Analyst &amp; Business Intelligence Specialist &mdash; </span>Turning complex data <br>
          <span class="hero-title-highlight">into strategic decisions.</span>
        </h1>`;
if (html.includes(oldHeroTitle)) {
  html = html.replace(oldHeroTitle, newHeroTitle);
} else {
  // Regex fallback
  html = html.replace(/<h1 class="hero-giant-title">([\s\S]*?)Turning complex data([\s\S]*?)<\/h1>/i, 
    `<h1 class="hero-giant-title">\n          <span class="sr-only">Sanjai Ram M &mdash; Data Analyst &amp; Business Intelligence Specialist &mdash; </span>Turning complex data$2</h1>`);
}

// 3. Recruiter snapshot modal: change <h1> to <h2>
html = html.replace(/(<div class="resume-header-left">\s*)<h1>Sanjai Ram M<\/h1>/i, '$1<h2 class="resume-header-name">Sanjai Ram M</h2>');

// 4. Privacy policy modal: change <h1> to <h2>
html = html.replace(/<h1 style="font-size:24px; font-weight:800; color:#0F172A; margin:0; letter-spacing:-0.02em;">Privacy Policy &amp; Candidate Hiring Data Dossier<\/h1>/i,
  '<h2 style="font-size:24px; font-weight:800; color:#0F172A; margin:0; letter-spacing:-0.02em;">Privacy Policy &amp; Candidate Hiring Data Dossier</h2>');

// 5. Resume modal: change remaining <h1> to <h2>
html = html.replace(/(<div class="resume-header-left">\s*)<h1>Sanjai Ram M<\/h1>/i, '$1<h2 class="resume-header-name">Sanjai Ram M</h2>');

// 6. Print layout: change <h1> to <h2>
html = html.replace(/<h1 style="font-size:24px; font-weight:800; color:#0F172A;">SANJAI RAM M<\/h1>/i,
  '<h2 style="font-size:24px; font-weight:800; color:#0F172A;">SANJAI RAM M</h2>');

fs.writeFileSync(modularHtmlPath, html, 'utf8');
console.log('  [+] Updated modular/index.html with metadata, OpenGraph, Twitter cards, and semantic H1 hierarchy');

// 3. Update 404.html files with noindex robots
[p404Path, modular404Path].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content404 = fs.readFileSync(filePath, 'utf8');
    if (!content404.includes('name="robots"')) {
      content404 = content404.replace(/<title>/i, '<meta name="robots" content="noindex, follow">\n  <title>');
      fs.writeFileSync(filePath, content404, 'utf8');
      console.log(`  [+] Added <meta name="robots" content="noindex, follow"> to ${filePath}`);
    }
  }
});

// 4. Run build-bundle.ps1 to generate compiled index.html
console.log('\n  [*] Running build-bundle.ps1 to compile standalone index.html...');
const bundleOutput = execSync('powershell -ExecutionPolicy Bypass -File build-bundle.ps1', { cwd: baseDir }).toString();
console.log('  [+] ' + bundleOutput.trim().split('\n').pop());

// 5. Sync to Documents/Sanjai_Ram_Portfolio
const docsDir = 'C:\\Users\\DELL\\Documents\\Sanjai_Ram_Portfolio';
if (fs.existsSync(docsDir)) {
  console.log('\n  [*] Syncing changes to Documents directory...');
  ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'vercel.json', '_headers', 'og-image.jpg'].forEach(f => {
    const src = path.join(baseDir, f);
    const dest = path.join(docsDir, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  });
  const modularDest = path.join(docsDir, 'modular');
  if (fs.existsSync(modularDest)) {
    ['index.html', 'style.css', 'script.js', '404.html', 'sitemap.xml', 'robots.txt'].forEach(f => {
      const src = path.join(baseDir, 'modular', f);
      const dest = path.join(modularDest, f);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    });
    const modularAssetsDest = path.join(modularDest, 'assets');
    if (fs.existsSync(modularAssetsDest) && fs.existsSync(path.join(baseDir, 'modular', 'assets', 'og-image.jpg'))) {
      fs.copyFileSync(path.join(baseDir, 'modular', 'assets', 'og-image.jpg'), path.join(modularAssetsDest, 'og-image.jpg'));
    }
  }
  console.log('  [+] Sync to Documents completed.');
}

console.log('\n=== ALL SEO IMPLEMENTATIONS COMPLETED ===');
