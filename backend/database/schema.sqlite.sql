-- WATTA — Schema SQLite (uso local em desenvolvimento, enquanto o MySQL não é conectado)
-- Espelha backend/database/schema.sql (MySQL/MariaDB, usado em produção). Ao alterar um, alterar o outro.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS log_auditoria;
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS conversa_leituras;
DROP TABLE IF EXISTS chat_mensagens;
DROP TABLE IF EXISTS conversa_participantes;
DROP TABLE IF EXISTS conversas;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS documentos;
DROP TABLE IF EXISTS projetos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin','gerente','funcionario','cliente')),
  ativo INTEGER NOT NULL DEFAULT 1,
  telefone VARCHAR(20) NULL,
  documento VARCHAR(20) NULL,
  cargo VARCHAR(80) NULL,
  endereco_logradouro VARCHAR(160) NULL,
  endereco_numero VARCHAR(20) NULL,
  endereco_bairro VARCHAR(100) NULL,
  endereco_cidade VARCHAR(100) NULL,
  endereco_uf CHAR(2) NULL,
  endereco_cep VARCHAR(9) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (email)
);
CREATE INDEX idx_usuarios_perfil ON usuarios (perfil);

CREATE TABLE projetos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo VARCHAR(30) NOT NULL,
  cliente_id INTEGER NOT NULL,
  funcionario_responsavel_id INTEGER NULL,
  nome VARCHAR(190) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  distribuidora VARCHAR(120) NOT NULL,
  potencia_kwp DECIMAL(8,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado','aprovado','ativo','finalizado','cancelado')),
  stage_index INTEGER NOT NULL DEFAULT 0,
  excluido INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_at DATETIME NULL,
  UNIQUE (codigo),
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  FOREIGN KEY (funcionario_responsavel_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_projetos_status ON projetos (status);
CREATE INDEX idx_projetos_excluido ON projetos (excluido);
CREATE INDEX idx_projetos_cliente ON projetos (cliente_id);
CREATE INDEX idx_projetos_funcionario ON projetos (funcionario_responsavel_id);

CREATE TABLE documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projeto_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  solicitado_por_id INTEGER NULL,
  tipo VARCHAR(190) NOT NULL,
  codigo_arquivo VARCHAR(80) NOT NULL,
  caminho_arquivo VARCHAR(255) NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('aceito','reprovado','pendente','revisar')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (codigo_arquivo),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id),
  FOREIGN KEY (solicitado_por_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_documentos_projeto ON documentos (projeto_id);
CREATE INDEX idx_documentos_status ON documentos (status);

CREATE TABLE comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documento_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  texto TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_comentarios_documento ON comentarios (documento_id);

CREATE TABLE conversas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('projeto','direta')),
  projeto_id INTEGER NULL,
  arquivada INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (projeto_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

CREATE TABLE conversa_participantes (
  conversa_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  PRIMARY KEY (conversa_id, usuario_id),
  FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE chat_mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversa_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  texto TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_chat_conversa_created ON chat_mensagens (conversa_id, created_at);

CREATE TABLE notificacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  canal TEXT NOT NULL DEFAULT 'email' CHECK (canal IN ('email')),
  evento_origem VARCHAR(190) NOT NULL,
  mensagem TEXT NOT NULL,
  enviado INTEGER NOT NULL DEFAULT 0,
  lida INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_notificacoes_usuario ON notificacoes (usuario_id);
CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes (usuario_id, lida);

CREATE TABLE conversa_leituras (
  conversa_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  lida_em DATETIME NOT NULL,
  PRIMARY KEY (conversa_id, usuario_id),
  FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE log_auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NULL,
  acao VARCHAR(150) NOT NULL,
  entidade_afetada VARCHAR(80) NOT NULL,
  entidade_id INTEGER NULL,
  detalhes TEXT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_log_usuario ON log_auditoria (usuario_id);
CREATE INDEX idx_log_entidade ON log_auditoria (entidade_afetada, entidade_id);

PRAGMA foreign_keys = ON;
