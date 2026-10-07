/**
 * Trades.jsx — cintas de operaciones (time & sales) simuladas, con hora,
 * precio, tamaño y side coloreado, más el exchange de origen.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import SidePanel from './SidePanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';
import { buildTape } from '../../data/microstructure.js';

export default function Trades() {
  const { ticker, stats, togglePanel } = useTerminal();
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2500);
    return () => clearInterval(t);
  }, []);

  const tape = useMemo(() => buildTape(ticker, stats.last.close, 28, now), [ticker, stats.last.close, now]);
  const d = stats.last.close > 1000 ? 1 : 4;
  const hhmmss = (t) => new Date(t).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });

  return (
    <SidePanel title="Time & sales" subtitle="Últimas 28" onClose={() => togglePanel('trades')}>
      <div className="tape-head">
        <span>Hora</span>
        <span style={{ textAlign: 'right' }}>Precio</span>
        <span style={{ textAlign: 'right' }}>Tamaño</span>
      </div>
      <div ref={listRef}>
        {tape.map((t, i) => (
          <div className={'tape-row ' + t.side} key={i} title={`${t.venue} · ${t.side === 'buy' ? 'compra' : 'venta'}`}>
            <span className="time">{hhmmss(t.time)}</span>
            <span className="px">{t.price.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}</span>
            <span className="amt">{t.size.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
