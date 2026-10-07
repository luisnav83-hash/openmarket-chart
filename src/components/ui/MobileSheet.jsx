/**
 * MobileSheet.jsx — hoja inferior «Best on Desktop» (≤768 px), con la misma
 * estructura del original: lista de ventajas, casilla «Don't show this again»
 * y dos botones de acción.
 */
import { useState } from 'react';
import { CandlestickChart, Code2, Gauge, Layers } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

const FEATURES = [
  { icon: CandlestickChart, title: 'Más gráfico, menos pulgares', desc: 'Lienzo completo con velas, volumen, indicadores y dibujos.' },
  { icon: Layers, title: 'Paneles en paralelo', desc: 'Watchlist, libro de órdenes, cintas y objetos a la vez.' },
  { icon: Gauge, title: 'Atajos y bar replay', desc: 'Teclado, gestos de dibujo y repetición vela a vela.' },
  { icon: Code2, title: 'Tu propio código', desc: 'Indicadores calculados a mano, sin depender de terceros.' },
];

export default function MobileSheet() {
  const { sheetOpen, dismissSheet, toast, indicators } = useTerminal();
  const indicatorCount = indicators.filter((i) => i.enabled).length;
  const [dontShow, setDontShow] = useState(false);

  if (!sheetOpen) return null;

  return (
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) dismissSheet(false); }}>
      <div className="mobile-sheet" role="dialog" aria-label="Aviso de pantalla pequeña">
        <div className="mobile-sheet__handle" />
        <h2 className="mobile-sheet__title">Best on Desktop</h2>
        <p className="mobile-sheet__subtitle">
          Estás en una pantalla pequeña{indicatorCount ? ` con ${indicatorCount} indicadores activos` : ''}.
          El terminal completo está pensado para escritorio.
        </p>

        {FEATURES.map((f, idx) => (
          <div className={'feature-row' + (idx < FEATURES.length - 1 ? ' feature-row--divider' : '')} key={f.title}>
            <span className="feature-icon"><f.icon size={16} /></span>
            <span className="feature-text">
              <span className="feature-title">{f.title}</span>
              <span className="feature-desc">{f.desc}</span>
            </span>
          </div>
        ))}

        <button className={'sheet-dont-show' + (dontShow ? ' is-on' : '')} onClick={() => setDontShow((v) => !v)}>
          <span className="box">✓</span>
          Don&apos;t show this again
        </button>

        <div className="sheet-actions">
          <button className="btn" onClick={() => { dismissSheet(dontShow); toast('Continúa en vista compacta', 'check'); }}>
            Continue Anyway
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              const url = location.href;
              navigator.clipboard?.writeText(url).catch(() => {});
              toast('Enlace del espacio de trabajo copiado', 'share');
              dismissSheet(dontShow);
            }}
          >
            Copy Workspace Link
          </button>
        </div>
      </div>
    </div>
  );
}
