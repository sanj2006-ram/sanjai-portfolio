const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\DELL\\Desktop\\Sanjai_Ram_Portfolio';
const htmlPath = path.join(baseDir, 'modular', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('=== TECHNICAL SEO AUDIT FOR SANJAI RAM PORTFOLIO ===\n');

// 1. Title & Description
const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[1].trim() : 'MISSING');
console.log('Title Length:', titleMatch ? titleMatch[1].trim().length : 0);

const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
console.log('Meta Description:', descMatch ? descMatch[1].trim() : 'MISSING');
console.log('Description Length:', descMatch ? descMatch[1].trim().length : 0);

// 2. Canonical & Robots
const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
console.log('Canonical:', canonicalMatch ? canonicalMatch[1] : 'MISSING');

const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i);
console.log('Robots Meta:', robotsMatch ? robotsMatch[1] : 'MISSING');

// 3. OpenGraph
const ogTags = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale'];
console.log('\n--- OpenGraph Tags ---');
ogTags.forEach(tag => {
  const m = html.match(new RegExp(`<meta\\s+property=["']${tag}["']\\s+content=["'](.*?)["']`, 'i'));
  console.log(`${tag}:`, m ? m[1] : 'MISSING');
});

// 4. Twitter Tags
const twTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
console.log('\n--- Twitter Cards ---');
twTags.forEach(tag => {
  const m = html.match(new RegExp(`<meta\\s+name=["']${tag}["']\\s+content=["'](.*?)["']`, 'i'));
  console.log(`${tag}:`, m ? m[1] : 'MISSING');
});

// 5. Headings Hierarchy
console.log('\n--- Headings Audit ---');
const h1s = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
console.log(`Total H1s: ${h1s.length}`);
h1s.forEach(h => console.log('H1:', h.replace(/<[^>]+>/g, '').trim()));

const h2s = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
console.log(`Total H2s: ${h2s.length}`);

// 6. Images & Alt Attributes
console.log('\n--- Image Audit ---');
const imgs = html.match(/<img[^>]*>/gi) || [];
console.log(`Total Images: ${imgs.length}`);
imgs.forEach((img, i) => {
  const src = img.match(/src=["'](.*?)["']/i)?.[1] || 'no-src';
  const alt = img.match(/alt=["'](.*?)["']/i)?.[1];
  const width = img.match(/width=["'](.*?)["']/i)?.[1];
  const height = img.match(/height=["'](.*?)["']/i)?.[1];
  console.log(`Img ${i + 1}: src=${src.slice(0, 40)}, alt="${alt !== undefined ? alt : 'MISSING'}", dimensions=${width}x${height}`);
});

// 7. Check 404.html
const p404 = path.join(baseDir, '404.html');
if (fs.existsSync(p404)) {
  const h404 = fs.readFileSync(p404, 'utf8');
  console.log('\n--- 404.html Audit ---');
  console.log('404 title:', h404.match(/<title>(.*?)<\/title>/i)?.[1]);
  console.log('404 robots:', h404.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i)?.[1] || 'MISSING (Should be noindex)');
}
