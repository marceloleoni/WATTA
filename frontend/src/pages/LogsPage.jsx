import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import { api } from '../api/client.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/admin/logs').then(setLogs).finally(() => setCarregando(false));
  }, []);

  return (
    <>
      <Topbar title="Logs de Auditoria" subtitle="Registro completo de ações no sistema" />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div className="card fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.7fr 1.3fr', padding: '10px 20px', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--color-gray-border)' }}>
            <div>Quando</div><div>Usuário</div><div>Ação</div><div>Entidade</div><div>Detalhes</div>
          </div>
          {carregando ? (
            <div style={{ padding: 40 }}>Carregando…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Nenhum registro ainda.</div>
          ) : logs.map((l) => (
            <div key={l.id} className="table-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.7fr 1.3fr', padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid oklch(94% 0.003 90)', fontSize: 12.5 }}>
              <div className="mono" style={{ color: 'var(--color-text-secondary)' }}>{l.timestamp}</div>
              <div>{l.usuario_nome || '—'}</div>
              <div>{l.acao}</div>
              <div>{l.entidade_afetada}{l.entidade_id ? ` #${l.entidade_id}` : ''}</div>
              <div style={{ color: 'var(--color-text-secondary)' }}>{l.detalhes || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
