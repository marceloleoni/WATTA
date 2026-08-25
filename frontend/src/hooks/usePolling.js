import { useEffect, useRef } from 'react';

/**
 * Polling via AJAX — a hospedagem compartilhada não sustenta WebSocket persistente,
 * então chat e notificações são atualizados nesse intervalo curto enquanto a tela está aberta.
 */
export function usePolling(callback, intervalMs, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => savedCallback.current();
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
