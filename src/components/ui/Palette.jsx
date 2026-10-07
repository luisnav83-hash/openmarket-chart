/**
 * Palette.jsx — super búsqueda (⌘K): símbolos, comandos y acciones.
 * Es la única forma de cambiar de activo en escritorio, igual que el panel
 * flotante del original; se abre desde la barra, la cabecera o el atajo.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

export default function Palette() {
  const {
    paletteOpen, setPaletteOpen, SYMBOLS, setTicker, setIntervalBy, toggleIndicator,
    indicators, setChartType, setLayout, togglePanel, toast,
  } = useTerminal();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (paletteOpen) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [paletteOpen]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = [];
    SYMBOLS.forEach((s) => {
      if (!term || s.ticker.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)) {
        list.push({ kind: 'sym', id: s.ticker, label: s.ticker, sub: s.name, right: s.exchange, s });
      }
    });
    const cmds = [
      { id: 'demo', label: 'Cargar velas de demostración', right: 'Acción' },
      { id: 'fullscreen', label: 'Pantalla completa', right: 'Vista' },
      { id: 'reset', label: 'Restablecer zoom del gráfico', right: 'Vista' },
    ].filter((c) => !term || c.label.toLowerCase().includes(term));
    return { list: list.slice(0, 40), cmds };
  }, [q, SYMBOLS]);

  const all = useMemo(() => [...rows.list, ...rows.cmds], [rows]);

  if (!paletteOpen) return null;

  const run = (row) => {
    if (!row) return;
    if (row.kind === 'sym') {
      setTicker(row.s.ticker);
      toast(`Símbolo: ${row.s.ticker} · ${row.s.name}`, 'check');
    } else if (row.id === 'reset') {
      toast('Vista ajustada al contenido', 'maximize');
      window.dispatchEvent(new CustomEvent('oc:fit'));
    } else if (row.id === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } else {
      window.dispatchEvent(new CustomEvent('oc:reload'));
      toast('Datos de demostración regenerados', 'redo');
    }
    setPaletteOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(v + 1, all.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(v - 1, 0)); }
    if (e.key === 'Enter') run(all[i]);
    if (e.key === 'Escape') setPaletteOpen(false);
  };

  return (
    <div className="palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setPaletteOpen(false); }}>
      <div className="palette fade-in" role="dialog" aria-label="Búsqueda de símbolos">
        <div className="palette__search">
          <Search size={15} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setI(0); }}
            onKeyDown={onKey}
            placeholder="Buscar símbolo o comando…  (BTC, ETH, zoom, pantalla)"
            aria-label="Buscar símbolo"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list">
          {all.length === 0 && <div className="palette__empty">Sin resultados para «{q}»</div>}
          {all.map((row, idx) => (
            <div
              key={(row.kind || 'cmd') + row.id}
              className={'palette__row' + (idx === i ? ' is-active' : '')}
              onMouseEnter={() => setI(idx)}
              onClick={() => run(row)}
            >
              <span className="sym">{row.label}</span>
              {row.sub && <span className="name">{row.sub}</span>}
              <span className="ex">{row.right || row.kind === 'cmd' ? (row.right || 'Comando') : ''}</span>
            </div>
          ))}
        </div>
        <div className="palette__foot">
          ↑↓ moverse · Enter abrir · Esc cerrar
          <span className="dim">{all.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
