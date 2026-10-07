/**
 * probe.js — comprobación rápida del clon en el navegador:
 *   · errores de consola / excepciones
 *   · medidas reales de cada franja (para comparar con el original)
 *   · captura a un tamaño dado
 *
 * Uso: node probe.js <ancho> <alto> <salida.png>
 */
const puppeteer = (await import('/home/user/.cache/pptr/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;

const [w = 1920, h = 1080, out = 'shot.png'] = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });

  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 60000 });
  // Espera a que el gráfico tenga lienzos pintados
  await page.waitForFunction(() => document.querySelectorAll('.chart-canvas canvas').length > 0, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));

  const medidas = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const cs = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    return {
      viewport: [innerWidth, innerHeight],
      header: box('.global-nav'),
      banner: box('.tier-banner'),
      toolbar: box('.chart-toolbar'),
      rail: box('.tool-rail') || box('.tool-rail__hidden'),
      chartArea: box('.chart-area'),
      canvas: box('.chart-canvas'),
      footer: box('.footer'),
      legend: box('.ohlc-legend'),
      pills: document.querySelectorAll('.range-pill').length,
      countdown: !!document.querySelector('.candle-countdown'),
      zoomBtns: document.querySelectorAll('.chart-controls .icon-btn').length,
      canvasCount: document.querySelectorAll('.chart-canvas canvas').length,
      railBtns: document.querySelectorAll('.tool-rail__btn').length,
      bgHeader: cs('.global-nav', 'backgroundColor'),
      bgToolbar: cs('.chart-toolbar', 'backgroundColor'),
      bgFooter: cs('.footer', 'backgroundColor'),
      scrollX: document.documentElement.scrollWidth > innerWidth,
      candles: document.querySelectorAll('.chart-canvas canvas').length ? 'ok' : 'sin datos',
      legendText: (document.querySelector('.ohlc-legend')?.innerText || '').replace(/\n/g, ' | ').slice(0, 160),
    };
  });

  await page.screenshot({ path: out });
  await browser.close();

  console.log(JSON.stringify({ medidas, errores }, null, 2));
})();
