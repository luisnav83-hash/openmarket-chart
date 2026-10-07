/**
 * indicators.js — indicadores calculados a mano (sin librerías externas).
 * Todos son causales: el valor de una vela solo usa velas pasadas.
 */

export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
      out[i] = prev;
    } else if (i >= period) {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

/** Bandas de Bollinger: media simple ± k desviaciones típicas. */
export function bollinger(values, period = 20, k = 2) {
  const mid = sma(values, period);
  const upper = new Array(values.length).fill(null);
  const lower = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (values[j] - mid[i]) ** 2;
    const sd = Math.sqrt(s / period);
    upper[i] = mid[i] + k * sd;
    lower[i] = mid[i] - k * sd;
  }
  return { mid, upper, lower };
}

/** RSI de Wilder. */
export function rsi(values, period = 14) {
  const out = new Array(values.length).fill(null);
  let gain = 0, loss = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= period) {
      gain += g; loss += l;
      if (i === period) {
        gain /= period; loss /= period;
        out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
      }
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
  }
  return out;
}

/** VWAP acumulado (se reinicia cada sesión de 24 h). */
export function vwap(candles) {
  const out = new Array(candles.length).fill(null);
  let pv = 0, v = 0, day = null;
  candles.forEach((c, i) => {
    const d = Math.floor(c.time / 86400);
    if (day !== d) { day = d; pv = 0; v = 0; }
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    v += c.volume;
    out[i] = v ? pv / v : null;
  });
  return out;
}

/** Convierte un array de valores en puntos para Lightweight Charts. */
export function toLineData(candles, values) {
  const out = [];
  for (let i = 0; i < candles.length; i++) {
    if (values[i] === null || values[i] === undefined) continue;
    out.push({ time: candles[i].time, value: +values[i].toFixed(8) });
  }
  return out;
}

/**
 * macd — Moving Average Convergence Divergence (12, 26, 9) a mano.
 * Devuelve las tres series alineadas con las velas (null al principio).
 */
export function macd(values, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const line = values.map((_, i) => (emaFast[i] == null || emaSlow[i] == null ? null : emaFast[i] - emaSlow[i]));
  const defined = line.filter((v) => v != null);
  const signalDefined = ema(defined, signalPeriod);
  const offset = line.length - defined.length;
  const signal = values.map((_, i) => (i - offset < 0 ? null : signalDefined[i - offset] ?? null));
  const hist = line.map((v, i) => (v == null || signal[i] == null ? null : v - signal[i]));
  return { macd: line, signal, hist };
}
