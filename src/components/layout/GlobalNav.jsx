/**
 * GlobalNav.jsx — barra superior (40 px, fondo #121215).
 * Del original: logo (16,12 82×20), botón Layouts 48×28, pestañas de espacio de
 * trabajo de 32 px de alto con la activa destacada, «+» 26×26 y, a la derecha,
 * dos iconos de 30×30 y la píldora «Guest Mode» (10 px/700).
 */
import { useState } from 'react';
import { ChevronDown, FolderPlus, Globe, LayoutGrid, Plus, Search, Settings, UserRound } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import Dropdown from '../ui/Dropdown.jsx';

const WORKSPACES = ['therabit', 'macros', 'order-flow'];

export default function GlobalNav() {
  const { setPaletteOpen, toast, symbol, setTicker, SYMBOLS } = useTerminal();
  const [ws, setWs] = useState('therabit');
  const [recent, setRecent] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);

  return (
    <header className="global-nav">
      <span className="global-nav__logo" title="openmarket (reconstrucción)">
        <span className="mark">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
            <circle cx="10" cy="10" r="6.6" fill="none" stroke="#ff6a00" strokeWidth="2.6"
                    strokeDasharray="31 9" strokeDashoffset="5" />
          </svg>
        </span>
        <span className="brand">openmarket</span>
      </span>

      <Dropdown
        width={210}
        title="Espacios de trabajo"
        trigger={({ toggle }) => (
          <button className="top-bar-layouts__btn" onClick={toggle} title="Layouts y espacios">
            <LayoutGrid size={14} />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <div className="menu__title">Espacios de trabajo</div>
            {WORKSPACES.map((w) => (
              <button key={w} className={'menu__item' + (w === ws ? ' is-active' : '')} onClick={() => { setWs(w); close(); }}>
                {w}
                {w === ws && <span className="check">✓</span>}
              </button>
            ))}
            <div className="menu__sep" />
            <button className="menu__item" onClick={() => { close(); toast('Nueva carpeta (demo local)', 'folder'); }}>
              <FolderPlus size={13} /> Nueva carpeta
            </button>
          </>
        )}
      </Dropdown>

      <div className="workspace-tabs">
        {WORKSPACES.slice(0, 2).map((w) => (
          <button key={w} className={'workspace-tab' + (w === ws ? ' is-active' : '')} onClick={() => setWs(w)}>
            <span className="workspace-tab__icon" style={{ background: w === ws ? '#f7931a' : '#3b3c40', color: w === ws ? '#1b1207' : '#d0d3d8' }}>
              {w.slice(0, 1).toUpperCase()}
            </span>
            {w}
            {w === ws && <span className="workspace-tab__close" onClick={(e) => { e.stopPropagation(); toast('Espacio activo: no se puede cerrar', 'warn'); }}>✕</span>}
          </button>
        ))}
        <button className="workspace-new" title="Nuevo espacio de trabajo" onClick={() => toast('Nuevo espacio de trabajo (demo local)', 'plus')}>
          <Plus size={14} />
        </button>
      </div>

      <span className="spacer" />

      <div className="global-nav__right">
        <button className="icon-btn" title="Buscar símbolos (⌘K)" onClick={() => setPaletteOpen(true)}>
          <Search size={15} />
        </button>
        <Dropdown
          width={230}
          align="right"
          title="Región y ajustes"
          trigger={({ toggle }) => (
            <button className="icon-btn" title="Región / ajustes" onClick={toggle}>
              <Globe size={15} />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className="menu__title">Mercado</div>
              <button className="menu__item" onClick={() => { close(); toast('Región: Global · datos simulados', 'globe'); }}>Global (demo)</button>
              <button className="menu__item" onClick={() => { close(); toast('Región: Estados Unidos', 'globe'); }}>Estados Unidos</button>
              <div className="menu__sep" />
              <button className="menu__item" onClick={() => { close(); toast('Ajustes del gráfico (demo local)', 'settings'); }}>
                <Settings size={13} /> Ajustes del terminal
              </button>
            </>
          )}
        </Dropdown>

        <Dropdown
          width={250}
          align="right"
          title="Sesión"
          trigger={({ toggle }) => (
            <button className="guest-pill" onClick={toggle}>
              <span className="avatar"><UserRound size={10} /></span>
              <span className="label">Guest Mode</span>
              <ChevronDown size={11} />
            </button>
          )}
        >
          {({ close }) => (
            <>
              {/* En el original estas opciones exigen cuenta (401 en Guest Mode);
                  aquí son un mock local y se dice en pantalla. */}
              <div className="menu__title">Sesión no iniciada</div>
              <button className="menu__item" onClick={() => { close(); toast('Acceso sólo con cuenta (no inspeccionable)', 'lock'); }}>Iniciar sesión</button>
              <button className="menu__item" onClick={() => { close(); toast('Cartera y órdenes requieren cuenta', 'lock'); }}>Cartera y órdenes</button>
              <div className="menu__sep" />
              <div className="menu__note">Estas opciones del original están tras autenticación; aquí se simulan localmente.</div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
