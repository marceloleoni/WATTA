import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import ProjectTable from '../components/ProjectTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { formatHora } from '../statusMeta.js';

function tempoMedioDias(projetos) {
  const finalizados = projetos.filter((p) => p.status === 'finalizado' && p.finalizado_at);
  if (finalizados.length === 0) return '—';
  const somaDias = finalizados.reduce((acc, p) => {
    const inicio = new Date(p.created_at.replace(' ', 'T'));
    const fim = new Date(p.finalizado_at.replace(' ', 'T'));
    return acc + (fim - inicio) / (1000 * 60 * 60 * 24);
  }, 0);
  return `${Math.round(somaDias / finalizados.length)} dias`;
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [notificacoes, setNotificacoes] = useState([]);
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    api.get('/projetos').then(setProjetos).finally(() => setCarregando(false));
    api.get('/notificacoes?limite=6').then(setNotificacoes).catch(() => {});
    api.get('/notificacoes/resumo').then(setResumo).catch(() => {});
  }, []);

  const isCliente = usuario.perfil === 'cliente';
  const isStaff = !isCliente;

  const statCards = isCliente
    ? [
        { label: 'Meus projetos', value: String(projetos.length), sub: 'Total cadastrado' },
        { label: 'Em análise', value: String(projetos.filter((p) => p.status === 'ativo').length), sub: 'Aguardando avaliação', subColor: 'var(--color-blue)' },
        { label: 'Solicitados', value: String(projetos.filter((p) => p.status === 'solicitado').length), sub: 'Aguardando aprovação de abertura', subColor: 'var(--color-amber)' },
        { label: 'Homologados', value: String(projetos.filter((p) => p.status === 'finalizado').length), sub: 'Projetos concluídos', subColor: 'var(--color-green)' },
      ]
    : [
        { label: 'Total de projetos', value: String(projetos.length), sub: 'Na base ativa' },
        { label: 'Fila de análise', value: String(projetos.filter((p) => p.status === 'ativo' || p.status === 'solicitado').length), sub: 'Aguardando ação', subColor: 'var(--color-blue)' },
        { label: 'Homologados', value: String(projetos.filter((p) => p.status === 'finalizado').length), sub: 'Projetos concluídos', subColor: 'var(--color-green)' },
        { label: 'Tempo médio', value: tempoMedioDias(projetos), sub: 'Do protocolo à homologação' },
        { label: 'Docs aguardando aprovação', value: resumo ? String(resumo.documentosAguardandoAprovacao) : '—', sub: 'Enviados pelo cliente', subColor: 'var(--color-amber)' },
      ];

  const recentes = projetos.slice(0, 5);

  return (
    <>
      <Topbar
        title="Painel"
        subtitle={isCliente ? 'Visão geral dos seus projetos solares' : 'Visão geral da operação de homologação'}
      />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {carregando ? (
          <div>Carregando…</div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length}, 1fr)`, gap: 16 }}>
              {statCards.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'flex-start' }}>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-gray-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{isStaff ? 'Projetos na fila' : 'Meus projetos recentes'}</div>
                  <div onClick={() => navigate('/projetos')} style={{ fontSize: 12.5, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer' }}>Ver todos →</div>
                </div>
                <ProjectTable projetos={recentes} showCliente={isStaff} />
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-gray-border)', fontWeight: 600, fontSize: 14.5 }}>
                  Notificações recentes
                </div>
                {notificacoes.length === 0 ? (
                  <div style={{ padding: '24px 20px', fontSize: 12.5, color: 'var(--color-text-secondary)' }}>Nenhuma notificação por aqui ainda.</div>
                ) : notificacoes.map((n) => (
                  <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid oklch(94% 0.003 90)', background: n.lida ? 'transparent' : 'var(--color-blue-light)' }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{n.mensagem?.split('\n')[0] || n.evento_origem}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>{formatHora(n.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
