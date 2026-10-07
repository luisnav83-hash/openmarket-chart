/**
 * ChatPanel.jsx — chat del gráfico. En el original exige sesión (401 en
 * Guest Mode), por eso aquí es un mock local: mensajes de ejemplo y un
 * compositor que añade los tuyos a la lista en memoria.
 */
import { useState } from 'react';
import { Send } from 'lucide-react';
import SidePanel from './SidePanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';

const SEED = [
  { user: 'trader_ana', color: '#d97757', text: 'Buen rechazo en la EMA 50, ¿confirmáis?', min: 4 },
  { user: 'quant_carlos', color: '#5188ce', text: 'El volumen del tramo asiático sigue bajo.', min: 9 },
  { user: 'lucia', color: '#7ac77e', text: 'Bandas abriendo: cuidado con la expansión.', min: 14 },
];

export default function ChatPanel() {
  const { togglePanel, symbol } = useTerminal();
  const [msgs, setMsgs] = useState(SEED);
  const [text, setText] = useState('');

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { user: 'tú', color: 'var(--accent)', text: t, min: 0, self: true }]);
    setText('');
  };

  return (
    <SidePanel
      title="Chart chat"
      subtitle={`#${symbol.base.toLowerCase()}-flow`}
      onClose={() => togglePanel('chat')}
    >
      <div className="chat-list">
        {msgs.map((m, i) => (
          <div className="chat-msg" key={i}>
            <span className="chat-avatar" style={{ background: m.color }}>{m.user.slice(0, 2).toUpperCase()}</span>
            <span className="chat-body">
              <span className="chat-meta">
                <span className="chat-user">{m.user}</span>
                <span className="chat-time">{m.self ? 'ahora' : `hace ${m.min} min`}</span>
              </span>
              <span className="chat-text">{m.text}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="chat-composer">
        <input
          value={text}
          placeholder="Escribe un mensaje…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="icon-btn" title="Enviar" onClick={send}><Send size={15} /></button>
      </div>
      <div className="menu__note">Sala simulada en local: en el original requiere cuenta.</div>
    </SidePanel>
  );
}
