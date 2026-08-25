import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { usePolling } from '../hooks/usePolling.js';
import { formatHora } from '../statusMeta.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState({ naoLidas: 0, conversasNaoLidas: 0, documentosAguardandoAprovacao: 0 });
  const [notificacoes, setNotificacoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  usePolling(() => {
    api.get('/notificacoes/resumo').then(setResumo).catch(() => {});
  }, 20000);

  useEffect(() => {
    if (aberto) {
      api.get('/notificacoes?limite=10').then(setNotificacoes).catch(() => {});
    }
  }, [aberto]);

  useEffect(() => {
    const onClickFora = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  const marcarLida = async (n) => {
    if (!n.lida) {
      await api.patch(`/notificacoes/${n.id}/lida`);
      setNotificacoes((lista) => lista.map((x) => (x.id === n.id ? { ...x, lida: 1 } : x)));
      setResumo((r) => ({ ...r, naoLidas: Math.max(0, r.naoLidas - 1) }));
    }
  };

  const marcarTodas = async () => {
    await api.patch('/notificacoes/lidas');
    setNotificacoes((lista) => lista.map((x) => ({ ...x, lida: 1 })));
    setResumo((r) => ({ ...r, naoLidas: 0 }));
  };

  const total = resumo.naoLidas;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        style={{
          position: 'relative', width: 38, height: 38, borderRadius: 9, border: '1px solid var(--color-gray-border)',
          background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Notificações"
      >
        🔔
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9,
            background: 'var(--color-red)', color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 46, width: 340, maxHeight: 420, overflowY: 'auto', zIndex: 100, boxShadow: '0 16px 40px oklch(20% 0.01 90 / 20%)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-gray-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Notificações</div>
            {total > 0 && (
              <div onClick={marcarTodas} style={{ fontSize: 11, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer' }}>
                Marcar todas como lidas
              </div>
            )}
          </div>
          {notificacoes.length === 0 ? (
            <div style={{ padding: 24, fontSize: 12.5, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Sem notificações ainda.</div>
          ) : notificacoes.map((n) => (
            <div
              key={n.id}
              onClick={() => { marcarLida(n); setAberto(false); navigate('/'); }}
              style={{
                padding: '12px 16px', borderBottom: '1px solid oklch(94% 0.003 90)', cursor: 'pointer',
                background: n.lida ? 'transparent' : 'var(--color-blue-light)',
              }}
            >
              <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{n.mensagem?.split('\n')[0] || n.evento_origem}</div>
              <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>{formatHora(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
