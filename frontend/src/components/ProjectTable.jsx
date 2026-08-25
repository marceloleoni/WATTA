import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { PROJETO_STATUS_META, formatPotencia, formatDataHora } from '../statusMeta.js';

export default function ProjectTable({ projetos, showCliente = false }) {
  const navigate = useNavigate();
  const columns = showCliente ? '1.7fr 1.1fr 1fr 0.9fr 0.9fr 1.1fr' : '1.6fr 1fr 0.9fr 0.9fr 1fr';

  return (
    <div>
      <div className="table-grid-header" style={{
        display: 'grid', gridTemplateColumns: columns, padding: '10px 20px', fontSize: 11,
        color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em',
        borderBottom: '1px solid var(--color-gray-border)',
      }}>
        <div>Projeto</div>
        {showCliente && <div>Cliente</div>}
        <div>Distribuidora</div>
        <div>Potência</div>
        <div>Enviado em</div>
        <div>Status</div>
      </div>

      {projetos.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13.5 }}>
          Nenhum projeto encontrado.
        </div>
      )}

      {projetos.map((p) => (
        <div
          key={p.id}
          className="table-grid-row table-row"
          onClick={() => navigate(`/projetos/${p.id}`)}
          style={{
            display: 'grid', gridTemplateColumns: columns, padding: '14px 20px', alignItems: 'center',
            borderBottom: '1px solid oklch(94% 0.003 90)', cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nome}</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{p.codigo}</div>
          </div>
          {showCliente && <div style={{ fontSize: 13, color: 'oklch(40% 0.006 90)' }}>{p.cliente_nome}</div>}
          <div style={{ fontSize: 13, color: 'oklch(40% 0.006 90)' }}>{p.distribuidora}</div>
          <div className="mono" style={{ fontSize: 13 }}>{formatPotencia(p.potencia_kwp)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{formatDataHora(p.created_at)}</div>
          <div><StatusBadge meta={PROJETO_STATUS_META[p.status]} /></div>
        </div>
      ))}
    </div>
  );
}
