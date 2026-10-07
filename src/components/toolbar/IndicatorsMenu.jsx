/**
 * IndicatorsMenu.jsx — botón «Indicators N/M» (126×32, 11 px) con la lista de
 * indicadores: superpuestos (EMA 20, EMA 50, BB, VWAP) y de panel (RSI, MACD).
 */
import { ChevronDown, Pin, Plus } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import Dropdown from '../ui/Dropdown.jsx';

export default function IndicatorsMenu() {
  const { indicators, toggleIndicator, activeOverlays } = useTerminal();
  const overlays = indicators.filter((i) => i.kind === 'overlay');
  const panes = indicators.filter((i) => i.kind === 'pane');
  const total = indicators.length;

  const Row = ({ i }) => (
    <button className="menu__item" onClick={() => toggleIndicator(i.id)}>
      <span className="swatch" style={{ background: i.color, height: 3, width: 12 }} />
      <span className="label-col">{i.label}</span>
      <span className={'switch' + (i.enabled ? ' on' : '')} style={{ marginLeft: 'auto' }}><i /></span>
      <Pin size={12} className="dim" />
    </button>
  );

  return (
    <Dropdown
      width={268}
      align="right"
      title="Indicadores"
      trigger={({ toggle, open }) => (
        <button className={'tb-indicators' + (activeOverlays ? ' has-active' : '') + (open ? ' is-active' : '')} onClick={toggle} title="Indicadores del gráfico">
          <Plus size={13} />
          <span className="tb-indicators__label">Indicators</span>
          <span className="tb-indicators__count">{activeOverlays}/{total}</span>
          <ChevronDown size={12} />
        </button>
      )}
    >
      {() => (
        <>
          <div className="menu__title">Superpuestos en el precio</div>
          {overlays.map((i) => <Row key={i.id} i={i} />)}
          <div className="menu__sep" />
          <div className="menu__title">Panel inferior</div>
          {panes.map((i) => <Row key={i.id} i={i} />)}
          <div className="menu__sep" />
          <div className="menu__note">Indicadores calculados a mano sobre 1 400 velas locales (sin librerías).</div>
        </>
      )}
    </Dropdown>
  );
}
