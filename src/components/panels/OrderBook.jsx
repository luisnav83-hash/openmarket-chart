/**
 * OrderBook.jsx — libro de órdenes simulado (14 niveles por lado) con barras
 * de profundidad proporcionales y precio medio en el centro.
 */
import { useEffect, useMemo, useState } from 'react';
import SidePanel from './SidePanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';
import { buildOrderBook } from '../../data/microstructure.js';

export default function OrderBook() {
  const { ticker, stats, togglePanel } = useTerminal();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1500);
    return () => clearInterval(t);
  }, []);

  const book = useMemo(() => buildOrderBook(ticker + tick, stats.last.close), [ticker, tick, stats.last.close]);
  const d = stats.last.close > 1000 ? 1 : 4;
  const fmt = (n, dec = d) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const Row = ({ r, side }) => {
    const pct = Math.min(100, (r.total / book.maxTotal) * 100);
    return (
      <div className={'ob-row ' + side}>
        <span className="px">{fmt(r.price)}</span>
        <span className="amt">{r.size.toFixed(3)}</span>
        <span className="tot">{r.total.toFixed(2)}</span>
        <span className="ob-depth" style={{ width: pct + '%' }} />
      </div>
    );
  };

  return (
    <SidePanel title="Order book" subtitle="Simulado" onClose={() => togglePanel('orderbook')}>
      <div className="ob-head">
        <span>Precio</span>
        <span style={{ textAlign: 'right' }}>Tamaño</span>
        <span style={{ textAlign: 'right' }}>Total</span>
      </div>
      <div className="ob-ask-group">
        {book.asks.slice(0, 7).map((r, i) => <Row key={'a' + i} r={r} side="ask" />)}
      </div>
      <div className="ob-spread">
        <span>{fmt(book.mid)}</span>
        <span className="dim">spread {book.spread.toFixed(book.spread > 1 ? 2 : 4)}</span>
      </div>
      {book.bids.slice(0, 7).map((r, i) => <Row key={'b' + i} r={r} side="bid" />)}
    </SidePanel>
  );
}
