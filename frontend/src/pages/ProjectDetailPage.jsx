import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Timeline from '../components/Timeline.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PromptDialog from '../components/ui/PromptDialog.jsx';
import { api, API_URL } from '../api/client.js';
import { PROJETO_STATUS_META, DOCUMENTO_STATUS_META, formatPotencia } from '../statusMeta.js';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { usuario, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [comentarios, setComentarios] = useState({});
  const [processando, setProcessando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState(null);
  const [mostrarConfirmExcluir, setMostrarConfirmExcluir] = useState(false);
  const [mostrarPromptDocumento, setMostrarPromptDocumento] = useState(false);
  const [promptRevisaoDocId, setPromptRevisaoDocId] = useState(null);

  const carregar = useCallback(async () => {
    const [p, docs] = await Promise.all([
      api.get(`/projetos/${id}`),
      api.get(`/projetos/${id}/documentos`),
    ]);
    setProjeto(p);
    setDocumentos(docs);
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  const canReview = usuario.perfil !== 'cliente';

  const acao = async (fn) => {
    setProcessando(true);
    try {
      await fn();
      await carregar();
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setProcessando(false);
    }
  };

  const aprovarAbertura = () => acao(() => api.patch(`/projetos/${id}/aprovar-abertura`));
  const homologar = () => acao(() => api.patch(`/projetos/${id}/homologar`));
  const rejeitar = () => acao(() => api.patch(`/projetos/${id}/rejeitar`));
  const solicitarCorrecao = () => acao(() => api.patch(`/projetos/${id}/solicitar-correcao`));

  const abrirEdicao = () => {
    setFormEdicao({ nome: projeto.nome, cidade: projeto.cidade, distribuidora: projeto.distribuidora, potenciaKwp: projeto.potencia_kwp });
    setEditando(true);
  };

  const salvarEdicao = (e) => {
    e.preventDefault();
    acao(() => api.patch(`/projetos/${id}`, formEdicao)).then(() => setEditando(false));
  };

  const confirmarExclusao = () => acao(async () => {
    await api.delete(`/projetos/${id}`);
    navigate('/projetos');
  }).then(() => setMostrarConfirmExcluir(false));

  const confirmarSolicitacaoDocumento = (tipo) => acao(async () => {
    const form = new FormData();
    form.append('tipo', tipo);
    await api.post(`/projetos/${id}/documentos`, form, { isForm: true });
  }).then(() => setMostrarPromptDocumento(false));

  const avaliarDocumento = (docId, status) => {
    const comentario = comentarios[docId] || '';
    if (status === 'revisar' && !comentario.trim()) {
      setPromptRevisaoDocId(docId);
      return;
    }
    acao(() => api.patch(`/documentos/${docId}/status`, { status, comentario }));
  };

  const confirmarRevisao = (comentario) => acao(
    () => api.patch(`/documentos/${promptRevisaoDocId}/status`, { status: 'revisar', comentario })
  ).then(() => setPromptRevisaoDocId(null));

  if (carregando || !projeto) {
    return (
      <>
        <Topbar title="Detalhe do Projeto" subtitle="Linha do tempo, documentos e ações" />
        <div style={{ padding: 32 }}>Carregando…</div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Detalhe do Projeto" subtitle="Linha do tempo, documentos e ações" />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100 }}>
          <div onClick={() => navigate('/projetos')} style={{ fontSize: 12.5, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
            ← Voltar para projetos
          </div>

          <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{projeto.codigo}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{projeto.nome}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                {projeto.cliente_nome} · {projeto.cidade} · {projeto.distribuidora} · {formatPotencia(projeto.potencia_kwp)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <StatusBadge meta={PROJETO_STATUS_META[projeto.status]} />
              <div onClick={() => navigate('/chat')} style={{ fontSize: 12.5, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer' }}>Abrir chat com cliente →</div>
              {canReview && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div onClick={abrirEdicao} style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Editar</div>
                  <div onClick={() => setMostrarConfirmExcluir(true)} style={{ fontSize: 12.5, color: 'var(--color-red)', fontWeight: 600, cursor: 'pointer' }}>Excluir</div>
                </div>
              )}
            </div>
          </div>

          {canReview && editando && formEdicao && (
            <form onSubmit={salvarEdicao} className="card" style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nome do projeto</label>
                <input required value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Cidade</label>
                <input required value={formEdicao.cidade} onChange={(e) => setFormEdicao({ ...formEdicao, cidade: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Distribuidora</label>
                <input required value={formEdicao.distribuidora} onChange={(e) => setFormEdicao({ ...formEdicao, distribuidora: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Potência (kWp)</label>
                <input required type="number" step="0.01" min="0.01" value={formEdicao.potenciaKwp} onChange={(e) => setFormEdicao({ ...formEdicao, potenciaKwp: e.target.value })} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 13, fontFamily: 'inherit', width: 110 }} />
              </div>
              <button type="submit" disabled={processando} className="btn btn-primary">Salvar</button>
              <button type="button" className="btn" onClick={() => setEditando(false)}>Cancelar</button>
            </form>
          )}

          {canReview && projeto.status === 'solicitado' && (
            <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Este projeto aguarda aprovação de abertura</div>
              <button className="btn btn-primary" disabled={processando} onClick={aprovarAbertura}>Aprovar abertura</button>
            </div>
          )}

          {canReview && projeto.status === 'ativo' && (
            <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Ações do analista para este projeto</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn" disabled={processando} onClick={solicitarCorrecao}>Solicitar correção</button>
                <button className="btn btn-danger" disabled={processando} onClick={rejeitar}>Rejeitar</button>
                <button className="btn btn-primary" disabled={processando} onClick={homologar}>Aprovar / Homologar</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 16 }}>Linha do tempo de homologação</div>
              <Timeline stageIndex={projeto.stage_index} status={projeto.status} />
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>Documentos enviados</div>
                {canReview && (
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 11.5 }} disabled={processando} onClick={() => setMostrarPromptDocumento(true)}>
                    Solicitar documento
                  </button>
                )}
              </div>
              {documentos.map((d) => (
                <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid oklch(94% 0.003 90)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.tipo}</div>
                      <StatusBadge meta={DOCUMENTO_STATUS_META[d.status]} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {d.caminho_arquivo && (
                        <div
                          onClick={() => window.open(`${API_URL}/documentos/${d.id}/arquivo?token=${encodeURIComponent(token)}`, '_blank')}
                          style={{ fontSize: 11.5, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer', marginRight: 4 }}
                        >
                          Visualizar
                        </div>
                      )}
                      {canReview && d.status !== 'aceito' && (
                        <>
                          <div onClick={() => avaliarDocumento(d.id, 'reprovado')} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-gray-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-red)', fontWeight: 700 }}>✕</div>
                          <div onClick={() => avaliarDocumento(d.id, 'aceito')} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-gray-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-green)', fontWeight: 700 }}>✓</div>
                        </>
                      )}
                    </div>
                  </div>
                  {canReview && d.status !== 'aceito' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <input
                        placeholder="Comentário para revisão..."
                        value={comentarios[d.id] || ''}
                        onChange={(e) => setComentarios((c) => ({ ...c, [d.id]: e.target.value }))}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-gray-border)', fontSize: 12, fontFamily: 'inherit' }}
                      />
                      <button className="btn" style={{ padding: '6px 10px', fontSize: 11.5 }} onClick={() => avaliarDocumento(d.id, 'revisar')}>Pedir revisão</button>
                    </div>
                  )}
                  {d.comentarios?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {d.comentarios.map((c) => (
                        <div key={c.id} style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                          <strong>{c.autor_nome}:</strong> {c.texto}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mostrarConfirmExcluir && (
        <ConfirmDialog
          title="Excluir projeto"
          message="Excluir este projeto? Ele deixará de aparecer nas listas, mas o histórico é preservado."
          confirmLabel="Excluir"
          danger
          onConfirm={confirmarExclusao}
          onCancel={() => setMostrarConfirmExcluir(false)}
        />
      )}

      {mostrarPromptDocumento && (
        <PromptDialog
          title="Solicitar documento"
          label="Qual documento você quer solicitar ao cliente?"
          placeholder="Ex.: Laudo técnico do padrão de entrada"
          confirmLabel="Solicitar"
          onConfirm={confirmarSolicitacaoDocumento}
          onCancel={() => setMostrarPromptDocumento(false)}
        />
      )}

      {promptRevisaoDocId !== null && (
        <PromptDialog
          title="Solicitar revisão"
          label="Informe um comentário explicando o que precisa ser revisado:"
          multiline
          confirmLabel="Enviar"
          onConfirm={confirmarRevisao}
          onCancel={() => setPromptRevisaoDocId(null)}
        />
      )}
    </>
  );
}
