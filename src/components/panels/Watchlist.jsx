/**
 * Watchlist.jsx — lista de seguimiento con precios simulados que se mueven
 * con cada vela nueva. Clic en una fila cambia el símbolo del gráfico.
 */
import { useEffect, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import SidePanel from './SidePanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';
import { pseudoChangePct } from '../../data/microstructure.js';

const digitsFor = (p) => (p > 1000 ? 2 : p > 10 ? 3 : 5);

export default function Watchlist() {
  const { SYMBOLS, ticker, setTicker, togglePanel, toast, indicators } = useTerminal();
  const [seed, setSeed] = useState(0);

  /* Cada 12 s «llega» un tick: los porcentajes se recalculan */
  useEffect(() => {
    const t = setInterval(() => setSeed((v) => v + 1), 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <SidePanel
      title="Watchlist"
      subtitle={`${SYMBOLS.length} símbolos`}
      onClose={() => togglePanel('watchlist')}
      actions={<button className="icon-btn icon-btn--sm" title="Añadir símbolo" onClick={() => toast('Añadir a la watchlist (demo local)', 'plus')}><Plus size={14} /></button>}
    >
      <div className="wl-head-row">
        <span>Símbolo</span>
        <span>Último</span>
        <span>24 h</span>
      </div>
      {SYMBOLS.map((s) => {
        const chg = pseudoChangePct(s.ticker, s.vol * 0.6, seed);
        return (
          <div
            key={s.ticker}
            className={'wl-row' + (s.ticker === ticker ? ' is-active' : '')}
            onClick={() => setTicker(s.ticker)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setTicker(s.ticker); }}
          >
            <span>
              <span className="wl-sym">
                {s.ticker === ticker && <Star size={10} style={{ marginRight: 4, color: 'var(--accent)' }} />}
                {s.base}
                <span className="dim">/{s.quote}</span>
              </span>
              <span className="wl-sub">{s.name} · {s.exchange}</span>
            </span>
            <span className="wl-price">{s.price.toLocaleString('en-US', { minimumFractionDigits: digitsFor(s.price), maximumFractionDigits: digitsFor(s.price) })}</span>
            <span className={'wl-chg ' + (chg >= 0 ? 'up' : 'down')}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
          </div>
        );
      })}
      <div className="menu__note" style={{ padding: '8px 7px' }}>
        {indicators.filter((i) => i.enabled).length} indicadores activos · datos de demostración
      </div>
    </SidePanel>
  );
}
