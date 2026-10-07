/**
 * Dropdown.jsx — menú desplegable reutilizable (botón + capa flotante).
 * Usa la clase `.menu` de layout.css (medidas tomadas del original) y se
 * coloca respecto al botón, recortándose dentro de la ventana.
 */
import { useEffect, useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick.js';

export default function Dropdown({ trigger, children, align = 'left', width = 240, title }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const ref = useOutsideClick(() => setOpen(false));

  useEffect(() => {
    if (!open || !anchorRef.current || !ref.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const panel = ref.current;
    const w = Math.min(width, window.innerWidth - 16);
    panel.style.width = w + 'px';
    let left = align === 'right' ? a.right - w : a.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    const below = window.innerHeight - a.bottom;
    const openUp = below < 300 && a.top > below;
    panel.style.left = left + 'px';
    panel.style.top = (openUp ? a.top - 8 : a.bottom + 6) + 'px';
    panel.style.transform = openUp ? 'translateY(-100%)' : 'none';
    panel.style.maxHeight = Math.max(160, (openUp ? a.top : below) - 20) + 'px';
    panel.style.overflowY = 'auto';
  }, [open, align, width, ref]);

  return (
    <div className="dd" ref={anchorRef}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div className="menu fade-in" ref={ref} role="menu" aria-label={title}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
