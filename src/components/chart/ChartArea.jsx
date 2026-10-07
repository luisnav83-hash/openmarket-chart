/**
 * ChartArea.jsx — zona del gráfico: lienzo real, leyenda, píldoras, controles
 * flotantes (zoom/scroll/reset, 26×26) y paneles inferiores de indicadores.
 * Gestiona la creación de dibujos: primer clic → punto inicial, segundo clic →
 * cierre; Esc cancela y Supr borra el dibujo seleccionado.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import ChartLegend from './ChartLegend.jsx';
import ChartPills from './ChartPills.jsx';
import IndicatorPane from './IndicatorPane.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';

const TWO_POINT_TOOLS = ['trend', 'ray', 'rect', 'measure'];
const fmtP = (p, d = 2) => p.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function ChartArea({ variant = 'primary' }) {
  const {
    candles, series, indicators, chartType, symbol, interval, drawings, setDrawings,
    tool, setTool, drawingsLocked, drawingsHidden, removeDrawing, toast,
  } = useTerminal();

  const chartApi = useRef(null);
  const [hover, setHover] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [paneHeights] = useState({ rsi: 130, macd: 150 });

  const digits = symbol.price > 1000 ? 2 : symbol.price > 10 ? 3 : 5;
  const panes = variant === 'primary' ? indicators.filter((i) => i.kind === 'pane' && i.enabled) : [];
  const paneTotal = panes.reduce((a, p) => a + (paneHeights[p.id] || 130), 0);

  /* Botones de zoom/scroll del original: ⌘ libera el desplazamiento */
  useEffect(() => {
    const onFit = () => chartApi.current?.fit();
    window.addEventListener('oc:fit', onFit);
    return () => window.removeEventListener('oc:fit', onFit);
  }, []);

  const onCreatePoint = useCallback(({ tool: t, point }) => {
    if (TWO_POINT_TOOLS.includes(t)) {
      if (!draft) {
        setDraft({ tool: t, point });
        toast('Haz clic en el segundo punto · Esc cancela', 'pencil', 1800);
        return;
      }
      const color = '#d97757';
      if (t === 'measure') {
        const delta = point.price - draft.point.price;
        const pct = (delta / draft.point.price) * 100;
        setDrawings((list) => [...list, {
          id: 'd' + Date.now(), type: 'measure', color: pct >= 0 ? '#7fbf8a' : '#d27a61', width: 1.6,
          points: [draft.point, point],
          label: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%  ${fmtP(Math.abs(delta), digits)}`,
        }]);
      } else if (t === 'trend') {
        const pct = ((point.price - draft.point.price) / draft.point.price) * 100;
        setDrawings((list) => [...list, {
          id: 'd' + Date.now(), type: 'trend', color, width: 1.6, points: [draft.point, point],
          label: `${fmtP(point.price, digits)}  ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        }]);
      } else {
        setDrawings((list) => [...list, { id: 'd' + Date.now(), type: t, color, width: 1.6, points: [draft.point, point] }]);
      }
      setDraft(null);
      return;
    }

    if (t === 'hline') {
      setDrawings((list) => [...list, { id: 'd' + Date.now(), type: 'hline', color: '#d97757', width: 1.4, points: [point], label: fmtP(point.price, digits) }]);
    } else if (t === 'vline') {
      setDrawings((list) => [...list, { id: 'd' + Date.now(), type: 'vline', color: '#7ac1ff', width: 1.2, points: [point] }]);
    } else if (t === 'text') {
      const text = window.prompt('Texto de la etiqueta:', 'Nota');
      if (!text) { setTool('cursor'); return; }
      setDrawings((list) => [...list, { id: 'd' + Date.now(), type: 'text', color: '#e8e6e3', width: 1, points: [point], text }]);
    }
    setTool('cursor');
  }, [draft, digits, setDrawings, setTool, toast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setDraft(null); setTool('cursor'); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && ['BODY', 'DIV'].includes(document.activeElement.tagName)) {
        removeDrawing(selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, removeDrawing, setTool]);

  const drawing = tool !== 'cursor' && !drawingsLocked;

  return (
    <section className="chart-area" aria-label={`Gráfico de ${symbol.label}`}>
      <div className="chart-canvas" style={{ bottom: paneTotal }}>
        <PriceChart
          ref={chartApi}
          candles={candles}
          series={series}
          indicators={indicators}
          chartType={chartType}
          drawings={drawingsHidden ? [] : drawings}
          tool={tool}
          locked={drawingsLocked}
          selectedId={selectedId}
          onCrosshair={setHover}
          onCreateDrawing={onCreatePoint}
          onSelectDrawing={setSelectedId}
        />
      </div>

      <ChartLegend hover={hover} />
      {variant === 'primary' && <ChartPills api={chartApi} />}

      <div className="chart-watermark" aria-hidden>
        <span>{symbol.label}</span>
        <span>{interval.label} · {symbol.exchange}</span>
      </div>

      {/* Controles flotantes (zoom −, zoom +, ←, →, reset) */}
      {variant === 'primary' && (
      <div className="chart-controls">
        <button className="icon-btn icon-btn--sm" title="Alejar" onClick={() => chartApi.current?.zoomBy(1.35)}><Minus size={13} /></button>
        <button className="icon-btn icon-btn--sm" title="Acercar" onClick={() => chartApi.current?.zoomBy(0.72)}><Plus size={13} /></button>
        <button className="icon-btn icon-btn--sm" title="Desplazar a la izquierda" onClick={() => chartApi.current?.scrollBy(-25)}><ChevronLeft size={13} /></button>
        <button className="icon-btn icon-btn--sm" title="Desplazar a la derecha" onClick={() => chartApi.current?.scrollBy(25)}><ChevronRight size={13} /></button>
        <button className="icon-btn icon-btn--sm" title="Encajar / restablecer zoom" onClick={() => chartApi.current?.fit()}><Maximize2 size={12} /></button>
      </div>
      )}

      {drawing && (
        <div className="tool-hint">
          {draft ? 'Segundo punto · Esc para cancelar' : 'Clic para colocar el punto inicial'}
        </div>
      )}

      {panes.length > 0 && (
        <div className="panes-stack">
          {panes.map((p) => (
            <IndicatorPane
              key={p.id}
              kind={p.id}
              candles={candles}
              series={series}
              mainApi={chartApi}
              height={paneHeights[p.id] || 130}
            />
          ))}
        </div>
      )}
    </section>
  );
}
