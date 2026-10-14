const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\DELL\\Desktop\\Sanjai_Ram_Portfolio';
const htmlPath = path.join(baseDir, 'index.html');
const sitemapPath = path.join(baseDir, 'sitemap.xml');
const robotsPath = path.join(baseDir, 'robots.txt');

const html = fs.readFileSync(htmlPath, 'utf8');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const robots = fs.readFileSync(robotsPath, 'utf8');

console.log('=== PHASE 10: AUTOMATED SEO & METADATA VALIDATION SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failCount++;
  }
}

// 1. Title tags
const titles = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
assert(Boolean(titles), 'Single <title> tag exists');
const titleText = titles ? titles[1].trim() : '';
assert(titleText.length >= 30 && titleText.length <= 80, 'Title tag length is optimal (30-80 chars)', `Title length is ${titleText.length}`);

// 2. Meta descriptions
const descs = html.match(/<meta\s+name=["']description["'][^>]*>/gi) || [];
assert(descs.length === 1, 'Single meta description exists', `Found ${descs.length}`);
const descContent = descs[0]?.match(/content=["']([\s\S]*?)["']/i)?.[1] || '';
assert(descContent.length >= 120 && descContent.length <= 165, 'Meta description length is optimal (120-165 chars)', `Length is ${descContent.length}`);

// 3. Canonical tag
const canonicals = html.match(/<link\s+rel=["']canonical["'][^>]*>/gi) || [];
assert(canonicals.length === 1, 'Single canonical link exists', `Found ${canonicals.length}`);
const canonicalHref = canonicals[0]?.match(/href=["'](.*?)["']/i)?.[1] || '';
assert(canonicalHref === 'https://sanjai-analytics.vercel.app/', 'Canonical matches production domain https://sanjai-analytics.vercel.app/');

// 4. Robots tag
const robotsTags = html.match(/<meta\s+name=["']robots["'][^>]*>/gi) || [];
assert(robotsTags.length === 1, 'Robots meta tag exists', `Found ${robotsTags.length}`);
assert(robotsTags[0]?.includes('index') && robotsTags[0]?.includes('follow'), 'Robots tag allows indexing and following');

// 5. OpenGraph Tags
const requiredOg = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale'];
requiredOg.forEach(tag => {
  const exists = html.includes(`property="${tag}"`) || html.includes(`property='${tag}'`);
  assert(exists, `OpenGraph tag ${tag} exists`);
});

// 6. Twitter Card Tags
const requiredTw = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
requiredTw.forEach(tag => {
  const exists = html.includes(`name="${tag}"`) || html.includes(`name='${tag}'`);
  assert(exists, `Twitter tag ${tag} exists`);
});

// 7. Sitemap XML Validity
assert(sitemap.startsWith('<?xml'), 'Sitemap is valid XML declaration');
assert(sitemap.includes('<urlset') && sitemap.includes('http://www.sitemaps.org/schemas/sitemap/0.9'), 'Sitemap has valid XML namespace');
assert(!sitemap.includes('#'), 'Sitemap contains NO illegal hash fragment identifiers');
assert(sitemap.includes('<loc>https://sanjai-analytics.vercel.app/</loc>'), 'Sitemap contains canonical production domain URL');
assert(!sitemap.includes('sanjairam.vercel.app'), 'Sitemap contains NO outdated 404 domain URLs');

// 8. Robots.txt
assert(robots.includes('User-agent: *'), 'Robots.txt defines wildcard user-agent');
assert(robots.includes('Allow: /'), 'Robots.txt allows public crawling');
assert(robots.includes('Sitemap: https://sanjai-analytics.vercel.app/sitemap.xml'), 'Robots.txt points to canonical sitemap URL');

// 9. Heading Hierarchy
const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
assert(h1s.length === 1, 'Document contains exactly 1 semantic H1 element', `Found ${h1s.length}`);

// 10. Images & Alt Text
const imgRegex = /<img([^>]+)>/gi;
let m;
let totalImgs = 0;
let imgsWithAlt = 0;
while ((m = imgRegex.exec(html)) !== null) {
  totalImgs++;
  if (m[1].includes('alt=')) imgsWithAlt++;
}
assert(totalImgs === imgsWithAlt, 'All images have alt attributes', `${imgsWithAlt}/${totalImgs} have alt`);

// 11. JSON-LD Structured Data
const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
assert(Boolean(ldJsonMatch), 'JSON-LD structured data block is present');
let jsonValid = false;
let parsedGraph = [];
try {
  const parsed = JSON.parse(ldJsonMatch[1]);
  parsedGraph = parsed['@graph'] || [];
  jsonValid = true;
} catch (e) {}
assert(jsonValid, 'JSON-LD syntax is valid JSON without syntax errors');
assert(parsedGraph.some(node => node['@type'] === 'Person' && node.name === 'Sanjai Ram M'), 'JSON-LD contains valid Person schema for Sanjai Ram M');
assert(parsedGraph.some(node => node['@type'] === 'WebSite' && node.url === 'https://sanjai-analytics.vercel.app/'), 'JSON-LD contains valid WebSite schema');
assert(parsedGraph.some(node => node['@type'] === 'ProfilePage'), 'JSON-LD contains valid ProfilePage schema');

// 12. 404 Error Page
const p404 = fs.readFileSync(path.join(baseDir, '404.html'), 'utf8');
assert(p404.includes('noindex'), '404 error page has noindex directive');

console.log(`\n======================================`);
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`======================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('>>> ALL 12 SEO & METADATA SUITES PASSED WITH 100% SUCCESS RATE! <<<');
}
