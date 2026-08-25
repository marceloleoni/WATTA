import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../statusMeta.js';

const NAV_BY_ROLE = {
  cliente: [
    { to: '/', label: 'Painel', end: true },
    { to: '/projetos', label: 'Meus Projetos' },
    { to: '/documentos', label: 'Meus Documentos' },
    { to: '/chat', label: 'Chat' },
  ],
  funcionario: [
    { to: '/', label: 'Painel', end: true },
    { to: '/projetos', label: 'Fila de Aprovação' },
    { to: '/chat', label: 'Chat' },
  ],
  gerente: [
    { to: '/', label: 'Painel', end: true },
    { to: '/projetos', label: 'Fila de Aprovação' },
    { to: '/chat', label: 'Chat' },
    { to: '/usuarios', label: 'Usuários' },
    { to: '/logs', label: 'Logs' },
  ],
  admin: [
    { to: '/', label: 'Painel', end: true },
    { to: '/projetos', label: 'Fila de Aprovação' },
    { to: '/chat', label: 'Chat' },
    { to: '/usuarios', label: 'Usuários' },
    { to: '/logs', label: 'Logs' },
  ],
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!usuario) return null;

  const items = NAV_BY_ROLE[usuario.perfil] || NAV_BY_ROLE.cliente;
  const iniciais = usuario.nome.split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <div className={`sidebar${open ? ' open' : ''}`} style={{
      width: 236, flexShrink: 0, background: '#ffffff', borderRight: '1px solid var(--color-gray-border)',
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', flex: '0 0 auto' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 14, height: 14, background: 'oklch(72% 0.14 70)', clipPath: 'polygon(60% 0%, 20% 55%, 48% 55%, 40% 100%, 85% 40%, 55% 40%)' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.02em' }}>WATTA</div>
          <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Homologação Solar</div>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: 'auto', width: 34, height: 34, border: '1px solid var(--color-gray-border)', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
        >
          ☰
        </button>
      </div>

      <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 24 }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
              cursor: 'pointer', marginBottom: 1, textDecoration: 'none', color: 'inherit',
              background: isActive ? 'var(--color-blue-light)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--color-blue)' : 'var(--color-gray-border)' }} />
                <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--color-blue)' : 'oklch(30% 0.006 90)' }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--color-gray-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-blue-light)', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{iniciais}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{ROLE_LABELS[usuario.perfil]}</div>
          </div>
        </div>
        <div onClick={logout} style={{ padding: '8px', fontSize: 12.5, color: 'var(--color-red)', fontWeight: 600, cursor: 'pointer' }}>Sair</div>
      </div>
    </div>
  );
}
