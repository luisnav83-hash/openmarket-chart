/**
 * ChartToolbar.jsx — barra del gráfico (44 px, fondo #202126).
 * Orden y medidas del original: búsqueda 40×40 · ficha de símbolo (exchange
 * arriba, par abajo) · intervalos · tipo de gráfico 59×28 · distribución
 * 53×28 · estadísticas 24H VOLUME / OPEN INTEREST / FUNDING · «Indicators»
 * 126×32 · iconos 32×32 · «Panels» 73×32 · terminal 32×32.
 */
import { useEffect, useState } from 'react';
import {
  AlignHorizontalJustifyEnd, BarChart3, CandlestickChart, ChevronDown, Code2, Download,
  Expand, Moon, Search, Settings2, Share2, SquareChartGantt, Sun, TerminalSquare,
} from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import IntervalRuler from './IntervalRuler.jsx';
import { useClock } from '../../hooks/useClock.js';
import IndicatorsMenu from './IndicatorsMenu.jsx';
import PanelsMenu from './PanelsMenu.jsx';
import Dropdown from '../ui/Dropdown.jsx';

const CHART_TYPES = [
  { id: 'candles', label: 'Velas', icon: CandlestickChart },
  { id: 'bars', label: 'Barras', icon: BarChart3 },
  { id: 'line', label: 'Línea', icon: SquareChartGantt },
  { id: 'area', label: 'Área', icon: AlignHorizontalJustifyEnd },
];

const LAYOUTS = [
  { id: '1', label: '1 gráfico' },
  { id: '2v', label: '2 vertical' },
  { id: '2h', label: '2 horizontal' },
];

export default function ChartToolbar() {
  const {
    symbol, stats, chartType, setChartType, activeOverlays, setPaletteOpen, toast,
    layout, setLayout, interval,
  } = useTerminal();
  const { countdown } = useClock({ intervalSeconds: interval.seconds });
  const [dark, setDark] = useState(true);
  const digits = symbol.price > 1000 ? 2 : symbol.price > 10 ? 3 : 5;
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const current = CHART_TYPES.find((c) => c.id === chartType);
  const TypeIcon = current.icon;

  return (
    <div className="chart-toolbar">
      <button className="tb-super-search" title="Buscar símbolos y comandos (⌘K)" onClick={() => setPaletteOpen(true)}>
        <Search size={17} />
      </button>

      <button className="tb-symbol" onClick={() => setPaletteOpen(true)} title="Cambiar de símbolo">
        <span className="tb-symbol__text">
          <span className="tb-symbol__ex">
            <i className="dot" />
            <span className="ex-name">{symbol.exchange}</span>
          </span>
          <span className="tb-symbol__ticker">{symbol.base}<span className="dim" style={{ fontWeight: 500 }}>/{symbol.quote}</span></span>
          <span className="tb-symbol__meta">{symbol.name} · perpetuo</span>
        </span>
      </button>

      <div className="tb-price">
        <b>{fmt(stats.last.close)}</b>
        <span className={stats.changePct >= 0 ? 'up' : 'down'}>
          {stats.changePct >= 0 ? '+' : ''}{stats.changePct.toFixed(2)}%
        </span>
      </div>

      <IntervalRuler />

      <span className="sep" />

      <Dropdown
        width={220}
        title="Tipo de gráfico"
        trigger={({ toggle }) => (
          <button className="tb-chip tb-chip--charttype" onClick={toggle} title="Tipo de gráfico">
            <TypeIcon size={14} />
            <span className="tb-chip--charttype-label">{current.label}</span>
            <ChevronDown size={12} />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <div className="menu__title">Tipo de gráfico</div>
            {CHART_TYPES.map((c) => (
              <button key={c.id} className={'menu__item' + (chartType === c.id ? ' is-active' : '')} onClick={() => { setChartType(c.id); close(); }}>
                <c.icon size={14} /> {c.label}
                {chartType === c.id && <span className="check">✓</span>}
              </button>
            ))}
          </>
        )}
      </Dropdown>

      <Dropdown
        width={200}
        title="Distribución"
        trigger={({ toggle }) => (
          <button className="tb-chip tb-chip--layout" onClick={toggle} title="Distribución del lienzo">
            <Expand size={14} />
            <span>{LAYOUTS.find((l) => l.id === layout)?.label.replace(' gráfico', '')}</span>
          </button>
        )}
      >
        {({ close }) => (
          <>
            <div className="menu__title">Distribución</div>
            {LAYOUTS.map((l) => (
              <button key={l.id} className={'menu__item' + (layout === l.id ? ' is-active' : '')} onClick={() => { setLayout(l.id); close(); }}>
                {l.label}
                {layout === l.id && <span className="check">✓</span>}
              </button>
            ))}
          </>
        )}
      </Dropdown>

      <div className="tb-stats">
        <button className="tb-stat" onClick={() => toast('Volumen 24 h simulado en local', 'stats')} title="Volumen 24 h">
          <span className="tb-stat__label">24H VOLUME</span>
          <span className="tb-stat__value">{stats.volumeLabel}</span>
        </button>
        <button className="tb-stat tb-stat--oi" onClick={() => toast('Open interest simulado en local', 'stats')} title="Interés abierto">
          <span className="tb-stat__label">OPEN INTEREST</span>
          <span className="tb-stat__value">{stats.oiLabel}</span>
        </button>
        <button className="tb-stat tb-stat--funding" onClick={() => toast('Funding simulado en local', 'stats')} title="Tasa de financiación">
          <span className="tb-stat__label">FUNDING</span>
          <span className={'tb-stat__value ' + (stats.fundingRate >= 0 ? 'is-up' : 'is-down')}>
            {(stats.fundingRate * 100).toFixed(4)}%
          </span>
        </button>
        <div className="tb-stat tb-stat--last" title="Tiempo hasta el cierre de la vela en curso">
          <span className="tb-stat__label">COUNTDOWN</span>
          <span className="tb-stat__value mono">{countdown}</span>
        </div>
      </div>

      <div className="tb-right">
        <IndicatorsMenu />

        <button className="icon-btn icon-btn--lg" title="Medir distancias" onClick={() => toast('Herramienta Medir: elige la regla en el rail', 'ruler')}>
          <SquareChartGantt size={15} />
        </button>
        <button className="icon-btn icon-btn--lg" title="Editor de scripts (demo local)" onClick={() => toast('Editor de scripts: no inspeccionable (requiere cuenta)', 'code')}>
          <Code2 size={15} />
        </button>
        <Dropdown
          width={230}
          align="right"
          title="Compartir y exportar"
          trigger={({ toggle }) => (
            <button className="icon-btn icon-btn--lg" title="Compartir o exportar" onClick={toggle}>
              <Share2 size={15} />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <button className="menu__item" onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast('Enlace copiado (demo local)', 'share'); close(); }}>
                <Share2 size={13} /> Copiar enlace
              </button>
              <button className="menu__item" onClick={() => { toast('Exportar imagen del gráfico (demo local)', 'download'); close(); }}>
                <Download size={13} /> Exportar imagen
              </button>
              <div className="menu__sep" />
              <button className="menu__item" onClick={() => { setDark((v) => !v); toast(dark ? 'Tema claro (demo local)' : 'Tema oscuro', dark ? 'sun' : 'moon'); close(); }}>
                {dark ? <Sun size={13} /> : <Moon size={13} />} Cambiar tema
              </button>
            </>
          )}
        </Dropdown>
        <button className="icon-btn icon-btn--lg" title="Ajustes del gráfico" onClick={() => toast('Ajustes del gráfico (demo local)', 'settings')}>
          <Settings2 size={15} />
        </button>

        <PanelsMenu />

        <button className="icon-btn icon-btn--lg" title="Terminal (requiere cuenta en el original)" onClick={() => toast('Terminal y órdenes: tras autenticación · no inspeccionable', 'lock')}>
          <TerminalSquare size={16} />
        </button>
      </div>
    </div>
  );
}
