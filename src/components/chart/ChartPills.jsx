/**
 * ChartPills.jsx — píldoras sobre el gráfico, medidas del original:
 *   · «High / Low» del rango visible pegadas al eje derecho (fondo #222, 10 px)
 *   · etiqueta de precio actual + cuenta atrás de cierre de vela
 *   · etiqueta del último dibujo creado (drawing-tag, rojo #ff003c)
 */
import { useEffect, useState } from 'react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import { useClock } from '../../hooks/useClock.js';

export default function ChartPills({ api }) {
  const { stats, symbol, interval, candles } = useTerminal();
  const { countdown } = useClock({ intervalSeconds: interval.seconds });
  const [marks, setMarks] = useState({ high: null, low: null, last: null });

  /* Recoloca las píldoras cuando cambia la vista, el símbolo o llega una vela */
  useEffect(() => {
    let raf = 0;
    const place = () => {
      const chart = api?.current?.chart();
      const ps = api?.current?.priceSeries();
      if (!chart || !ps) return;
      const ts = chart.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const from = Math.max(0, Math.floor(range.from));
      const to = Math.min(candles.length - 1, Math.ceil(range.to));
      let hi = -Infinity, lo = Infinity, hiC = null, loC = null;
      for (let i = from; i <= to; i++) {
        const c = candles[i];
        if (!c) continue;
        if (c.high > hi) { hi = c.high; hiC = c; }
        if (c.low < lo) { lo = c.low; loC = c; }
      }
      setMarks({
        high: hiC ? { y: ps.priceToCoordinate(hi), price: hi } : null,
        low: loC ? { y: ps.priceToCoordinate(lo), price: lo } : null,
        last: { y: ps.priceToCoordinate(stats.last.close), price: stats.last.close },
      });
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    schedule();
    const ts = api?.current?.chart()?.timeScale();
    ts?.subscribeVisibleLogicalRangeChange(schedule);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      ts?.unsubscribeVisibleLogicalRangeChange(schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [api, candles, stats.last.close, symbol.ticker, interval.id]);

  const d = symbol.price > 1000 ? 2 : symbol.price > 10 ? 3 : 5;
  const nf = (n) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));

  return (
    <>
      {marks.high && (
        <span className="range-pill" style={{ top: marks.high.y }} title="Máximo del rango visible">
          High <b>{nf(marks.high.price)}</b>
        </span>
      )}
      {marks.low && (
        <span className="range-pill" style={{ top: marks.low.y }} title="Mínimo del rango visible">
          Low <b>{nf(marks.low.price)}</b>
        </span>
      )}
      {marks.last && (
        <span className="candle-countdown" style={{ top: marks.last.y }} title="Cierre de la vela en curso">
          {countdown}
        </span>
      )}
    </>
  );
}
