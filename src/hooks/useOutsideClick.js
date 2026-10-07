/**
 * useOutsideClick.js — cierra menús/paneles al hacer clic fuera o con Esc.
 * Devuelve la ref que hay que colocar en el contenedor del menú.
 */
import { useEffect, useRef } from 'react';

export function useOutsideClick(onClose, { escape = true } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (escape && e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, escape]);
  return ref;
}
