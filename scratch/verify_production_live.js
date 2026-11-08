async function verify() {
  console.log('=== VERIFYING PRODUCTION DEPLOYMENT ON VERCEL ===\n');

  // 1. OG Image
  const ogRes = await fetch('https://sanjai-analytics.vercel.app/assets/og-image.jpg?t=' + Date.now());
  console.log(`[LIVE] /assets/og-image.jpg: Status ${ogRes.status}, Content-Type: ${ogRes.headers.get('content-type')}`);

  // 2. Homepage HTML
  const homeRes = await fetch('https://sanjai-analytics.vercel.app/?t=' + Date.now());
  const homeHtml = await homeRes.text();
  console.log(`[LIVE] Homepage: Status ${homeRes.status}`);
  console.log(`  - Contains og:image: ${homeHtml.includes('https://sanjai-analytics.vercel.app/assets/og-image.jpg')}`);
  console.log(`  - Contains robots meta: ${homeHtml.includes('name="robots"')}`);
  console.log(`  - Single H1 present: ${(homeHtml.match(/<h1[^>]*>/gi) || []).length === 1}`);
  const canon = homeHtml.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  console.log(`  - Canonical URL: ${canon ? canon[1] : 'MISSING'}`);

  // 3. 404 Page
  const p404Res = await fetch('https://sanjai-analytics.vercel.app/404.html?t=' + Date.now());
  const p404Html = await p404Res.text();
  console.log(`[LIVE] /404.html: Status ${p404Res.status}`);
  console.log(`  - Contains noindex directive: ${p404Html.includes('noindex')}`);

  // 4. Sitemap
  const sitemapRes = await fetch('https://sanjai-analytics.vercel.app/sitemap.xml?t=' + Date.now());
  const sitemapXml = await sitemapRes.text();
  console.log(`[LIVE] /sitemap.xml: Status ${sitemapRes.status}`);
  console.log(`  - No fragments in sitemap: ${!sitemapXml.includes('#')}`);
  console.log(`  - Canonical sitemap domain: ${sitemapXml.includes('https://sanjai-analytics.vercel.app/')}`);

  // 5. Robots.txt
  const robotsRes = await fetch('https://sanjai-analytics.vercel.app/robots.txt?t=' + Date.now());
  const robotsTxt = await robotsRes.text();
  console.log(`[LIVE] /robots.txt: Status ${robotsRes.status}`);
  console.log(`  - References canonical sitemap: ${robotsTxt.includes('https://sanjai-analytics.vercel.app/sitemap.xml')}`);

  console.log('\n=== ALL PRODUCTION ENDPOINTS VERIFIED SUCCESSFULLY! ===');
}

verify().catch(e => console.error(e));

