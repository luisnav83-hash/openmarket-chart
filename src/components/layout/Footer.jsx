/**
 * Footer.jsx — pie del terminal (36 px en escritorio, 50 px en móvil).
 * Del original: «Chat» 52×26, sesión CME, reloj mono 12 px/600 y latencia
 * 77×26 en 11 px. Aquí se añaden distribución y contador de objetos.
 */
import { useEffect, useState } from 'react';
import { Activity, LayoutPanelLeft, MessageSquare, Trash2 } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import { useClock, nextSessionLabel } from '../../hooks/useClock.js';

export default function Footer() {
  const { interval, layout, setLayout, togglePanel, panels, drawings, clearDrawings, toast } = useTerminal();
  const { clock, latency, offsetLabel } = useClock({ intervalSeconds: interval.seconds });
  const [session, setSession] = useState(nextSessionLabel);

  useEffect(() => {
    const t = setInterval(() => setSession(nextSessionLabel()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="footer">
      <div className="footer__left">
        <button className={'footer-btn' + (panels.objects ? ' is-active' : '')} onClick={() => togglePanel('objects')}>
          <LayoutPanelLeft size={12} /> Objetos {drawings.length}
        </button>
        <button className="footer-btn" title="Borrar los dibujos propios" onClick={() => { clearDrawings(); toast('Dibujos borrados', 'trash'); }}>
          <Trash2 size={12} /> Limpiar
        </button>
        <span className="sep" />
        <button
          className="footer-btn"
          onClick={() => setLayout(layout === '1' ? '2v' : layout === '2v' ? '2h' : '1')}
          title="Cambiar distribución del lienzo"
        >
          Distribución: {layout === '1' ? '1 gráfico' : layout === '2v' ? '2 vertical' : '2 horizontal'}
        </button>
        <span className="footer-btn dim" style={{ cursor: 'default' }}>Datos de demostración</span>
      </div>

      <div className="footer__right">
        <button className={'footer-btn' + (panels.chat ? ' is-active' : '')} onClick={() => togglePanel('chat')} title="Abrir el chat del gráfico">
          <MessageSquare size={12} /> Chat
        </button>
        <button className="session-strip" title="Próximo evento de sesión (simulado)">
          <Activity size={11} /> {session}
        </button>
        <span className="clock" title={`Reloj UTC · ${offsetLabel}`}>{clock}<span className="dim" style={{ fontSize: 9, marginLeft: 5 }}>{offsetLabel}</span></span>
        <span className="latency" title="Latencia simulada"><i className="dot" />{latency}ms</span>
      </div>
    </footer>
  );
}
