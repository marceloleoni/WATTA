import NotificationBell from './NotificationBell.jsx';

export default function Topbar({ title, subtitle }) {
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="topbar" style={{
      height: 68, flexShrink: 0, borderBottom: '1px solid var(--color-gray-border)', background: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-gray-light)', padding: '6px 10px', borderRadius: 6 }}>
          {hoje}
        </div>
        <NotificationBell />
      </div>
    </div>
  );
}
