/** sizes.js — medidas del clon en los 7 tamaños del reconocimiento. */
const puppeteer = (await import('/home/user/.cache/pptr/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
const SIZES = [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[430,932],[375,812]];
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const out = [];
for (const [w, h] of SIZES) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise((r) => setTimeout(r, 1800));
  const m = await page.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    return {
      header: b('.global-nav'), banner: b('.tier-banner'), toolbar: b('.chart-toolbar'),
      rail: b('.tool-rail') || b('.tool-rail__hidden'), chart: b('.chart-area'), footer: b('.footer'),
      sheet: !!document.querySelector('.mobile-sheet'),
      sheetBg: document.querySelector('.mobile-sheet') ? getComputedStyle(document.querySelector('.mobile-sheet')).backgroundColor : null,
      pills: document.querySelectorAll('.range-pill').length,
      legendW: (b('.ohlc-legend') || [0,0,0,0])[2],
      hStats: !!document.querySelector('.tb-stats') && getComputedStyle(document.querySelector('.tb-stats')).display !== 'none',
      scrollX: document.documentElement.scrollWidth > innerWidth,
      footerH: (b('.footer') || [0,0,0,0])[3],
    };
  });
  out.push({ size: `${w}x${h}`, ...m, errs });
  await page.close();
}
await browser.close();
for (const r of out) {
  console.log(`${r.size.padEnd(9)} header=${r.header.join(',')} banner=${r.banner.join(',')} toolbar=${r.toolbar.join(',')} rail=${r.rail.join(',')} chart=${r.chart.join(',')} footer=${r.footer.join(',')} sheet=${r.sheet} stats=${r.hStats} pills=${r.pills} scrollX=${r.scrollX} errores=${r.errs.length}`);
}
