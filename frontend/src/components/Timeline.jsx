import { TIMELINE_STAGES } from '../statusMeta.js';

export default function Timeline({ stageIndex, status }) {
  return (
    <div>
      {TIMELINE_STAGES.map((label, i) => {
        let kind = i < stageIndex ? 'done' : i === stageIndex ? 'current' : 'pending';
        if (status === 'cancelado' && i === stageIndex) kind = 'rejected';
        if (status === 'finalizado') kind = 'done';

        const dotStyle = {
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: kind === 'done' ? 'var(--color-green)' : kind === 'current' ? 'var(--color-blue)' : kind === 'rejected' ? 'var(--color-red)' : 'var(--color-gray-light)',
          boxShadow: kind === 'current' ? '0 0 0 4px var(--color-blue-light)' : 'none',
          border: kind === 'pending' ? '2px solid var(--color-gray-border)' : 'none',
        };
        const labelStyle = {
          fontSize: 13.5,
          fontWeight: kind === 'pending' ? 400 : 600,
          color: kind === 'pending' ? 'var(--color-text-secondary)' : 'oklch(22% 0.006 90)',
        };
        const dateLabel = kind === 'done' ? 'Concluído' : kind === 'current' ? 'Em andamento' : kind === 'rejected' ? 'Rejeitado nesta etapa' : 'Aguardando';

        return (
          <div key={label} style={{ display: 'flex', gap: 12, paddingBottom: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={dotStyle} />
              {i < TIMELINE_STAGES.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 18, background: 'var(--color-gray-border)', marginTop: 2 }} />
              )}
            </div>
            <div style={{ paddingTop: 1 }}>
              <div style={labelStyle}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{dateLabel}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
