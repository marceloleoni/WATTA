import { useEffect, useRef, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { api } from '../api/client.js';
import { useToast } from '../components/ui/ToastContext.jsx';
import { formatHora } from '../statusMeta.js';

export default function ChatPage() {
  const { usuario } = useAuth();
  const toast = useToast();
  const isStaff = usuario.perfil !== 'cliente';

  const [conversas, setConversas] = useState([]);
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [conversaId, setConversaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [mostrarNova, setMostrarNova] = useState(false);
  const [tipoNova, setTipoNova] = useState('direta');
  const [clientes, setClientes] = useState([]);
  const [colegas, setColegas] = useState([]);
  const [projetosCliente, setProjetosCliente] = useState([]);
  const [novaSelecao, setNovaSelecao] = useState('');
  const [criando, setCriando] = useState(false);
  const mensagensEndRef = useRef(null);

  const carregarConversas = () => {
    setCarregando(true);
    api.get(`/chat/conversas${verArquivadas ? '?arquivada=1' : ''}`).then((lista) => {
      setConversas(lista);
      setConversaId(lista.length > 0 ? lista[0].id : null);
    }).finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarConversas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verArquivadas]);

  useEffect(() => {
    if (isStaff && mostrarNova) {
      api.get('/usuarios?perfil=cliente').then(setClientes).catch(() => {});
      api.get('/usuarios?perfil=funcionario').then(setColegas).catch(() => {});
    }
  }, [isStaff, mostrarNova]);

  usePolling(() => {
    if (!conversaId) return;
    api.get(`/conversas/${conversaId}/mensagens`).then(setMensagens);
  }, 3000, !!conversaId);

  usePolling(() => {
    if (mostrarNova) return;
    api.get(`/chat/conversas${verArquivadas ? '?arquivada=1' : ''}`).then(setConversas);
  }, 8000, !mostrarNova);

  useEffect(() => {
    setMensagens([]);
  }, [conversaId]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  const ativa = conversas.find((c) => c.id === conversaId);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || !conversaId) return;
    setInput('');
    await api.post(`/conversas/${conversaId}/mensagens`, { texto });
    const atualizado = await api.get(`/conversas/${conversaId}/mensagens`);
    setMensagens(atualizado);
  };

  const abrirNovaConversa = () => {
    setTipoNova('direta');
    setNovaSelecao('');
    setMostrarNova(true);
  };

  const selecionarTipoNova = async (tipo) => {
    setTipoNova(tipo);
    setNovaSelecao('');
    if (tipo === 'projeto') {
      setProjetosCliente([]);
    }
  };

  const escolherCliente = async (clienteId) => {
    setNovaSelecao(clienteId);
    if (!clienteId) return;
    const todos = await api.get('/projetos');
    const doCliente = todos.filter((p) => String(p.cliente_id) === String(clienteId));
    setProjetosCliente(doCliente);
  };

  const criarConversa = async (projetoId) => {
    setCriando(true);
    try {
      const body = tipoNova === 'projeto'
        ? { tipo: 'projeto', projetoId }
        : { tipo: 'direta', usuarioId: novaSelecao };
      const conversa = await api.post('/chat/conversas', body);
      setMostrarNova(false);
      setVerArquivadas(false);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const lista = await api.get('/chat/conversas');
      setConversas(lista);
      setConversaId(conversa.id);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setCriando(false);
    }
  };

  const arquivar = async () => {
    if (!conversaId) return;
    await api.patch(`/chat/conversas/${conversaId}/arquivar`);
    carregarConversas();
  };

  return (
    <>
      <Topbar title="Chat" subtitle="Converse diretamente com o analista responsável" />
      <div className="content-area" style={{ flex: 1, overflowY: 'hidden', padding: 32 }}>
        <div className="card chat-layout fade-in" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          <div className="chat-sidebar" style={{ width: 280, borderRight: '1px solid var(--color-gray-border)', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-gray-border)', display: 'flex', gap: 6 }}>
              <div
                onClick={() => setVerArquivadas(false)}
                style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: !verArquivadas ? 'var(--color-blue)' : 'var(--color-gray-light)', color: !verArquivadas ? '#fff' : 'var(--color-text-secondary)' }}
              >
                Ativas
              </div>
              <div
                onClick={() => setVerArquivadas(true)}
                style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: verArquivadas ? 'var(--color-blue)' : 'var(--color-gray-light)', color: verArquivadas ? '#fff' : 'var(--color-text-secondary)' }}
              >
                Arquivadas
              </div>
            </div>

            {isStaff && !verArquivadas && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-gray-border)' }}>
                <button className="btn btn-primary" style={{ width: '100%', fontSize: 12 }} onClick={abrirNovaConversa}>+ Nova conversa</button>
              </div>
            )}

            {carregando ? (
              <div style={{ padding: 20, fontSize: 12.5 }}>Carregando…</div>
            ) : conversas.length === 0 ? (
              <div style={{ padding: 20, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>Nenhuma conversa aqui.</div>
            ) : conversas.map((c) => (
              <div
                key={c.id}
                onClick={() => setConversaId(c.id)}
                style={{ padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid oklch(94% 0.003 90)', background: conversaId === c.id ? 'var(--color-blue-light)' : 'transparent', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</div>
                  {c.codigo ? <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{c.codigo}</div> : null}
                </div>
                {conversaId !== c.id && c.nao_lidas > 0 && (
                  <span style={{ flexShrink: 0, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-blue)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {c.nao_lidas > 9 ? '9+' : c.nao_lidas}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {mostrarNova ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Nova conversa</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div onClick={() => selecionarTipoNova('direta')} style={{ padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tipoNova === 'direta' ? 'var(--color-blue)' : 'var(--color-gray-light)', color: tipoNova === 'direta' ? '#fff' : 'var(--color-text-secondary)' }}>Funcionário</div>
                  <div onClick={() => selecionarTipoNova('projeto')} style={{ padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tipoNova === 'projeto' ? 'var(--color-blue)' : 'var(--color-gray-light)', color: tipoNova === 'projeto' ? '#fff' : 'var(--color-text-secondary)' }}>Cliente</div>
                </div>

                {tipoNova === 'direta' && (
                  <select value={novaSelecao} onChange={(e) => setNovaSelecao(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', maxWidth: 280 }}>
                    <option value="">Selecione um colega…</option>
                    {colegas.filter((c) => c.id !== usuario.id).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                )}

                {tipoNova === 'projeto' && (
                  <>
                    <select value={novaSelecao} onChange={(e) => escolherCliente(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', maxWidth: 280 }}>
                      <option value="">Selecione um cliente…</option>
                      {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    {projetosCliente.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {projetosCliente.map((p) => (
                          <div key={p.id} onClick={() => !criando && criarConversa(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 12.5, cursor: 'pointer' }}>
                            {p.nome} <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>({p.codigo})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {tipoNova === 'direta' && (
                    <button className="btn btn-primary" disabled={!novaSelecao || criando} onClick={() => criarConversa(null)}>Iniciar conversa</button>
                  )}
                  <button className="btn" onClick={() => setMostrarNova(false)}>Cancelar</button>
                </div>
              </div>
            ) : !ativa ? (
              <div style={{ padding: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>Selecione uma conversa.</div>
            ) : (
              <>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {ativa.nome} {ativa.cliente_nome ? `— ${ativa.cliente_nome}` : ''}
                  </div>
                  {isStaff && !verArquivadas && (
                    <div onClick={arquivar} style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Arquivar</div>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mensagens.map((m) => {
                    const isMe = m.autor_id === usuario.id;
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                          background: isMe ? 'var(--color-blue)' : 'var(--color-gray-light)',
                          color: isMe ? '#fff' : 'oklch(22% 0.006 90)',
                        }}>
                          {m.texto}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'oklch(65% 0.005 90)', marginTop: 3 }}>{m.autor_nome} · {formatHora(m.created_at)}</div>
                      </div>
                    );
                  })}
                  <div ref={mensagensEndRef} />
                </div>
                {!verArquivadas && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-gray-border)', display: 'flex', gap: 10 }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
                      placeholder="Escreva uma mensagem..."
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={enviar} className="btn btn-primary">Enviar</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
