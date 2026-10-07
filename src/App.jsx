/**
 * App.jsx — armazón del terminal: cabecera, cuerpo y pie, más las capas
 * flotantes (paleta ⌘K, hoja móvil y avisos).
 */
import { useEffect } from 'react';
import GlobalNav from './components/layout/GlobalNav.jsx';
import ChartShell from './components/layout/ChartShell.jsx';
import Footer from './components/layout/Footer.jsx';
import Palette from './components/ui/Palette.jsx';
import Toasts from './components/ui/Toasts.jsx';
import MobileSheet from './components/ui/MobileSheet.jsx';
import { TerminalProvider, useTerminal } from './state/TerminalContext.jsx';

function Terminal() {
  const { reloadData, toast } = useTerminal();

  /* Eventos globales: regenerar datos y aviso de primera carga */
  useEffect(() => {
    const onReload = () => reloadData();
    window.addEventListener('oc:reload', onReload);
    return () => window.removeEventListener('oc:reload', onReload);
  }, [reloadData]);

  useEffect(() => {
    const t = setTimeout(() => toast('Datos de demostración: sin API ni claves', 'info', 3200), 900);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app-shell">
      <GlobalNav />
      <ChartShell />
      <Footer />
      <Palette />
      <MobileSheet />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <TerminalProvider>
      <Terminal />
    </TerminalProvider>
  );
}
