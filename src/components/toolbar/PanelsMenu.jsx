/**
 * PanelsMenu.jsx — botón «Panels» (73×32) con los paneles laterales.
 * En el original dependen del usuario (401 en Guest Mode): aquí son un mock
 * funcional local, con los mismos estados de apertura y cierre.
 */
import { ChevronDown, LayoutPanelLeft, PanelRight } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import Dropdown from '../ui/Dropdown.jsx';

const ITEMS = [
  { id: 'watchlist', label: 'Watchlist', hint: 'Lista de seguimiento', side: 'right' },
  { id: 'orderbook', label: 'Order book', hint: 'Libro de órdenes simulado', side: 'right' },
  { id: 'trades', label: 'Time & sales', hint: 'Cintas de operaciones', side: 'right' },
  { id: 'objects', label: 'Objects', hint: 'Dibujos y objetos', side: 'right' },
  { id: 'chat', label: 'Chart chat', hint: 'Sala simulada', side: 'left' },
];

export default function PanelsMenu() {
  const { panels, togglePanel } = useTerminal();
  const openCount = Object.values(panels).filter(Boolean).length;

  return (
    <Dropdown
      width={256}
      align="right"
      title="Paneles"
      trigger={({ toggle, open }) => (
        <button className={'tb-panels' + (open ? ' is-active' : '')} onClick={toggle} title="Paneles laterales">
          <LayoutPanelLeft size={13} />
          <span>Panels</span>
          {openCount > 0 && <span className="tb-indicators__count">{openCount}</span>}
          <ChevronDown size={12} />
        </button>
      )}
    >
      {() => (
        <>
          <div className="menu__title">Paneles</div>
          {ITEMS.map((it) => (
            <button key={it.id} className={'menu__item' + (panels[it.id] ? ' is-active' : '')} onClick={() => togglePanel(it.id)}>
              {it.side === 'left' ? <LayoutPanelLeft size={14} /> : <PanelRight size={14} />}
              <span className="label-col">{it.label}<em>{it.hint}</em></span>
              <span className={'switch' + (panels[it.id] ? ' on' : '')}><i /></span>
            </button>
          ))}
          <div className="menu__sep" />
          <div className="menu__note">Contenido simulado en local: la cuenta y el flujo reales del original están tras el inicio de sesión.</div>
        </>
      )}
    </Dropdown>
  );
}
