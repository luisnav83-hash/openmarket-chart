/** shots.js — capturas del clon en los mismos 7 tamaños que el reconocimiento. */
const puppeteer = (await import('/home/user/.cache/pptr/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
const SIZES = [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[430,932],[375,812]];
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
for (const [w, h] of SIZES) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: `docs/clon-${w}x${h}.png` });
  console.log('capturado', `${w}x${h}`);
  await page.close();
}
await browser.close();
