/**
 * ToolRail.jsx — barra lateral de herramientas (52 px, desde y=124).
 * Del original: pestaña de 16 px para mostrar/ocultar y ~18 iconos apilados.
 * Aquí: puntero + 7 herramientas de dibujo + utilidades del gráfico.
 */
import { useEffect, useState } from 'react';
import {
  ArrowUpRight, ChevronLeft, ChevronRight, Eraser, Eye, EyeOff, Lock, Magnet, Minus,
  MousePointer2, MoveUpRight, Redo2, Ruler, Slash, Square, Trash2, Type, Undo2, Unlock,
} from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

const TOOLS = [
  { id: 'cursor', icon: MousePointer2, label: 'Puntero', key: 'V' },
  { id: 'trend', icon: Slash, label: 'Línea de tendencia', key: 'T' },
  { id: 'ray', icon: ArrowUpRight, label: 'Rayo', key: 'R' },
  { id: 'hline', icon: Minus, label: 'Línea horizontal', key: 'H' },
  { id: 'vline', icon: MoveUpRight, label: 'Línea vertical', key: 'J' },
  { id: 'rect', icon: Square, label: 'Zona / rectángulo', key: 'B' },
  { id: 'measure', icon: Ruler, label: 'Medir distancia', key: 'M' },
  { id: 'text', icon: Type, label: 'Etiqueta de texto', key: 'X' },
];

export default function ToolRail() {
  const {
    tool, setTool, railOpen, setRailOpen, drawingsLocked, setDrawingsLocked,
    drawings, setDrawings, clearDrawings, removeLastDrawing, drawingsHidden, setDrawingsHidden, toast, panels, togglePanel,
  } = useTerminal();
  const [snap, setSnap] = useState(true);

  /* Atajos de teclado de las herramientas (V T R H J B M X) */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase());
      if (hit) { setTool(hit.id); if (hit.id !== 'cursor') toast(`${hit.label}: clic en el gráfico`, 'pencil', 1600); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTool, toast]);

  if (!railOpen) {
    return (
      <div className="tool-rail__hidden" title="Mostrar herramientas" onClick={() => setRailOpen(true)}>
        <ChevronRight size={12} style={{ transform: 'none' }} />
      </div>
    );
  }

  return (
    <aside className="tool-rail" aria-label="Herramientas de dibujo">
      <button className="tool-rail__btn" title="Ocultar herramientas" onClick={() => setRailOpen(false)}>
        <ChevronLeft size={13} />
      </button>

      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={'tool-rail__btn' + (tool === t.id ? ' is-active' : '')}
          title={`${t.label} · ${t.key}`}
          onClick={() => { setTool(t.id); if (t.id !== 'cursor') toast(`${t.label}: clic en el gráfico`, 'pencil', 1600); }}
        >
          <t.icon size={17} />
        </button>
      ))}

      <span className="tool-rail__sep" />

      <button className={'tool-rail__btn' + (snap ? ' is-active' : '')} title="Imán a precios" onClick={() => { setSnap((v) => !v); toast(snap ? 'Imán desactivado' : 'Imán activado', 'magnet'); }}>
        <Magnet size={16} />
      </button>
      <button className={'tool-rail__btn' + (drawingsLocked ? ' is-locked' : '')} title={drawingsLocked ? 'Dibujos bloqueados' : 'Bloquear dibujos'} onClick={() => { setDrawingsLocked(!drawingsLocked); toast(drawingsLocked ? 'Dibujos desbloqueados' : 'Dibujos bloqueados', drawingsLocked ? 'unlock' : 'lock'); }}>
        {drawingsLocked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <button className={'tool-rail__btn' + (drawingsHidden ? ' is-active' : '')} title={drawingsHidden ? 'Mostrar dibujos' : 'Ocultar dibujos'} onClick={() => { setDrawingsHidden(!drawingsHidden); toast(drawingsHidden ? 'Dibujos visibles' : 'Dibujos ocultos', drawingsHidden ? 'eye' : 'eye-off'); }}>
        {drawingsHidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button className="tool-rail__btn" title="Deshacer el último dibujo propio" onClick={() => { removeLastDrawing(); toast('Último dibujo eliminado', 'undo'); }}>
        <Undo2 size={16} />
      </button>
      <button className="tool-rail__btn" title="Borrar los dibujos propios (los heredados se conservan)" onClick={() => { clearDrawings(); toast('Dibujos borrados', 'trash'); }}>
        <Trash2 size={16} />
      </button>
      <button className="tool-rail__btn" title="Borrador: vacía los objetos propios" onClick={() => { setTool('cursor'); clearDrawings(); toast('Objetos borrados', 'eraser'); }}>
        <Eraser size={16} />
      </button>

      <span className="tool-rail__sep" />

      <button className="tool-rail__btn" title="Regenerar datos simulados" onClick={() => { window.dispatchEvent(new CustomEvent('oc:reload')); toast('Datos locales regenerados', 'redo'); }}>
        <Redo2 size={16} />
      </button>
      <button className={'tool-rail__btn' + (panels.objects ? ' is-active' : '')} title="Gestor de objetos" onClick={() => togglePanel('objects')}>
        <Square size={15} />
      </button>
    </aside>
  );
}
