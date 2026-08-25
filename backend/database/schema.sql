-- WATTA — Schema MySQL/MariaDB
-- Compatível com hospedagem compartilhada (HostGator/cPanel)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('admin','gerente','funcionario','cliente') NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
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
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_perfil (perfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projetos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  funcionario_responsavel_id INT UNSIGNED NULL,
  nome VARCHAR(190) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  distribuidora VARCHAR(120) NOT NULL,
  potencia_kwp DECIMAL(8,2) NOT NULL,
  status ENUM('solicitado','aprovado','ativo','finalizado','cancelado') NOT NULL DEFAULT 'solicitado',
  stage_index TINYINT UNSIGNED NOT NULL DEFAULT 0,
  excluido TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_at DATETIME NULL,
  UNIQUE KEY uq_projetos_codigo (codigo),
  KEY idx_projetos_status (status),
  KEY idx_projetos_excluido (excluido),
  KEY idx_projetos_cliente (cliente_id),
  KEY idx_projetos_funcionario (funcionario_responsavel_id),
  CONSTRAINT fk_projetos_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_projetos_funcionario FOREIGN KEY (funcionario_responsavel_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE documentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  solicitado_por_id INT UNSIGNED NULL,
  tipo VARCHAR(190) NOT NULL,
  codigo_arquivo VARCHAR(80) NOT NULL,
  caminho_arquivo VARCHAR(255) NULL,
  status ENUM('aceito','reprovado','pendente','revisar') NOT NULL DEFAULT 'pendente',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_documentos_codigo (codigo_arquivo),
  KEY idx_documentos_projeto (projeto_id),
  KEY idx_documentos_status (status),
  CONSTRAINT fk_documentos_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  CONSTRAINT fk_documentos_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id),
  CONSTRAINT fk_documentos_solicitante FOREIGN KEY (solicitado_por_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE comentarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  documento_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  texto TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_comentarios_documento (documento_id),
  CONSTRAINT fk_comentarios_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conversas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('projeto','direta') NOT NULL,
  projeto_id INT UNSIGNED NULL,
  arquivada TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conversas_projeto (projeto_id),
  CONSTRAINT fk_conversas_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conversa_participantes (
  conversa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (conversa_id, usuario_id),
  CONSTRAINT fk_participantes_conversa FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  CONSTRAINT fk_participantes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_mensagens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversa_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  texto TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_conversa_created (conversa_id, created_at),
  CONSTRAINT fk_chat_conversa FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notificacoes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  canal ENUM('email') NOT NULL DEFAULT 'email',
  evento_origem VARCHAR(190) NOT NULL,
  mensagem TEXT NOT NULL,
  enviado TINYINT(1) NOT NULL DEFAULT 0,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notificacoes_usuario (usuario_id),
  KEY idx_notificacoes_usuario_lida (usuario_id, lida),
  CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conversa_leituras (
  conversa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  lida_em DATETIME NOT NULL,
  PRIMARY KEY (conversa_id, usuario_id),
  CONSTRAINT fk_leituras_conversa FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  CONSTRAINT fk_leituras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE log_auditoria (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  acao VARCHAR(150) NOT NULL,
  entidade_afetada VARCHAR(80) NOT NULL,
  entidade_id INT UNSIGNED NULL,
  detalhes TEXT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_log_usuario (usuario_id),
  KEY idx_log_entidade (entidade_afetada, entidade_id),
  CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
