/**
 * PriceChart.jsx — gráfico real (Lightweight Charts) con:
 *   · velas / barras / línea / área
 *   · volumen en histograma
 *   · EMA 20, EMA 50, Bandas de Bollinger (con relleno) y VWAP
 *   · capa propia de dibujos (tendencia, rayo, soporte, vertical, zona, texto)
 *   · crosshair conectado con la leyenda OHLC
 *
 * El motor del original es propio («Titan Charts»); aquí se usa una librería
 * equivalente (Lightweight Charts, MIT) reproduciendo el mismo aspecto.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import { toLineData } from '../../data/indicators.js';

const UP = '#c8ccd1';
const DOWN = '#d27a61';
const GRID = '#1e1f23';
const ACCENT = '#d97757';

const BASE_OPTIONS = {
  layout: {
    background: { type: 'solid', color: 'transparent' },
    textColor: '#8f8f8f',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: GRID, style: LineStyle.Solid },
    horzLines: { color: GRID, style: LineStyle.Solid },
  },
  rightPriceScale: {
    borderVisible: false,
    scaleMargins: { top: 0.08, bottom: 0.26 },
    entireTextOnly: false,
  },
  timeScale: {
    borderVisible: false,
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 6,
    barSpacing: 6,
    minBarSpacing: 0.6,
    shiftVisibleRangeOnNewBar: false,
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#4a4d55', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#222222' },
    horzLine: { color: '#4a4d55', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#222222' },
  },
  handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
  handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
  localization: { locale: 'en-US' },
};

const PriceChart = forwardRef(function PriceChart({
  candles, series, indicators, chartType, drawings, tool, locked, selectedId,
  onCrosshair, onReady, onCreateDrawing, onSelectDrawing,
}, ref) {
  const boxRef = useRef(null);
  const chartRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const volumeRef = useRef(null);
  const overlayRefs = useRef({});          // id → serie de línea (indicadores)
  const rafRef = useRef(0);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  /** Pide un repintado de la capa SVG en el siguiente frame. */
  const scheduleOverlay = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTick((t) => t + 1));
  }, []);

  /* ---------------- 1. Crear el gráfico ---------------- */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const chart = createChart(el, { ...BASE_OPTIONS, width: el.clientWidth, height: el.clientHeight });
    chartRef.current = chart;

    const volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeRef.current = volume;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        chart.applyOptions({ width: Math.round(r.width), height: Math.round(r.height) });
      }
      scheduleOverlay();
    });
    ro.observe(el);

    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(scheduleOverlay);
    chart.subscribeCrosshairMove((param) => {
      if (!onCrosshair) return;
      if (!param || !param.time || !param.point) { onCrosshair(null); return; }
      const values = {};
      if (priceSeriesRef.current) {
        const s = param.seriesData.get(priceSeriesRef.current);
        if (s) values.price = s;
      }
      Object.entries(overlayRefs.current).forEach(([id, entry]) => {
        const s = param.seriesData.get(entry.series);
        if (s) values[id] = s.value;
      });
      onCrosshair({ time: param.time, values });
    });

    setReady(true);
    if (onReady) onReady(chart);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      overlayRefs.current = {};
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- 2. Serie principal ---------------- */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;
    if (priceSeriesRef.current) {
      chart.removeSeries(priceSeriesRef.current);
      priceSeriesRef.current = null;
    }
    const base = {
      priceLineVisible: true, lastValueVisible: false,
      priceLineStyle: LineStyle.Dotted, priceLineWidth: 1, priceLineColor: ACCENT,
    };
    let s;
    if (chartType === 'candles') {
      s = chart.addCandlestickSeries({
        ...base, upColor: UP, downColor: DOWN, borderVisible: false,
        wickUpColor: UP, wickDownColor: DOWN,
      });
      s.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    } else if (chartType === 'bars') {
      s = chart.addBarSeries({ ...base, upColor: UP, downColor: DOWN, thinBars: false });
      s.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    } else if (chartType === 'line') {
      s = chart.addLineSeries({ ...base, color: UP, lineWidth: 2 });
      s.setData(candles.map((c) => ({ time: c.time, value: c.close })));
    } else {
      s = chart.addAreaSeries({
        ...base, lineColor: UP, lineWidth: 2,
        topColor: 'rgba(200,204,209,0.22)', bottomColor: 'rgba(200,204,209,0.02)',
      });
      s.setData(candles.map((c) => ({ time: c.time, value: c.close })));
    }
    priceSeriesRef.current = s;

    volumeRef.current.setData(candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(200,204,209,0.32)' : 'rgba(210,122,97,0.34)',
    })));

    // Encuadre inicial: ~210 velas visibles, como el original
    const len = candles.length;
    chart.timeScale().setVisibleLogicalRange({ from: len - 210, to: len + 6 });
    scheduleOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, chartType]);

  /* ---------------- 3. Indicadores superpuestos ---------------- */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;
    const defs = {
      ema20: { data: toLineData(candles, series.ema20), color: '#e8a33d', width: 1.4 },
      ema50: { data: toLineData(candles, series.ema50), color: '#cbb04a', width: 1.4 },
      vwap: { data: toLineData(candles, series.vwap), color: '#b07cf0', width: 1.4 },
      bbUp: { data: toLineData(candles, series.bb.upper), color: '#5188ce', width: 1 },
      bbMid: { data: toLineData(candles, series.bb.mid), color: 'rgba(81,136,206,0.6)', width: 1 },
      bbLow: { data: toLineData(candles, series.bb.lower), color: '#5188ce', width: 1 },
    };
    const on = (id) => !!indicators.find((i) => i.id === id)?.enabled;
    const wanted = new Set();
    if (on('ema20')) wanted.add('ema20');
    if (on('ema50')) wanted.add('ema50');
    if (on('vwap')) wanted.add('vwap');
    if (on('bb')) { wanted.add('bbUp'); wanted.add('bbMid'); wanted.add('bbLow'); }

    wanted.forEach((id) => {
      if (overlayRefs.current[id]) return;
      const s = chart.addLineSeries({
        color: defs[id].color, lineWidth: defs[id].width,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      });
      s.setData(defs[id].data);
      overlayRefs.current[id] = { series: s };
    });
    Object.keys(overlayRefs.current).forEach((id) => {
      const entry = overlayRefs.current[id];
      if (!wanted.has(id)) {
        chart.removeSeries(entry.series);
        delete overlayRefs.current[id];
      } else {
        entry.series.setData(defs[id].data);
      }
    });
    scheduleOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, series, indicators]);

  /* ---------------- 4. Conversión de coordenadas ---------------- */
  const toXY = useCallback((p) => {
    const chart = chartRef.current, ps = priceSeriesRef.current;
    if (!chart || !ps || !p) return null;
    const x = chart.timeScale().timeToCoordinate(p.time);
    const y = ps.priceToCoordinate(p.price);
    if (x === null || y === null) return null;
    return { x, y };
  }, []);

  const fromXY = useCallback((x, y) => {
    const chart = chartRef.current, ps = priceSeriesRef.current;
    if (!chart || !ps) return null;
    const time = chart.timeScale().coordinateToTime(x);
    const price = ps.coordinateToPrice(y);
    if (time === null || price === null) return null;
    return { time, price };
  }, []);

  /* ---------------- 5. Relleno de las Bandas de Bollinger ---------------- */
  const bbFill = useMemo(() => {
    void tick;                                    // recalcula al mover la vista
    if (!ready) return null;
    if (!indicators.find((i) => i.id === 'bb')?.enabled) return null;
    const chart = chartRef.current, ps = priceSeriesRef.current;
    if (!chart || !ps || !candles.length) return null;
    const range = chart.timeScale().getVisibleLogicalRange();
    if (!range) return null;
    const from = Math.max(0, Math.floor(range.from) - 2);
    const to = Math.min(candles.length - 1, Math.ceil(range.to) + 2);
    const up = [], down = [];
    for (let i = from; i <= to; i += 2) {
      const x = chart.timeScale().timeToCoordinate(candles[i].time);
      const yu = ps.priceToCoordinate(series.bb.upper[i]);
      const yl = ps.priceToCoordinate(series.bb.lower[i]);
      if (x === null || yu === null || yl === null) continue;
      up.push([x, yu]);
      down.push([x, yl]);
    }
    if (up.length < 2) return null;
    return up.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
      + ' ' + down.reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
  }, [tick, ready, series, indicators, candles]);

  /* ---------------- 6. Dibujos (tendencia, rayo, soporte, vertical…) ---------------- */
  const paths = useMemo(() => {
    void tick;
    if (!ready || !drawings.length) return [];
    const out = [];
    drawings.forEach((d) => {
      const p0 = toXY(d.points[0]);
      const p1 = d.points[1] ? toXY(d.points[1]) : null;
      const sel = d.id === selectedId;
      const common = { key: d.id, stroke: d.color, width: d.width || 1.6, sel };
      if (d.type === 'hline' && p0) {
        out.push({ ...common, kind: 'hline', y: p0.y, label: d.label });
      } else if (d.type === 'vline' && p0) {
        out.push({ ...common, kind: 'vline', x: p0.x });
      } else if (d.type === 'rect' && p0 && p1) {
        out.push({ ...common, kind: 'rect', x1: Math.min(p0.x, p1.x), y1: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) });
      } else if (d.type === 'text' && p0) {
        out.push({ ...common, kind: 'text', x: p0.x, y: p0.y, text: d.text });
      } else if ((d.type === 'trend' || d.type === 'measure') && p0 && p1) {
        out.push({ ...common, kind: 'line', x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, dash: d.type === 'measure' ? '4 4' : undefined,
                   label: d.label, labelX: (p0.x + p1.x) / 2, labelY: (p0.y + p1.y) / 2 - 12 });
      } else if (d.type === 'ray' && p0 && p1) {
        const dx = p1.x - p0.x || 1;
        const k = (4000 - p0.x) / dx;
        out.push({ ...common, kind: 'line', x1: p0.x, y1: p0.y, x2: p0.x + dx * k, y2: p0.y + (p1.y - p0.y) * k });
      } else if (d.type === 'trendline' && p0 && p1) {
        out.push({ ...common, kind: 'line', x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, label: d.label, labelX: p1.x + 6, labelY: p1.y });
      }
    });
    return out;
  }, [tick, ready, drawings, selectedId, toXY]);

  /* ---------------- 7. Interacción de dibujo y selección ---------------- */
  /**
   * Un único manejador en el contenedor:
   *  · con el puntero, selecciona el dibujo más cercano a 11 px (para poder
   *    borrarlo con Supr); al no capturar eventos, el gráfico sigue
   *    desplazándose y haciendo zoom con normalidad.
   *  · con una herramienta activa, coloca los puntos del dibujo.
   */
  const onContainerClick = useCallback((e) => {
    const box = boxRef.current;
    if (!box || !e.clientX) return;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'cursor') {
      if (!onSelectDrawing) return;
      let best = null;
      let bestD = 11;
      drawings.forEach((d) => {
        d.points.forEach((p) => {
          const xy = toXY(p);
          if (!xy) return;
          const dist = Math.hypot(xy.x - x, xy.y - y);
          if (dist < bestD) { bestD = dist; best = d.id; }
        });
      });
      onSelectDrawing(best);
      return;
    }
    if (locked || !onCreateDrawing) return;
    const p = fromXY(x, y);
    if (!p) return;
    onCreateDrawing({ tool, point: p });
  }, [tool, locked, drawings, fromXY, toXY, onCreateDrawing, onSelectDrawing]);

  useImperativeHandle(ref, () => ({
    chart: () => chartRef.current,
    priceSeries: () => priceSeriesRef.current,
    toXY,
    fromXY,
    fit: () => { chartRef.current?.timeScale().fitContent(); scheduleOverlay(); },
    zoomBy: (mult) => {
      const ts = chartRef.current?.timeScale();
      if (!ts) return;
      const r = ts.getVisibleLogicalRange();
      if (!r) return;
      const mid = (r.from + r.to) / 2;
      const half = ((r.to - r.from) / 2) * mult;
      ts.setVisibleLogicalRange({ from: mid - half, to: mid + half });
      scheduleOverlay();
    },
    scrollBy: (bars) => {
      const ts = chartRef.current?.timeScale();
      if (!ts) return;
      const r = ts.getVisibleLogicalRange();
      if (!r) return;
      ts.setVisibleLogicalRange({ from: r.from + bars, to: r.to + bars });
      scheduleOverlay();
    },
    repaint: scheduleOverlay,
    screenshot: () => chartRef.current?.takeScreenshot(),
  }), [scheduleOverlay, toXY, fromXY]);

  return (
    <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} onClick={onContainerClick}>
      {bbFill && (
        <div className="chart-overlay">
          <svg>
            <path d={bbFill} fill="rgba(23,27,34,0.55)" stroke="#5188ce" strokeWidth="0.8" strokeOpacity="0.55" />
          </svg>
        </div>
      )}
      {paths.length > 0 && (
        <div className="chart-overlay" style={{ zIndex: 3 }}>
          <svg>
          {paths.map((p) => {
            if (p.kind === 'hline') {
              return (
                <g key={p.key}>
                  <line x1="0" y1={p.y} x2="100%" y2={p.y} stroke={p.stroke} strokeWidth={p.width}
                        strokeDasharray={p.sel ? '6 3' : undefined} />
                  {p.label && <text x="6" y={p.y - 5} fill={p.stroke} fontSize="10.5" fontFamily="JetBrains Mono, monospace">{p.label}</text>}
                </g>
              );
            }
            if (p.kind === 'vline') {
              return <line key={p.key} x1={p.x} y1="0" x2={p.x} y2="100%" stroke={p.stroke} strokeWidth={p.width} strokeDasharray={p.sel ? '6 3' : undefined} />;
            }
            if (p.kind === 'rect') {
              return (
                <rect key={p.key} x={p.x1} y={p.y1} width={p.w} height={p.h}
                      fill={p.stroke} fillOpacity="0.12" stroke={p.stroke} strokeWidth={p.width} />
              );
            }
            if (p.kind === 'text') {
              return (
                <text key={p.key} x={p.x} y={p.y} fill={p.stroke} fontSize="12" fontWeight="600"
                      fontFamily="Inter, sans-serif" style={{ paintOrder: 'stroke' }} stroke="#0d0d0f" strokeWidth="3">
                  {p.text}
                </text>
              );
            }
            return (
              <g key={p.key}>
                <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.stroke} strokeWidth={p.width}
                      strokeDasharray={p.dash || (p.sel ? '6 3' : undefined)} />
                {p.label && (
                  <text x={p.labelX} y={p.labelY} fill={p.stroke} fontSize="10.5" textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace" style={{ paintOrder: 'stroke' }} stroke="#0d0d0f" strokeWidth="3">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
          </svg>
        </div>
      )}
      {/* Capa transparente: con una herramienta activa evita que el arrastre
          desplace el gráfico mientras se colocan los puntos. */}
      <div
        className={'chart-draw-layer' + (tool !== 'cursor' && !locked ? ' is-drawing' : '')}
        style={{ pointerEvents: tool !== 'cursor' && !locked ? 'auto' : 'none' }}
      />
    </div>
  );
});

export default PriceChart;
