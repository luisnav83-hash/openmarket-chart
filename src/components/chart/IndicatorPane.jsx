/**
 * IndicatorPane.jsx — panel inferior adicional (RSI / MACD).
 * Es un segundo gráfico de Lightweight Charts que comparte el eje temporal con
 * el principal: al mover o hacer zoom en uno, el otro se sincroniza.
 */
import { useEffect, useRef } from 'react';
import { createChart, LineStyle } from 'lightweight-charts';

export default function IndicatorPane({ kind, candles, series, mainApi, height = 140 }) {
  const boxRef = useRef(null);
  const chartRef = useRef(null);
  const guard = useRef(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#8f8f8f',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: '#1e1f23' }, horzLines: { color: '#1e1f23' } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.15, bottom: 0.15 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, visible: false },
      crosshair: {
        vertLine: { color: '#4a4d55', style: LineStyle.Dashed, labelBackgroundColor: '#222222' },
        horzLine: { color: '#4a4d55', style: LineStyle.Dashed, labelBackgroundColor: '#222222' },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: false } },
    });
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) chart.applyOptions({ width: Math.round(r.width), height: Math.round(r.height) });
    });
    ro.observe(el);

    // Sincronía temporal con el gráfico principal (ambas direcciones)
    const main = mainApi?.current?.chart();
    const mainTs = main?.timeScale();
    const paneTs = chart.timeScale();
    const sync = (from, to) => () => {
      const r = from.getVisibleLogicalRange();
      if (!r || guard.current) return;
      guard.current = true;
      to.setVisibleLogicalRange(r);
      guard.current = false;
    };
    const onMain = sync(mainTs, paneTs);
    const onPane = sync(paneTs, mainTs);
    if (mainTs) mainTs.subscribeVisibleLogicalRangeChange(onMain);
    paneTs.subscribeVisibleLogicalRangeChange(onPane);

    return () => {
      ro.disconnect();
      if (mainTs) mainTs.unsubscribeVisibleLogicalRangeChange(onMain);
      paneTs.unsubscribeVisibleLogicalRangeChange(onPane);
      chart.remove();
      chartRef.current = null;
    };
  }, [mainApi]);

  /* Datos del panel */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;
    // limpia y repinta
    while (chart.series && chart.series().length) chart.removeSeries(chart.series()[0]);
    if (kind === 'rsi') {
      if (series.rsi) {
        const s = chart.addLineSeries({ color: '#7ac1ff', lineWidth: 1.4, lastValueVisible: false, priceLineVisible: false });
        s.setData(candles.map((c, i) => (series.rsi[i] == null ? null : { time: c.time, value: series.rsi[i] })).filter(Boolean));
        [70, 30].forEach((level) => {
          const l = chart.addLineSeries({ color: 'rgba(120,124,133,0.35)', lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false });
          l.setData(candles.map((c) => ({ time: c.time, value: level })));
        });
      }
    } else if (kind === 'macd' && series.macd) {
      const hist = chart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false });
      hist.setData(candles.map((c, i) => (series.macd.hist[i] == null ? null : {
        time: c.time, value: series.macd.hist[i], color: series.macd.hist[i] >= 0 ? 'rgba(200,204,209,0.45)' : 'rgba(210,122,97,0.5)',
      })).filter(Boolean));
      const line = chart.addLineSeries({ color: '#e8a33d', lineWidth: 1.3, lastValueVisible: false, priceLineVisible: false });
      line.setData(candles.map((c, i) => (series.macd.macd[i] == null ? null : { time: c.time, value: series.macd.macd[i] })).filter(Boolean));
      const sig = chart.addLineSeries({ color: '#7ac1ff', lineWidth: 1.3, lastValueVisible: false, priceLineVisible: false });
      sig.setData(candles.map((c, i) => (series.macd.signal[i] == null ? null : { time: c.time, value: series.macd.signal[i] })).filter(Boolean));
    }

    // Encuadre igual al principal
    const ts = mainApi?.current?.chart()?.timeScale();
    const r = ts?.getVisibleLogicalRange();
    if (r) chart.timeScale().setVisibleLogicalRange(r);
    else chart.timeScale().scrollToRealTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, candles, series]);

  const label = kind === 'rsi' ? 'RSI 14' : 'MACD 12 26 9';
  const color = kind === 'rsi' ? '#7ac1ff' : '#e8a33d';

  return (
    <div className="indicator-pane" style={{ height }}>
      <div className="pane-label">
        <span className="legend-swatch" style={{ background: color }} />
        {label}
        <span className="pane-values">
          {kind === 'rsi'
            ? series.rsi?.[candles.length - 1]?.toFixed(2)
            : series.macd?.macd?.[candles.length - 1]?.toFixed(2)}
        </span>
      </div>
      <div className="pane-canvas" ref={boxRef} style={{ height: '100%' }} />
    </div>
  );
}
