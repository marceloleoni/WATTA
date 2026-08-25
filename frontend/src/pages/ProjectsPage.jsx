import { useEffect, useMemo, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import ProjectTable from '../components/ProjectTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { PROJETO_STATUS_META } from '../statusMeta.js';

const FILTROS = [
  ['todos', 'Todos'],
  ['solicitado', 'Solicitado'],
  ['ativo', 'Em análise'],
  ['finalizado', 'Homologado'],
  ['cancelado', 'Rejeitado'],
];

const CAMPOS_VAZIOS = { clienteId: '', nome: '', cidade: '', distribuidora: '', potenciaKwp: '' };

export default function ProjectsPage() {
  const { usuario } = useAuth();
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [verArquivados, setVerArquivados] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(CAMPOS_VAZIOS);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const isStaff = usuario.perfil !== 'cliente';

  const carregarProjetos = () => api.get('/projetos').then(setProjetos).finally(() => setCarregando(false));

  useEffect(() => {
    carregarProjetos();
  }, []);

  useEffect(() => {
    if (isStaff) {
      api.get('/usuarios?perfil=cliente').then(setClientes).catch(() => {});
    }
  }, [isStaff]);

  const criarProjeto = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/projetos/criar', form);
      setForm(CAMPOS_VAZIOS);
      setMostrarForm(false);
      await carregarProjetos();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const arquivado = (p) => p.status === 'finalizado' || p.status === 'cancelado';

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return projetos.filter((p) => {
      const matchesQ = !q || p.nome.toLowerCase().includes(q) || (p.cliente_nome || '').toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
      if (isStaff) {
        const matchesStatus = filtro === 'todos' || p.status === filtro;
        return matchesQ && matchesStatus;
      }
      return matchesQ && arquivado(p) === verArquivados;
    });
  }, [projetos, busca, filtro, isStaff, verArquivados]);

  return (
    <>
      <Topbar
        title={isStaff ? 'Fila de Aprovação' : 'Meus Projetos'}
        subtitle={isStaff ? 'Analise e homologue os projetos enviados' : 'Acompanhe o andamento dos seus projetos'}
      />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por projeto, cliente ou ID..."
              style={{ flex: 1, maxWidth: 360, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {isStaff ? FILTROS.map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => setFiltro(key)}
                  style={{
                    padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: filtro === key ? 'var(--color-blue)' : 'var(--color-gray-light)',
                    color: filtro === key ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {label}
                </div>
              )) : (
                <>
                  <div
                    onClick={() => setVerArquivados(false)}
                    style={{ padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: !verArquivados ? 'var(--color-blue)' : 'var(--color-gray-light)', color: !verArquivados ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Projetos ativos
                  </div>
                  <div
                    onClick={() => setVerArquivados(true)}
                    style={{ padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: verArquivados ? 'var(--color-blue)' : 'var(--color-gray-light)', color: verArquivados ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Projetos arquivados
                  </div>
                </>
              )}
              {isStaff && (
                <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
                  {mostrarForm ? 'Cancelar' : '+ Novo projeto'}
                </button>
              )}
            </div>
          </div>

          {isStaff && mostrarForm && (
            <form onSubmit={criarProjeto} className="card" style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Cliente</label>
                <select required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="">Selecione…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nome do projeto</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Cidade</label>
                <input required value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Distribuidora</label>
                <input required value={form.distribuidora} onChange={(e) => setForm({ ...form, distribuidora: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Potência (kWp)</label>
                <input required type="number" step="0.01" min="0.01" value={form.potenciaKwp} onChange={(e) => setForm({ ...form, potenciaKwp: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', width: 110 }} />
              </div>
              <button type="submit" disabled={salvando} className="btn btn-primary">{salvando ? 'Salvando…' : 'Criar projeto'}</button>
              {erro && <div style={{ color: 'var(--color-red)', fontSize: 12.5, width: '100%' }}>{erro}</div>}
            </form>
          )}

          <div className="card" style={{ overflow: 'hidden' }}>
            {carregando ? <div style={{ padding: 40 }}>Carregando…</div> : <ProjectTable projetos={filtrados} showCliente={isStaff} />}
          </div>
        </div>
      </div>
    </>
  );
}
