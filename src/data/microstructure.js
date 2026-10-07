/**
 * microstructure.js — libro de órdenes y cintas de operaciones SIMULADOS.
 *
 * El flujo real de OpenMarket (órdenes agregadas, cintas por exchange) depende
 * de su backend privado y no es inspeccionable sin cuenta; aquí se genera un
 * flujo local determinista y coherente con el precio del símbolo. No se imita
 * ningún protocolo real: son datos ficticios con el aspecto del original.
 */

/** Generador determinista pequeño (mismo motor que marketData). */
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Libro de órdenes: 14 niveles por lado con tamaño decreciente hacia fuera.
 * Devuelve { asks, bids, spread, mid }.
 */
export function buildOrderBook(ticker, price, levels = 14) {
  const rnd = mulberry32(hashSeed(ticker + '|book'));
  const step = Math.max(price * 0.00004, Number(`1e-${price > 1000 ? 1 : 4}`));
  const mk = (side, i) => {
    const dist = i + 1;
    const p = side === 'ask' ? price + step * dist : price - step * dist;
    const size = (0.4 + rnd() * 3.2) * (1 + dist * 0.42);
    return { price: p, size, total: 0 };
  };
  const asks = Array.from({ length: levels }, (_, i) => mk('ask', i));
  const bids = Array.from({ length: levels }, (_, i) => mk('bid', i));
  let acc = 0;
  asks.forEach((r) => { acc += r.size; r.total = acc; });
  acc = 0;
  bids.forEach((r) => { acc += r.size; r.total = acc; });
  const maxTotal = Math.max(asks[asks.length - 1].total, bids[bids.length - 1].total);
  return { asks, bids, maxTotal, spread: asks[0].price - bids[0].price, mid: price };
}

/**
 * Cintas: últimas `n` operaciones con hora, precio, tamaño y lado.
 * `now` permite fijar el instante base (para capturas reproducibles).
 */
export function buildTape(ticker, price, n = 28, now = Date.now()) {
  const rnd = mulberry32(hashSeed(ticker + '|tape'));
  const step = Math.max(price * 0.00003, 0.0001);
  const out = [];
  for (let i = 0; i < n; i++) {
    const buy = rnd() > 0.48;
    const drift = (rnd() - 0.5) * step * 6;
    const p = Math.max(0.0001, price + drift - (i * (rnd() - 0.5) * step));
    out.push({
      time: now - i * (4000 + Math.floor(rnd() * 12000)),
      price: p,
      size: +(0.05 + rnd() * (rnd() > 0.9 ? 12 : 2.4)).toFixed(4),
      side: buy ? 'buy' : 'sell',
      venue: rnd() > 0.72 ? (rnd() > 0.5 ? 'COINBASE' : 'GATEIO') : 'BINANCE.F',
    });
  }
  return out;
}

/** Cambio de precio simulado en una ventana (para la watchlist). */
export function pseudoChangePct(ticker, base, seed = 0) {
  const rnd = mulberry32(hashSeed(ticker + '|chg' + seed));
  return +(base + (rnd() - 0.5) * 4.2).toFixed(2);
}
