/**
 * ChartShell.jsx — cuerpo del terminal: banner, barra del gráfico, rail,
 * lienzo (1 o 2 gráficos según la distribución) y paneles laterales.
 */
import TierBanner from './TierBanner.jsx';
import ToolRail from './ToolRail.jsx';
import ChartToolbar from '../toolbar/ChartToolbar.jsx';
import ChartArea from '../chart/ChartArea.jsx';
import Watchlist from '../panels/Watchlist.jsx';
import OrderBook from '../panels/OrderBook.jsx';
import Trades from '../panels/Trades.jsx';
import ChatPanel from '../panels/ChatPanel.jsx';
import ObjectsPanel from '../panels/ObjectsPanel.jsx';
import { useTerminal } from '../../state/TerminalContext.jsx';

export default function ChartShell() {
  const { layout, panels } = useTerminal();
  const rightPanels = [
    panels.objects && <ObjectsPanel key="objects" />,
    panels.watchlist && <Watchlist key="watchlist" />,
    panels.orderbook && <OrderBook key="orderbook" />,
    panels.trades && <Trades key="trades" />,
  ].filter(Boolean);

  return (
    <div className="chart-shell">
      <TierBanner />
      <ChartToolbar />
      <div className="main-content">
        <div className="main-row">
          <ToolRail />
          <div className={'chart-duo' + (layout === '2v' ? ' split-2v' : '')}>
            <ChartArea variant="primary" />
            {layout !== '1' && <ChartArea variant="secondary" />}
          </div>
          {panels.chat && <ChatPanel />}
          {rightPanels}
        </div>
      </div>
    </div>
  );
}
