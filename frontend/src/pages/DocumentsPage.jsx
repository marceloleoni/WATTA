import { useEffect, useRef, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, API_URL } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';
import { DOCUMENTO_STATUS_META, PROJETO_STATUS_META } from '../statusMeta.js';

export default function DocumentsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(null);
  const fileInputs = useRef({});

  useEffect(() => {
    api.get('/projetos').then((lista) => {
      setProjetos(lista);
      if (lista.length > 0) setProjetoId(lista[0].id);
    }).finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (!projetoId) return;
    api.get(`/projetos/${projetoId}/documentos`).then(setDocumentos);
  }, [projetoId]);

  const selecionado = projetos.find((p) => p.id === projetoId);

  const enviarArquivo = async (tipo, arquivo) => {
    setEnviando(tipo);
    try {
      const form = new FormData();
      form.append('tipo', tipo);
      if (arquivo) form.append('arquivo', arquivo);
      await api.post(`/projetos/${projetoId}/documentos`, form, { isForm: true });
      const docs = await api.get(`/projetos/${projetoId}/documentos`);
      setDocumentos(docs);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setEnviando(null);
    }
  };

  const TIPOS_PADRAO = [
    'Projeto elétrico assinado (ART/RRT)',
    'Documento de identidade do titular',
    'Comprovante de propriedade do imóvel',
    'Conta de energia (últimos 3 meses)',
    'Formulário de solicitação de acesso',
  ];

  const tiposEnviados = new Set(documentos.map((d) => d.tipo));
  const pendentesParaEnvio = TIPOS_PADRAO.filter((t) => !tiposEnviados.has(t));

  return (
    <>
      <Topbar title="Meus Documentos" subtitle="Envie e acompanhe os documentos exigidos" />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {carregando ? (
          <div>Carregando…</div>
        ) : projetos.length === 0 ? (
          <div>Você ainda não possui projetos.</div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {projetos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setProjetoId(p.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: projetoId === p.id ? 'var(--color-blue)' : '#ffffff',
                    color: projetoId === p.id ? '#fff' : 'oklch(40% 0.006 90)',
                    border: `1px solid ${projetoId === p.id ? 'var(--color-blue)' : 'var(--color-gray-border)'}`,
                  }}
                >
                  {p.nome}
                </div>
              ))}
            </div>

            {selecionado && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selecionado.nome}</div>
                  <StatusBadge meta={PROJETO_STATUS_META[selecionado.status]} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                  {selecionado.codigo} · {selecionado.distribuidora}
                </div>

                {documentos.map((d) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid oklch(94% 0.003 90)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📄</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.tipo}</div>
                        <StatusBadge meta={DOCUMENTO_STATUS_META[d.status]} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {d.caminho_arquivo && (
                        <button
                          type="button"
                          className="btn"
                          style={{ whiteSpace: 'nowrap' }}
                          onClick={() => window.open(`${API_URL}/documentos/${d.id}/arquivo?token=${encodeURIComponent(token)}`, '_blank')}
                        >
                          Visualizar
                        </button>
                      )}
                      {(d.status === 'pendente' || d.status === 'revisar' || d.status === 'reprovado') && (
                        <label className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                          {enviando === d.tipo ? 'Enviando…' : 'Reenviar arquivo'}
                          <input
                            type="file"
                            hidden
                            onChange={(e) => enviarArquivo(d.tipo, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}

                {pendentesParaEnvio.map((tipo) => (
                  <div key={tipo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid oklch(94% 0.003 90)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📄</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{tipo}</div>
                    </div>
                    <label className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      {enviando === tipo ? 'Enviando…' : 'Enviar arquivo'}
                      <input type="file" hidden onChange={(e) => enviarArquivo(tipo, e.target.files[0])} />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
