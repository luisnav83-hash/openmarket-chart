/**
 * IntervalRuler.jsx — botones de intervalo (28 px de alto, 32 de ancho mínimo;
 * el activo se rellena). El chevron abre la lista completa por grupos.
 */
import { ChevronDown } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';
import Dropdown from '../ui/Dropdown.jsx';

export default function IntervalRuler() {
  const { intervalId, setIntervalBy, INTERVALS } = useTerminal();
  const quick = INTERVALS.filter((i) => ['1m', '5m', '1h'].includes(i.id));
  const groups = [...new Set(INTERVALS.map((i) => i.group))];

  return (
    <div className="tb-rung" role="tablist" aria-label="Intervalo de tiempo">
      {quick.map((i) => (
        <button
          key={i.id}
          role="tab"
          aria-selected={intervalId === i.id}
          className={'interval-btn' + (intervalId === i.id ? ' is-active' : '')}
          onClick={() => setIntervalBy(i.id)}
          title={`${i.label} · ${i.seconds} s`}
        >{i.id}</button>
      ))}

      <Dropdown
        width={236}
        title="Todos los intervalos"
        trigger={({ toggle }) => (
          <button className="interval-btn" onClick={toggle} title="Todos los intervalos" style={{ minWidth: 24, padding: '0 4px' }}>
            <ChevronDown size={14} />
          </button>
        )}
      >
        {({ close }) => (
          <>
            {groups.map((g) => (
              <div key={g}>
                <div className="menu__title">{g}</div>
                <div className="menu__grid">
                  {INTERVALS.filter((i) => i.group === g).map((i) => (
                    <button
                      key={i.id}
                      className={'menu__chip' + (intervalId === i.id ? ' is-active' : '')}
                      onClick={() => { setIntervalBy(i.id); close(); }}
                    >{i.id}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="menu__sep" />
            <div className="menu__note">Los intervalos se generan en local a partir de datos de demostración.</div>
          </>
        )}
      </Dropdown>
    </div>
  );
}
