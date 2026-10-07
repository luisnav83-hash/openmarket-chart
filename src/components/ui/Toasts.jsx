/**
 * Toasts.jsx — avisos flotantes (abajo a la derecha, sobre el pie).
 * El icono viene como nombre simbólico desde el contexto; se mapea a lucide.
 */
import {
  AlertTriangle, Check, Crosshair, Download, Eye, EyeOff, FolderPlus, Globe, Info, Layout,
  LayoutGrid, Lock, Magnet, Maximize2, Moon, Pencil, Plus, Redo2, Ruler, Save, Settings,
  Share2, Sun, Trash2, TrendingUp, Unlock, Wand2,
} from 'lucide-react';
import { useTerminal } from '../../state/TerminalContext.jsx';

const ICONS = {
  info: Info, check: Check, save: Save, trash: Trash2, lock: Lock, unlock: Unlock,
  eye: Eye, 'eye-off': EyeOff, pencil: Pencil, ruler: Ruler, magnet: Magnet,
  plus: Plus, folder: FolderPlus, layout: LayoutGrid, globe: Globe, settings: Settings,
  share: Share2, download: Download, moon: Moon, sun: Sun, redo: Redo2,
  crosshair: Crosshair, eraser: Wand2, maximize: Maximize2, layout2: Layout,
  warn: AlertTriangle, stats: TrendingUp,
  undo: Redo2, pen: Pencil, code: Pencil,
};

export default function Toasts() {
  const { toasts } = useTerminal();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.icon] || Info;
        return (
          <div className="toast fade-in" key={t.id}>
            <span className="ico"><Icon size={14} /></span>
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
