import { useEffect, useMemo, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const CAMPOS_VAZIOS = {
  nome: '', email: '', senha: '', perfil: 'cliente',
  telefone: '', documento: '', cargo: '',
  endereco_logradouro: '', endereco_numero: '', endereco_bairro: '',
  endereco_cidade: '', endereco_uf: '', endereco_cep: '',
};

function FormField({ label, children }) {
  return (
    <div className="form-field" style={{ flex: '1 1 160px', minWidth: 140 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function UsuarioForm({ aba, form, setForm, mostrarPerfil, ehEdicao }) {
  const ehCliente = aba === 'cliente';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <FormField label="Nome">
          <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </FormField>
        <FormField label="E-mail">
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <FormField label={ehEdicao ? 'Nova senha (opcional)' : 'Senha'}>
          <input required={!ehEdicao} type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
        </FormField>
        <FormField label="Telefone">
          <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(19) 99999-0000" />
        </FormField>
        <FormField label={ehCliente ? 'CPF/CNPJ' : 'CPF'}>
          <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
        </FormField>
      </div>

      {mostrarPerfil && (
        <FormField label="Perfil">
          <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
            <option value="funcionario">Funcionário</option>
            <option value="gerente">Gerente</option>
            <option value="admin">Administrador</option>
          </select>
        </FormField>
      )}

      {!ehCliente && (
        <FormField label="Cargo">
          <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex.: Analista de Homologação" />
        </FormField>
      )}

      {ehCliente && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Endereço do imóvel
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <FormField label="Logradouro">
              <input value={form.endereco_logradouro} onChange={(e) => setForm({ ...form, endereco_logradouro: e.target.value })} />
            </FormField>
            <FormField label="Número">
              <input value={form.endereco_numero} onChange={(e) => setForm({ ...form, endereco_numero: e.target.value })} />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <FormField label="Bairro">
              <input value={form.endereco_bairro} onChange={(e) => setForm({ ...form, endereco_bairro: e.target.value })} />
            </FormField>
            <FormField label="Cidade">
              <input value={form.endereco_cidade} onChange={(e) => setForm({ ...form, endereco_cidade: e.target.value })} />
            </FormField>
            <FormField label="UF">
              <input maxLength={2} value={form.endereco_uf} onChange={(e) => setForm({ ...form, endereco_uf: e.target.value.toUpperCase() })} style={{ width: 56 }} />
            </FormField>
            <FormField label="CEP">
              <input value={form.endereco_cep} onChange={(e) => setForm({ ...form, endereco_cep: e.target.value })} />
            </FormField>
          </div>
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { usuario: usuarioLogado } = useAuth();
  const toast = useToast();
  const ehAdmin = usuarioLogado.perfil === 'admin';

  const ABAS = useMemo(() => {
    const base = [['funcionario', 'Funcionários'], ['cliente', 'Clientes']];
    if (ehAdmin) base.splice(1, 0, ['gerente', 'Gerentes'], ['admin', 'Administradores']);
    return base;
  }, [ehAdmin]);

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState('funcionario');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [modal, setModal] = useState(null); // { modo: 'criar'|'editar', form, id? }
  const [salvando, setSalvando] = useState(false);
  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState(null);
  const [desativando, setDesativando] = useState(false);

  const carregar = () => api.get('/usuarios').then(setUsuarios).finally(() => setCarregando(false));

  useEffect(() => { carregar(); }, []);

  const abrirCriacao = () => {
    setModal({ modo: 'criar', form: { ...CAMPOS_VAZIOS, perfil: aba } });
  };

  const abrirEdicao = (u) => {
    setModal({
      modo: 'editar',
      id: u.id,
      form: {
        ...CAMPOS_VAZIOS,
        nome: u.nome, email: u.email, perfil: u.perfil,
        telefone: u.telefone || '', documento: u.documento || '', cargo: u.cargo || '',
        endereco_logradouro: u.endereco_logradouro || '', endereco_numero: u.endereco_numero || '',
        endereco_bairro: u.endereco_bairro || '', endereco_cidade: u.endereco_cidade || '',
        endereco_uf: u.endereco_uf || '', endereco_cep: u.endereco_cep || '',
      },
    });
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const { form, modo, id } = modal;
      if (modo === 'criar') {
        await api.post('/usuarios', form);
        toast.sucesso('Usuário cadastrado com sucesso.');
      } else {
        const body = { ...form };
        if (!body.senha) delete body.senha;
        if (!ehAdmin) delete body.perfil;
        await api.patch(`/usuarios/${id}`, body);
        toast.sucesso('Usuário atualizado com sucesso.');
      }
      setModal(null);
      await carregar();
    } catch (err) {
      toast.erro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDesativacao = async () => {
    setDesativando(true);
    try {
      await api.patch(`/usuarios/${usuarioParaDesativar.id}/desativar`);
      toast.sucesso(`${usuarioParaDesativar.nome} foi desativado(a).`);
      setUsuarioParaDesativar(null);
      await carregar();
    } catch (err) {
      toast.erro(err.message);
    } finally {
      setDesativando(false);
    }
  };

  const reativar = async (u) => {
    try {
      await api.patch(`/usuarios/${u.id}/reativar`);
      toast.sucesso(`${u.nome} foi reativado(a).`);
      await carregar();
    } catch (err) {
      toast.erro(err.message);
    }
  };

  const listaAba = usuarios.filter((u) => u.perfil === aba && Boolean(u.ativo) === !mostrarInativos);

  return (
    <>
      <Topbar title="Usuários" subtitle="Gestão de acessos da plataforma" />
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {ABAS.map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => { setAba(key); setMostrarInativos(false); }}
                  style={{
                    padding: '7px 13px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: aba === key ? 'var(--color-blue)' : 'var(--color-gray-light)',
                    color: aba === key ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={abrirCriacao}>+ Cadastrar</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={() => setMostrarInativos(false)}
              style={{ padding: '6px 12px', borderRadius: 14, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: !mostrarInativos ? 'var(--color-blue-light)' : 'transparent', color: !mostrarInativos ? 'var(--color-blue)' : 'var(--color-text-secondary)' }}
            >
              Ativos
            </div>
            <div
              onClick={() => setMostrarInativos(true)}
              style={{ padding: '6px 12px', borderRadius: 14, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: mostrarInativos ? 'var(--color-blue-light)' : 'transparent', color: mostrarInativos ? 'var(--color-blue)' : 'var(--color-text-secondary)' }}
            >
              Inativos
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.9fr 1fr', padding: '10px 20px', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--color-gray-border)' }}>
              <div>Nome</div><div>E-mail</div><div>Telefone</div><div>Ações</div>
            </div>
            {carregando ? (
              <div style={{ padding: 40 }}>Carregando…</div>
            ) : listaAba.length === 0 ? (
              <div style={{ padding: 40, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Nenhum usuário {mostrarInativos ? 'inativo' : 'ativo'} nesta lista.
              </div>
            ) : listaAba.map((u) => (
              <div key={u.id} className="table-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.9fr 1fr', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid oklch(94% 0.003 90)' }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.nome}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{u.email}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{u.telefone || '—'}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div onClick={() => abrirEdicao(u)} style={{ fontSize: 12, color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer' }}>Editar</div>
                  {u.id !== usuarioLogado.id && (
                    mostrarInativos ? (
                      <div onClick={() => reativar(u)} style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 600, cursor: 'pointer' }}>Reativar</div>
                    ) : (
                      <div onClick={() => setUsuarioParaDesativar(u)} style={{ fontSize: 12, color: 'var(--color-red)', fontWeight: 600, cursor: 'pointer' }}>Desativar</div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal.modo === 'criar' ? `Cadastrar ${{ cliente: 'cliente', gerente: 'gerente', admin: 'administrador' }[aba] ?? 'funcionário'}` : 'Editar usuário'}
          onClose={() => setModal(null)}
          maxWidth={560}
          footer={(
            <>
              <button type="button" className="btn" onClick={() => setModal(null)} disabled={salvando}>Cancelar</button>
              <button type="submit" form="form-usuario" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        >
          <form id="form-usuario" onSubmit={salvar}>
            <UsuarioForm
              aba={aba}
              form={modal.form}
              setForm={(form) => setModal({ ...modal, form })}
              mostrarPerfil={ehAdmin && aba !== 'cliente'}
              ehEdicao={modal.modo === 'editar'}
            />
          </form>
        </Modal>
      )}

      {usuarioParaDesativar && (
        <ConfirmDialog
          title="Desativar usuário"
          message={`Desativar ${usuarioParaDesativar.nome}? A pessoa não conseguirá mais fazer login até ser reativada.`}
          confirmLabel="Desativar"
          danger
          onConfirm={confirmarDesativacao}
          onCancel={() => !desativando && setUsuarioParaDesativar(null)}
        />
      )}
    </>
  );
}
