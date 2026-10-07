/**
 * ChartLegend.jsx — leyenda del gráfico (arriba a la izquierda).
 * Estructura del original: título «BTC USDT  Bitcoin  5m», línea OHLC con el
 * cambio, fila «Vol», chip plegable «N indicators» y las filas de indicadores
 * (EMA 20, EMA 50, Bollinger Bands con «Upper/Middle/Lower Band» y puntos de
 * color), cada una con su chincheta para quitarla del gráfico.
 */
import { useState } from 'react';
import { Pin } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

const fmt = (n, d = 2) => (n === undefined || n === null || Number.isNaN(n) ? '—' : n.toLocaleString('en-US', {
  minimumFractionDigits: d, maximumFractionDigits: d,
}));

export default function ChartLegend({ hover }) {
  const { symbol, interval, indicators, stats, series, candles, toggleIndicator } = useTerminal();
  const [showInd, setShowInd] = useState(true);      // filas de indicadores
  const [minimal, setMinimal] = useState(false);     // todo plegado (móvil)

  const digits = symbol.price > 1000 ? 2 : symbol.price > 10 ? 3 : 5;
  const v = hover?.values || {};
  const o = v.price?.open ?? stats.last.open;
  const h = v.price?.high ?? stats.last.high;
  const l = v.price?.low ?? stats.last.low;
  const c = v.price?.close ?? stats.last.close;
  const activos = indicators.filter((i) => i.enabled);
  const vol = candles.length ? candles[candles.length - 1].volume : null;

  /* Último valor definido de una serie (null durante el precalentado) */
  const tail = (arr) => {
    if (!arr) return undefined;
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i];
    return undefined;
  };

  const Row = ({ id, color, label, value }) => (
    <div className="legend-ind">
      <span className="swatch" style={{ background: color }} />
      <span className="ind-name">{label}</span>
      <span className="ind-val">{value}</span>
      <button
        className="legend-pin"
        title={`Quitar ${label} del gráfico`}
        onClick={() => toggleIndicator(id)}
      ><Pin size={11} /></button>
    </div>
  );

  return (
    <div className="ohlc-legend">
      <div className="legend-title">
        <button className="sym-strong" onClick={() => setMinimal((x) => !x)} title="Plegar o desplegar la leyenda">
          {symbol.base} {symbol.quote}
        </button>
        <span className="name">{symbol.name}</span>
        <span className="tf-chip">{interval.label}</span>
      </div>

      <div className="legend-ohlc">
        <span>O <b>{fmt(o, digits)}</b></span>
        <span>H <b>{fmt(h, digits)}</b></span>
        <span>L <b>{fmt(l, digits)}</b></span>
        {!minimal && <span>C <b>{fmt(c, digits)}</b></span>}
        <span className={'chg ' + (stats.changePct >= 0 ? 'up' : 'down')}>
          {minimal
            ? `${activos.length ? '+' + activos.length : '0'}`
            : `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%`}
        </span>
      </div>

      {!minimal && (
        <>
          <div className="legend-extra legend-vol">
            Vol <b>{vol == null ? '—' : vol.toFixed(2)}</b>
          </div>

          {activos.length > 0 && !showInd && (
            <button className="legend-collapse" onClick={() => setShowInd(true)}>
              <span className="bars"><i /><i /><i /></span>
              {activos.length} indicators
            </button>
          )}

          {showInd && (
            <>
              {indicators.find((i) => i.id === 'ema20')?.enabled && (
                <Row id="ema20" color="#e8a33d" label="EMA 20" value={fmt(v.ema20 ?? tail(series.ema20), digits)} />
              )}
              {indicators.find((i) => i.id === 'ema50')?.enabled && (
                <Row id="ema50" color="#cbb04a" label="EMA 50" value={fmt(v.ema50 ?? tail(series.ema50), digits)} />
              )}
              {indicators.find((i) => i.id === 'bb')?.enabled && (
                <div className="legend-ind">
                  <span className="swatch" style={{ background: '#5188ce' }} />
                  <span className="ind-name">Bollinger Bands</span>
                  <span className="ind-val">
                    Upper Band {fmt(tail(series.bb.upper), digits)}
                    <i className="dotc" style={{ background: '#5188ce' }} />
                    Middle Band {fmt(tail(series.bb.mid), digits)}
                    <i className="dotc" style={{ background: '#e8a33d' }} />
                    Lower Band {fmt(tail(series.bb.lower), digits)}
                  </span>
                  <button className="legend-pin" title="Quitar Bollinger Bands" onClick={() => toggleIndicator('bb')}>
                    <Pin size={11} />
                  </button>
                </div>
              )}
              {indicators.find((i) => i.id === 'vwap')?.enabled && (
                <Row id="vwap" color="#b07cf0" label="VWAP" value={fmt(v.vwap ?? tail(series.vwap), digits)} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
