/**
 * useClock.js — reloj del pie, cuenta atrás de la vela en curso y latencia.
 *  · clock     : 'HH:MM:SS' en UTC o local
 *  · countdown : 'MM:SS' hasta el cierre de la vela actual
 *  · latency   : ms simulados (oscilan, como un ping real)
 */
import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

export function useClock({ useLocal = false, intervalSeconds = 300 } = {}) {
  const [now, setNow] = useState(() => Date.now());
  const [latency, setLatency] = useState(() => 680 + Math.round(Math.random() * 90));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const l = setInterval(() => setLatency((v) => {
      const next = 640 + Math.round(Math.random() * 190);
      return Math.round(v * 0.6 + next * 0.4);
    }), 4000);
    return () => { clearInterval(t); clearInterval(l); };
  }, []);

  const d = new Date(now);
  const hh = pad(useLocal ? d.getHours() : d.getUTCHours());
  const mm = pad(useLocal ? d.getMinutes() : d.getUTCMinutes());
  const ss = pad(useLocal ? d.getSeconds() : d.getUTCSeconds());

  const toClose = intervalSeconds - (Math.floor(now / 1000) % intervalSeconds);
  const countdown = `${pad(Math.floor(toClose / 60))}:${pad(toClose % 60)}`;

  const utcOffsetMinutes = -d.getTimezoneOffset();
  const offsetLabel = utcOffsetMinutes === 0
    ? 'UTC'
    : `UTC${utcOffsetMinutes > 0 ? '+' : '−'}${pad(Math.floor(Math.abs(utcOffsetMinutes) / 60))}:${pad(Math.abs(utcOffsetMinutes) % 60)}`;

  return { clock: `${hh}:${mm}:${ss}`, countdown, latency, offsetLabel };
}

/**
 * useMinuteTick — fuerza un repintado cada minuto (para textos que dependen
 * del reloj, como «CME opens 51m»).
 */
export function useMinuteTick() {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);
}

/** Próximo evento de sesión (mock local, sin backend). */
export function nextSessionLabel() {
  const now = new Date();
  const minutes = 60 - now.getUTCMinutes();
  return `CME opens ${minutes}m`;
}
