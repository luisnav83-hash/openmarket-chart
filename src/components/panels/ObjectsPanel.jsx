/**
 * ObjectsPanel.jsx — gestor de objetos del gráfico: lista los dibujos, deja
 * seleccionarlos, renombrarlos, ocultarlos uno a uno o todos, y borrarlos.
 */
import { useState } from 'react';
import { Eye, EyeOff, Lock, Trash2, X } from 'lucide-react';
import SidePanel from './SidePanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';

const TYPE_LABEL = {
  trend: 'Tendencia', ray: 'Rayo', hline: 'Horizontal', vline: 'Vertical',
  rect: 'Zona', measure: 'Medición', text: 'Texto',
};

export default function ObjectsPanel() {
  const { drawings, setDrawings, clearDrawings, removeDrawing, togglePanel, toast, drawingsHidden, setDrawingsHidden } = useTerminal();
  const [editing, setEditing] = useState(null);

  const ocultos = drawings.filter((d) => d.hidden).length;

  return (
    <SidePanel
      title="Objects"
      subtitle={`${drawings.length} dibujos${ocultos ? ` · ${ocultos} ocultos` : ''}`}
      onClose={() => togglePanel('objects')}
      actions={(
        <>
          <button className="icon-btn icon-btn--sm" title="Mostrar u ocultar todos" onClick={() => setDrawingsHidden(!drawingsHidden)}>
            {drawingsHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button className="icon-btn icon-btn--sm" title="Borrar todos (los heredados se conservan)" onClick={() => { clearDrawings(); toast('Dibujos borrados · los objetos locked se conservan', 'trash'); }}>
            <Trash2 size={14} />
          </button>
        </>
      )}
    >
      {drawings.length === 0 && (
        <div className="obj-empty">
          Todavía no hay objetos.<br />Elige una herramienta del rail y haz clic en el gráfico.
        </div>
      )}

      {drawings.map((d) => (
        <div className={'obj-row' + (d.hidden ? ' is-hidden' : '')} key={d.id}>
          <span className="obj-swatch" style={{ background: d.color }} />
          <span className="obj-name" onDoubleClick={() => { if (d.shared) { toast('Objeto heredado: bloqueado, no se renombra', 'lock'); return; } setEditing(d.id); }}>
            {editing === d.id ? (
              <input
                autoFocus
                defaultValue={d.label || TYPE_LABEL[d.type] || d.type}
                style={{ width: '100%', height: 22, background: 'var(--bg-app)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 11.5, padding: '0 5px' }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  setDrawings((list) => list.map((x) => (x.id === d.id ? { ...x, label: v } : x)));
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditing(null);
                  e.stopPropagation();
                }}
              />
            ) : (d.label || TYPE_LABEL[d.type] || d.type)}
          </span>
          <span className="dim" style={{ fontSize: 10 }}>{d.shared ? 'heredado' : TYPE_LABEL[d.type]}</span>
          <button className="obj-btn" title={d.hidden ? 'Mostrar' : 'Ocultar'} onClick={() => setDrawings((list) => list.map((x) => (x.id === d.id ? { ...x, hidden: !x.hidden } : x)))}>
            {d.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          {d.shared ? (
            <span className="obj-btn" title="Objeto del chart compartido (locked)" style={{ color: 'var(--warn)' }}><Lock size={12} /></span>
          ) : (
            <button className="obj-btn" title="Eliminar" onClick={() => removeDrawing(d.id)}>
              <X size={13} />
            </button>
          )}
        </div>
      ))}

      <div className="menu__note" style={{ padding: '10px 7px' }}>
        Doble clic en el nombre para renombrar · Supr borra el seleccionado · los objetos heredados van bloqueados.
      </div>
    </SidePanel>
  );
}
