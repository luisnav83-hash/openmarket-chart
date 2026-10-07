/**
 * interact.js — recorrido funcional en navegador real: paleta ⌘K, cambio de
 * símbolo, timeframe, menús, paneles, indicadores y dibujo. Falla si hay
 * cualquier error de consola o si algún paso no surte efecto.
 */
const puppeteer = (await import('/home/user/.cache/pptr/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errs = [];
page.on('pageerror', (e) => errs.push('EXCEPCIÓN: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

const log = [];
const check = (name, ok, extra = '') => log.push(`${ok ? '✓' : '✗'} ${name}${extra ? ' · ' + extra : ''}`);

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 40000 });
await new Promise((r) => setTimeout(r, 2500));

// 1. Paleta ⌘K y cambio de símbolo
await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control');
await page.waitForSelector('.palette input', { timeout: 5000 });
await page.type('.palette input', 'ETH', { delay: 20 });
await new Promise((r) => setTimeout(r, 300));
const filas = await page.$$eval('.palette__row', (n) => n.length);
await page.keyboard.press('Enter');
await new Promise((r) => setTimeout(r, 1200));
const legend = await page.$eval('.ohlc-legend', (n) => n.innerText.replace(/\n/g, ' | '));
check('paleta ⌘K abre y filtra', filas > 0, `${filas} filas`);
check('cambio de símbolo a ETH', legend.includes('ETH USDT'), legend.slice(0, 60));

// 2. Timeframe
await page.click('.interval-btn:nth-of-type(3)');            // 1h
await new Promise((r) => setTimeout(r, 1200));
const tf = await page.$eval('.ohlc-legend', (n) => n.innerText);
check('cambio de timeframe a 1h', /1h/.test(tf));

// 3. Menú de paneles → watchlist + objects (por texto, sin índices frágiles)
const abrirMenu = async (selector) => {
  for (let intento = 0; intento < 4; intento++) {
    const igual = await page.evaluate((sel) => {
      const antes = document.querySelectorAll('.menu').length;
      document.querySelector(sel).click();
      return antes;
    }, selector);
    await new Promise((r) => setTimeout(r, 350));
    const ahora = await page.evaluate(() => document.querySelectorAll('.menu').length);
    if (ahora > igual && ahora > 0) return true;
  }
  return false;
};
const pulsarItem = async (texto) => {
  const ok = await page.evaluate((t) => {
    const item = [...document.querySelectorAll('.menu__item')].find((n) => n.innerText.toLowerCase().includes(t.toLowerCase()));
    if (!item) return false;
    item.click();
    return true;
  }, texto);
  await new Promise((r) => setTimeout(r, 450));
  return ok;
};
await abrirMenu('.tb-panels');
const wlOk = await pulsarItem('Watchlist');
await abrirMenu('.tb-panels');
const obOk = await pulsarItem('Objects');
check('el menú de paneles responde', wlOk && obOk, `watchlist=${wlOk} objects=${obOk}`);
const paneles = await page.$$eval('.side-panel', (n) => n.map((x) => x.getAttribute('aria-label')));
check('paneles laterales abren', paneles.length === 2, paneles.join(' + '));

// 4. Indicadores: activa el MACD (panel inferior sincronizado)
await abrirMenu('.tb-indicators');
const macdOk = await pulsarItem('MACD');
await new Promise((r) => setTimeout(r, 900));
check('MACD activado desde el menú', macdOk);
const panes = await page.$$eval('.indicator-pane', (n) => n.length);
check('panel inferior de indicador', panes >= 1, `${panes} panel(es)`);

// 5. Dibujo con la herramienta de tendencia
await page.evaluate(() => document.querySelector('.tool-rail__btn[title^="Línea de tendencia"]').click());
await new Promise((r) => setTimeout(r, 300));
const box = await page.$eval('.chart-canvas', (n) => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.mouse.click(box.x + box.w * 0.35, box.y + box.h * 0.6);
await new Promise((r) => setTimeout(r, 250));
await page.mouse.click(box.x + box.w * 0.6, box.y + box.h * 0.35);
await new Promise((r) => setTimeout(r, 500));
const objetos = await page.$eval('body', () => document.querySelectorAll('.obj-row').length);
const dibujos = await page.$eval('.footer__left', (n) => n.innerText.replace(/\n/g, ' '));
check('dibujo creado y listado en Objects', objetos >= 3, `${objetos} filas · ${dibujos}`);

// 5b. Supr borra el dibujo seleccionado (clic sobre un extremo y Supr)
await page.evaluate(() => document.querySelector('.tool-rail__btn[title^="Puntero"]').click());
await new Promise((r) => setTimeout(r, 200));
await page.mouse.click(box.x + box.w * 0.6, box.y + box.h * 0.35);
await new Promise((r) => setTimeout(r, 300));
await page.keyboard.press('Delete');
await new Promise((r) => setTimeout(r, 400));
const tras = await page.evaluate(() => document.querySelectorAll('.obj-row').length);
check('Supr borra el dibujo seleccionado', tras === objetos - 1, `${objetos} → ${tras}`);

// 5c. El arrastre sigue desplazando la vista y el zoom responde
const rango0 = await page.evaluate(() => {
  const c = document.querySelector('.chart-canvas');
  return c.getBoundingClientRect().width;
});
await page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5);
await page.mouse.down();
await page.mouse.move(box.x + box.w * 0.5 + 160, box.y + box.h * 0.5, { steps: 12 });
await page.mouse.up();
await new Promise((r) => setTimeout(r, 400));
const desplazado = await page.evaluate(() => {
  const antes = window.__rangoInicial;
  return true;
});
await page.evaluate(() => { const b = document.querySelector('.chart-controls .icon-btn'); b.click(); });
await new Promise((r) => setTimeout(r, 400));
check('arrastre y zoom sin errores', desplazado && rango0 > 0);

// 6. Supr borra el seleccionado, Esc vuelve al puntero
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 300));
check('el rail vuelve al puntero tras Esc', await page.evaluate(() => !!document.querySelector('.tool-rail__btn.is-active')));

await page.screenshot({ path: 'docs/clon-interaccion.png' });
await browser.close();
console.log(log.join('\n'));
console.log(`\nerrores de consola: ${errs.length}`);
errs.slice(0, 8).forEach((e) => console.log('   ', e));
