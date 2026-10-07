/**
 * symbols.js — catálogo de instrumentos de la demo.
 *
 * Son datos ficticios pero realistas (niveles de precio, decimales y
 * volatilidad acordes a cada activo). No se conecta ninguna API ni se
 * necesitan claves: todo se genera en local (ver marketData.js).
 */
export const SYMBOLS = [
  { ticker: 'BTCUSDT', base: 'BTC', quote: 'USDT', name: 'Bitcoin', exchange: 'BINANCE.F', meta: 'GLOBAL', price: 83328.8, vol: 0.42, decimals: 1 },
  { ticker: 'ETHUSDT', base: 'ETH', quote: 'USDT', name: 'Ethereum', exchange: 'BINANCE.F', meta: 'GLOBAL', price: 3142.6, vol: 0.55, decimals: 2 },
  { ticker: 'SOLUSDT', base: 'SOL', quote: 'USDT', name: 'Solana', exchange: 'BINANCE.F', meta: 'US', price: 190.35, vol: 0.72, decimals: 2 },
  { ticker: 'BNBUSDT', base: 'BNB', quote: 'USDT', name: 'BNB', exchange: 'BINANCE.F', meta: 'GLOBAL', price: 612.4, vol: 0.5, decimals: 2 },
  { ticker: 'XRPUSDT', base: 'XRP', quote: 'USDT', name: 'XRP', exchange: 'BINANCE.F', meta: 'US', price: 2.318, vol: 0.85, decimals: 4 },
  { ticker: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', name: 'Dogecoin', exchange: 'BINANCE.F', meta: 'US', price: 0.2035, vol: 1.05, decimals: 5 },
  { ticker: 'AVAXUSDT', base: 'AVAX', quote: 'USDT', name: 'Avalanche', exchange: 'BINANCE.F', meta: 'US', price: 28.42, vol: 0.78, decimals: 3 },
  { ticker: 'LINKUSDT', base: 'LINK', quote: 'USDT', name: 'Chainlink', exchange: 'BINANCE.F', meta: 'US', price: 17.86, vol: 0.7, decimals: 3 },
];

export const INTERVALS = [
  { id: '1m', label: '1m', sub: 'MIN', seconds: 60, group: 'Minutos' },
  { id: '5m', label: '5m', sub: 'MIN', seconds: 300, group: 'Minutos' },
  { id: '15m', label: '15m', sub: 'MIN', seconds: 900, group: 'Minutos' },
  { id: '1h', label: '1h', sub: 'HORA', seconds: 3600, group: 'Horas' },
  { id: '4h', label: '4h', sub: 'HORA', seconds: 14400, group: 'Horas' },
  { id: '1d', label: '1D', sub: 'DÍA', seconds: 86400, group: 'Días' },
];

/** Intervalos que se ven directamente en la barra (el resto, en el menú). */
export const QUICK_INTERVALS = ['1m', '5m', '1h'];

export function getSymbol(ticker) {
  return SYMBOLS.find((s) => s.ticker === ticker) || SYMBOLS[0];
}

export function formatPrice(value, symbol) {
  const d = symbol ? symbol.decimals : value > 1000 ? 1 : value > 10 ? 2 : value > 1 ? 3 : 5;
  return value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function formatCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toFixed(2);
}

export function formatSigned(value, decimals = 2) {
  const s = value >= 0 ? '+' : '−';
  return s + Math.abs(value).toFixed(decimals);
}
