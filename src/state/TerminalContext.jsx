/**
 * TerminalContext.jsx — estado del terminal (un solo sitio, sin librerías).
 *
 * Guarda lo que comparten cabecera, barra, rail, gráfico y pie: símbolo,
 * intervalo, tipo de gráfico, indicadores, herramientas de dibujo, paneles
 * laterales, avisos (toasts) y la hoja móvil «Best on Desktop».
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSymbol, INTERVALS, SYMBOLS } from '../data/symbols.js';
import { generateCandles, marketStats } from '../data/marketData.js';
import { bollinger, ema, macd, rsi, sma, vwap } from '../data/indicators.js';

const TerminalContext = createContext(null);

const BARS = 1400;

/** Indicadores disponibles en el menú «Indicators» (3 activos, como el original). */
export const INDICATOR_LIST = [
  { id: 'ema20', label: 'EMA 20', color: '#e8a33d', kind: 'overlay', period: 20, enabled: true },
  { id: 'ema50', label: 'EMA 50', color: '#cbb04a', kind: 'overlay', period: 50, enabled: true },
  { id: 'bb', label: 'Bollinger Bands', color: '#5188ce', kind: 'overlay', period: 20, k: 2, enabled: true },
  { id: 'vwap', label: 'VWAP', color: '#b07cf0', kind: 'overlay', enabled: false },
  { id: 'rsi', label: 'RSI 14', color: '#7ac1ff', kind: 'pane', period: 14, enabled: false },
  { id: 'macd', label: 'MACD 12 26 9', color: '#e8a33d', kind: 'pane', enabled: false },
];

export function TerminalProvider({ children }) {
  const [ticker, setTickerState] = useState('BTCUSDT');
  const [intervalId, setIntervalId] = useState('5m');
  const [chartType, setChartType] = useState('candles');       // candles | bars | line | area
  const [indicators, setIndicators] = useState(INDICATOR_LIST);
  const [tool, setTool] = useState('cursor');
  const [railOpen, setRailOpen] = useState(true);
  const [drawings, setDrawings] = useState([]);          // incluye los objetos heredados
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  const [drawingsHidden, setDrawingsHidden] = useState(false);
  const [layout, setLayout] = useState('1');                   // 1 | 2v | 2h
  const [panels, setPanels] = useState({ watchlist: false, orderbook: false, trades: false, chat: false, objects: false });
  const [toasts, setToasts] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDismissed, setSheetDismissed] = useState(() => {
    try { return localStorage.getItem('oc.sheetDismissed') === '1'; } catch { return false; }
  });
  const [savedCopy, setSavedCopy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const symbol = useMemo(() => getSymbol(ticker), [ticker]);
  const interval = useMemo(() => INTERVALS.find((i) => i.id === intervalId) || INTERVALS[1], [intervalId]);

  /* ---------- Datos: se recalculan al cambiar símbolo o intervalo ---------- */
  const candles = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Math.floor(now / interval.seconds) * interval.seconds;
    return generateCandles({ ticker, interval: interval.id, seconds: interval.seconds, bars: BARS, endTime });
  }, [ticker, interval, reloadKey]);

  const series = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const bb = bollinger(closes, 20, 2);
    return {
      ema20: ema(closes, 20),
      ema50: ema(closes, 50),
      bb,
      vwap: vwap(candles),
      rsi: rsi(closes, 14),
      sma50: sma(closes, 50),
      macd: macd(closes, 12, 26, 9),
    };
  }, [candles]);

  const stats = useMemo(() => marketStats(ticker, candles), [ticker, candles]);

  /* ---------- Objetos heredados del «chart compartido» (🔒 2) ----------
   * El original muestra dos objetos bloqueados en el chart compartido: aquí se
   * siembran una línea de tendencia y un nivel, marcados como `shared`, para
   * que la franja «Shared chart · 🔒 2 · locked» sea coherente de verdad. */
  useEffect(() => {
    if (!candles.length) return;
    setDrawings((list) => {
      if (list.some((d) => d.shared)) return list;
      const n = candles.length;
      const a = candles[Math.max(0, n - 150)];
      const b = candles[n - 18];
      const nivel = Math.round((candles[n - 60].close * 1.004) / 25) * 25;
      return [
        {
          id: 'shared-trend', shared: true, type: 'trend', color: '#ff003c', width: 1.6,
          points: [{ time: a.time, price: a.high * 1.006 }, { time: b.time, price: b.low * 0.998 }],
          label: b.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        {
          id: 'shared-hline', shared: true, type: 'hline', color: '#ff003c', width: 1.2,
          points: [{ time: b.time, price: nivel }],
          label: nivel.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        ...list,
      ];
    });
  }, [candles]);
  const reloadData = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ---------- Avisos ---------- */
  const toastTimers = useRef([]);
  const toast = useCallback((text, icon = 'info', ms = 2600) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-3), { id, text, icon }]);
    const t = setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), ms);
    toastTimers.current.push(t);
  }, []);
  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);

  /* ---------- Acciones ---------- */
  const setTicker = useCallback((t) => { setTickerState(t); setDrawings([]); }, []);
  const setIntervalBy = useCallback((id) => { setIntervalId(id); setDrawings([]); }, []);
  const toggleIndicator = useCallback((id) => {
    setIndicators((list) => list.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)));
  }, []);
  const togglePanel = useCallback((id) => {
    setPanels((p) => ({ ...p, [id]: !p[id] }));
  }, []);
  const addDrawing = useCallback((d) => setDrawings((list) => [...list, { ...d, id: 'd' + Date.now() + Math.random().toString(36).slice(2, 6) }]), []);
  /** Borra los dibujos propios pero conserva los objetos heredados (locked). */
  const clearDrawings = useCallback(() => setDrawings((list) => list.filter((d) => d.shared)), []);
  /** Elimina un dibujo concreto (los heredados no se pueden borrar). */
  const removeDrawing = useCallback((id) => setDrawings((list) => list.filter((d) => d.id !== id || d.shared)), []);
  const removeLastDrawing = useCallback(() => setDrawings((l) => {
    const idx = [...l].reverse().findIndex((d) => !d.shared);
    if (idx < 0) return l;
    const real = l.length - 1 - idx;
    return l.filter((_, i) => i !== real);
  }), []);
  const dismissSheet = useCallback((remember) => {
    setSheetOpen(false);
    if (remember) {
      setSheetDismissed(true);
      try { localStorage.setItem('oc.sheetDismissed', '1'); } catch { /* sin almacenamiento */ }
    }
  }, []);

  /* ---------- Hoja «Best on Desktop» en pantallas pequeñas ---------- */
  useEffect(() => {
    const check = () => {
      const small = window.innerWidth < 768;
      if (small && !sheetDismissed) setSheetOpen(true);
      else if (!small) setSheetOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [sheetDismissed]);

  /* ---------- Atajos de teclado ( ⌘K / Ctrl+K ) ---------- */
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeOverlays = indicators.filter((i) => i.kind === 'overlay' && i.enabled).length;

  const value = {
    // datos
    ticker, symbol, intervalId, interval, candles, series, stats, SYMBOLS, INTERVALS,
    // preferencias
    chartType, setChartType, indicators, toggleIndicator, activeOverlays,
    tool, setTool, railOpen, setRailOpen,
    drawings, addDrawing, clearDrawings, removeLastDrawing, removeDrawing, setDrawings,
    drawingsLocked, setDrawingsLocked, drawingsHidden, setDrawingsHidden,
    layout, setLayout, panels, togglePanel,
    // ui
    toasts, toast, paletteOpen, setPaletteOpen,
    sheetOpen, dismissSheet, savedCopy, setSavedCopy,
    // acciones
    setTicker, setIntervalBy, reloadData,
  };

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error('useTerminal debe usarse dentro de <TerminalProvider>');
  return ctx;
}
