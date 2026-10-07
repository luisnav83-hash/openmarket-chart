/**
 * marketData.js — generador de datos OHLCV sintéticos pero REALISTAS.
 *
 * No hay conexión a ningún exchange ni claves de API: se construye una serie
 * determinista (semilla fija por símbolo+intervalo) con:
 *   · paseo aleatorio con agrupación de volatilidad (GARCH sencillo)
 *   · tendencias y consolidaciones de duración variable
 *   · volumen correlacionado con el rango de la vela
 *   · cierres por encima/debajo del rango cuando toca (mechas coherentes)
 *
 * Al ser determinista, la demo es reproducible (útil para comparar capturas).
 */

import { getSymbol } from './symbols.js';

/** PRNG rápido y determinista (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ruido gaussiano (Box-Muller) a partir del PRNG. */
function gauss(rnd) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Genera velas OHLCV.
 * @param {object} opts
 * @param {string} opts.ticker      p.ej. 'BTCUSDT'
 * @param {string} opts.interval    '1m' | '5m' | '1h' | ...
 * @param {number} opts.seconds     segundos por vela
 * @param {number} opts.bars        número de velas
 * @param {number} opts.endTime     instante (segundos UTC) de la última vela
 * @param {number} [opts.volatility] multiplicador de volatilidad
 */
/** Interés abierto de referencia (USD) por activo, sólo para que la cifra sea creíble. */
const SYMBOL_OI = {
  BTCUSDT: 3.42e9, ETHUSDT: 1.28e9, SOLUSDT: 4.1e8, XRPUSDT: 2.6e8,
  BNBUSDT: 1.9e8, DOGEUSDT: 3.1e8, AVAXUSDT: 1.4e8, LINKUSDT: 9.2e7,
};

export function generateCandles({ ticker, interval, seconds, bars = 900, endTime, volatility = 1 }) {
  const sym = getSymbol(ticker);
  const rnd = mulberry32(hashSeed(ticker + '|' + interval));
  const candles = [];

  // Volatilidad por vela: la del símbolo ajustada al marco temporal.
  const perBar = (sym.vol / 100) * Math.sqrt(seconds / 3600) * volatility;

  let price = sym.price * (1 - 0.028 + rnd() * 0.012);   // arranca algo por debajo del nivel actual
  let vol = perBar;
  let drift = 0;
  let trendLeft = 0;

  const start = endTime - (bars - 1) * seconds;

  for (let i = 0; i < bars; i++) {
    // Cambios de régimen: tendencia nueva cada 40–160 velas
    if (trendLeft <= 0) {
      trendLeft = 40 + Math.floor(rnd() * 120);
      drift = (rnd() - 0.5) * 0.0025 * (seconds / 3600 + 0.35);
      vol = perBar * (0.75 + rnd() * 0.7);
    }
    trendLeft--;

    // Volatilidad con memoria (se acerca a la de largo plazo y da saltos)
    vol = vol * 0.94 + perBar * 0.06 * (0.7 + rnd() * 0.9);
    if (rnd() < 0.012) vol *= 2.1 + rnd();          // pico de volatilidad ocasional

    const open = price;
    const ret = drift + gauss(rnd) * vol;
    let close = open * (1 + ret);

    // Mechas proporcionales al rango, con sesgo coherente con el movimiento
    const range = Math.abs(close - open) + open * vol * (0.35 + rnd() * 0.75);
    const upWick = range * (0.12 + rnd() * 0.45) * (ret >= 0 ? 0.75 : 1.15);
    const dnWick = range * (0.12 + rnd() * 0.45) * (ret >= 0 ? 1.15 : 0.75);
    const high = Math.max(open, close) + upWick;
    const low = Math.min(open, close) - dnWick;

    // Volumen: base por símbolo, más alto cuanto mayor es el rango
    const baseVol = (sym.price > 10000 ? 9 : sym.price > 100 ? 22 : 60) * (seconds / 300);
    const rel = range / (open * perBar + 1e-9);
    const volume = baseVol * (0.45 + rel * 0.55 + rnd() * 0.5);

    candles.push({
      time: start + i * seconds,
      open: +open.toFixed(8),
      high: +high.toFixed(8),
      low: +low.toFixed(8),
      close: +close.toFixed(8),
      volume: +volume.toFixed(4),
    });
    price = close;
  }

  // Reancla el último precio al nivel "actual" del símbolo (así la demo siempre
  // muestra el precio de referencia y queda coherente con la cabecera).
  const k = sym.price / candles[candles.length - 1].close;
  if (Math.abs(k - 1) > 1e-6) {
    const ramp = 60;                      // suaviza el reanclaje en las últimas velas
    for (let i = 0; i < candles.length; i++) {
      const f = i < candles.length - ramp ? 1 : 1 + (k - 1) * ((i - (candles.length - ramp)) / ramp);
      const c = candles[i];
      c.open *= f; c.high *= f; c.low *= f; c.close *= f;
    }
  }
  return candles;
}

/** Resumen 24 h (volumen, interés abierto, funding) con aspecto creíble. */
export function marketStats(ticker, candles) {
  const rnd = mulberry32(hashSeed(ticker + '|stats'));
  // Últimas 288 velas ≈ 24 h en 5 m; en intervalos mayores se usa la ventana real.
  const recent = candles.slice(-Math.min(candles.length, 288));
  // Volumen de la ventana en unidades; el nocional (USD) es lo que se muestra
  const vol24 = recent.reduce((a, c) => a + c.volume, 0);
  const vol24Usd = recent.reduce((a, c) => a + c.volume * c.close, 0);
  const first = recent[0] ? recent[0].close : 1;
  const lastCandle = candles[candles.length - 1] || { open: 1, high: 1, low: 1, close: 1 };
  const last = lastCandle.close;
  const high24h = Math.max(...recent.map((c) => c.high));
  const low24h = Math.min(...recent.map((c) => c.low));

  // Etiquetas compactas (K/M/B) para la barra de estadísticas del original
  const compact = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return v.toFixed(2);
  };
  const maxOi = SYMBOL_OI[ticker] // interés abierto de referencia por activo
    || 0;
  const openInterest = (maxOi || vol24Usd * 0.42) * (0.85 + rnd() * 0.3);

  return {
    changePct: ((last - first) / first) * 100,
    volume24h: vol24 * (0.9 + rnd() * 0.2),
    volume24hUsd: vol24Usd,
    openInterest,
    fundingRate: (rnd() - 0.5) * 0.00042,
    last: lastCandle,
    high24h,
    low24h,
    volumeLabel: '$' + compact(vol24Usd * (0.9 + rnd() * 0.2)),
    oiLabel: '$' + compact(openInterest),
  };
}
