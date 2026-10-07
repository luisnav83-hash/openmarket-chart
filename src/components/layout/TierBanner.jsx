/**
 * TierBanner.jsx — franja de 40 px bajo la cabecera (#1c1d21).
 * Reproduce el aviso del chart compartido del original:
 * «Shared chart · 🔒2 · locked · your changes are not saved» + «Save a copy».
 */
import { Lock, Save } from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

export default function TierBanner() {
  const { savedCopy, setSavedCopy, toast } = useTerminal();

  return (
    <div className="tier-banner">
      <span className="tier-banner__group">
        <span className="tier-banner__title">Shared chart</span>
        <span className="tier-banner__count" title="Dos objetos bloqueados">
          <Lock size={11} /> 2
        </span>
        <span className="pill pill--ghost" style={{ height: 18 }}>locked</span>
      </span>
      <span className="tier-banner__note">
        {savedCopy ? 'copia local · los cambios quedan en este navegador' : 'your changes are not saved'}
      </span>
      <button
        className="btn"
        onClick={() => { setSavedCopy(true); toast('Copia guardada en este navegador (mock local)', 'save'); }}
      >
        <Save size={13} />
        {savedCopy ? 'Saved' : 'Save a copy'}
      </button>
    </div>
  );
}
