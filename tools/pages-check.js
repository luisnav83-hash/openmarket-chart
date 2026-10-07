/**
 * pages-check.js — verifica la versión PUBLICADA en GitHub Pages:
 *   · responde 200 y monta la app (lienzos del gráfico)
 *   · franjas con las mismas medidas que en local
 *   · sin errores de consola
 *
 * Uso: node tools/pages-check.js [url]
 */
const puppeteer = (await import('/home/user/.cache/pptr/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
const URL_ = process.argv[2] || 'https://luisnav83-hash.github.io/openmarket-chart/';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errs = [];
page.on('pageerror', (e) => errs.push('EXCEPCIÓN: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`); });

await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForFunction(() => document.querySelectorAll('.chart-canvas canvas').length > 0, { timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));

const m = await page.evaluate(() => {
  const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  return {
    header: b('.global-nav'), banner: b('.tier-banner'), toolbar: b('.chart-toolbar'),
    rail: b('.tool-rail'), chart: b('.chart-area'), footer: b('.footer'),
    canvas: document.querySelectorAll('.chart-canvas canvas').length,
    indicadores: (document.querySelector('.tb-indicators__count') || {}).textContent,
    leyenda: (document.querySelector('.ohlc-legend') || {}).innerText?.replace(/\n/g, ' | ').slice(0, 90),
    scrollX: document.documentElement.scrollWidth > innerWidth,
  };
});
await page.screenshot({ path: 'docs/pages-1920x1080.png' });
await browser.close();

const esperado = { header: '0,0,1920,40', banner: '0,40,1920,40', toolbar: '0,80,1920,44', rail: '0,124,52,920', chart: '52,124,1868,920', footer: '0,1044,1920,36' };
let fallos = 0;
Object.entries(esperado).forEach(([k, v]) => {
  const ok = (m[k] || []).join(',') === v;
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${k}: ${(m[k] || []).join(',')} (esperado ${v})`);
});
console.log(`${m.canvas > 0 ? '✓' : '✗'} gráfico montado · ${m.canvas} lienzos`);
console.log(`✓ indicadores: ${m.indicadores} · leyenda: ${m.leyenda}`);
console.log(`${!m.scrollX ? '✓' : '✗'} sin scroll horizontal`);
console.log(`errores: ${errs.length}`);
errs.slice(0, 6).forEach((e) => console.log('   ', e));
console.log(fallos === 0 && errs.length === 0 && m.canvas > 0 ? '\nPAGES OK' : '\nPAGES CON PROBLEMAS');
