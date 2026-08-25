import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'oklch(98% 0.002 90)' }}>
      <form onSubmit={handleSubmit} className="card fade-in" style={{ width: 360, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, background: 'oklch(72% 0.14 70)', clipPath: 'polygon(60% 0%, 20% 55%, 48% 55%, 40% 100%, 85% 40%, 55% 40%)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>WATTA</div>
            <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Homologação Solar</div>
          </div>
        </div>

        <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}
        />

        <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 13, marginBottom: 20, fontFamily: 'inherit' }}
        />

        {erro && <div style={{ color: 'var(--color-red)', fontSize: 12.5, marginBottom: 16 }}>{erro}</div>}

        <button type="submit" disabled={enviando} className="btn btn-primary" style={{ width: '100%', padding: '11px 0' }}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
