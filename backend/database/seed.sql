-- WATTA — Dados de teste
-- Convertidos 1:1 dos arrays mock do protótipo WATTA.dc.html (RAW_PROJECTS, USERS, DOC_NAMES, projectChats).
-- Senha de todos os usuários de teste: watta123 (hash bcrypt abaixo)

SET NAMES utf8mb4;

-- USERS (do mock) — perfis: analista => funcionario
INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES
(1, 'Marcos Lima', 'marcos.lima@watta.com.br', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'funcionario', 1),
(2, 'Juliana Prado', 'juliana.prado@watta.com.br', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'funcionario', 1),
(3, 'Ana Ferreira', 'ana.ferreira@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(4, 'Roberto Duarte', 'roberto.duarte@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(5, 'Cauê Ribeiro', 'caue.ribeiro@watta.com.br', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'admin', 1);

-- Clientes extras citados no mock como donos de projetos (Helena Prado, Carlos Menezes, Fernanda Costa, Paulo Andrade, Marina Souza)
INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES
(6, 'Helena Prado', 'helena.prado@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(7, 'Carlos Menezes', 'carlos.menezes@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(8, 'Fernanda Costa', 'fernanda.costa@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(9, 'Paulo Andrade', 'paulo.andrade@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1),
(10, 'Marina Souza', 'marina.souza@gmail.com', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'cliente', 1);

-- Gerente de exemplo (novo perfil)
INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo, telefone, documento, cargo) VALUES
(11, 'Renata Alves', 'renata.alves@watta.com.br', '$2y$12$Dmch5qV5okwAY0.dYXx4xeuk7bx7Ihy/TDpZWG1HxsMgWXpnyKMiu', 'gerente', 1, '(19) 99887-1122', '111.222.333-44', 'Gerente de Homologação');

-- Dados cadastrais completos (telefone, CPF, cargo p/ equipe; telefone, CPF/CNPJ e endereço p/ clientes)
UPDATE usuarios SET telefone = '(19) 98123-4501', documento = '222.333.444-55', cargo = 'Analista de Homologação' WHERE id = 1;
UPDATE usuarios SET telefone = '(19) 98123-4502', documento = '333.444.555-66', cargo = 'Analista de Homologação' WHERE id = 2;
UPDATE usuarios SET telefone = '(19) 98123-4599', documento = '444.555.666-77' WHERE id = 5;

UPDATE usuarios SET telefone = '(19) 99111-2201', documento = '555.111.222-01',
  endereco_logradouro = 'Rua das Palmeiras', endereco_numero = '120', endereco_bairro = 'Jardim Primavera',
  endereco_cidade = 'Campinas', endereco_uf = 'SP', endereco_cep = '13040-100' WHERE id = 3;
UPDATE usuarios SET telefone = '(15) 99111-2202', documento = '555.111.222-02',
  endereco_logradouro = 'Av. Independência', endereco_numero = '845', endereco_bairro = 'Centro',
  endereco_cidade = 'Sorocaba', endereco_uf = 'SP', endereco_cep = '18010-100' WHERE id = 4;
UPDATE usuarios SET telefone = '(16) 99111-2203', documento = '555.111.222-03',
  endereco_logradouro = 'Rua Sete de Setembro', endereco_numero = '300', endereco_bairro = 'Vila Tibério',
  endereco_cidade = 'Ribeirão Preto', endereco_uf = 'SP', endereco_cep = '14050-100' WHERE id = 6;
UPDATE usuarios SET telefone = '(19) 99111-2204', documento = '555.111.222-04',
  endereco_logradouro = 'Rua XV de Novembro', endereco_numero = '55', endereco_bairro = 'Centro',
  endereco_cidade = 'Piracicaba', endereco_uf = 'SP', endereco_cep = '13400-100' WHERE id = 7;
UPDATE usuarios SET telefone = '(11) 99111-2205', documento = '555.111.222-05',
  endereco_logradouro = 'Rua Nove de Julho', endereco_numero = '410', endereco_bairro = 'Anhangabaú',
  endereco_cidade = 'Jundiaí', endereco_uf = 'SP', endereco_cep = '13208-100' WHERE id = 8;
UPDATE usuarios SET telefone = '(19) 99111-2206', documento = '555.111.222-06',
  endereco_logradouro = 'Rua Bandeirantes', endereco_numero = '78', endereco_bairro = 'Centro',
  endereco_cidade = 'São Carlos', endereco_uf = 'SP', endereco_cep = '13560-100' WHERE id = 9;
UPDATE usuarios SET telefone = '(19) 99111-2207', documento = '555.111.222-07',
  endereco_logradouro = 'Av. Major José Levy Sobrinho', endereco_numero = '1500', endereco_bairro = 'Jardim Nova Europa',
  endereco_cidade = 'Limeira', endereco_uf = 'SP', endereco_cep = '13480-100' WHERE id = 10;

-- RAW_PROJECTS (do mock) — status: em_analise/pendente_doc/aprovado/rejeitado mapeados para o fluxo real (solicitado|aprovado|ativo|finalizado|cancelado)
-- em_analise/pendente_doc => ativo (em andamento) | aprovado (mock) => finalizado | rejeitado (mock) => cancelado
INSERT INTO projetos (id, codigo, cliente_id, funcionario_responsavel_id, nome, cidade, distribuidora, potencia_kwp, status, stage_index, created_at, finalizado_at) VALUES
(1, 'PRJ-2026-0142', 3, 1, 'Residencial Vila Verde', 'Campinas, SP', 'CPFL Paulista', 8.40, 'ativo', 1, '2026-07-02', NULL),
(2, 'PRJ-2026-0139', 3, 1, 'Sítio Bela Vista', 'Valinhos, SP', 'CPFL Paulista', 12.20, 'finalizado', 4, '2026-05-18', '2026-06-10'),
(3, 'PRJ-2026-0151', 4, 2, 'Comercial Center Plaza', 'Sorocaba, SP', 'Elektro', 34.60, 'ativo', 1, '2026-07-05', NULL),
(4, 'PRJ-2026-0148', 6, 1, 'Fazenda Santa Rita', 'Ribeirão Preto, SP', 'CPFL Piratininga', 62.00, 'ativo', 2, '2026-06-29', NULL),
(5, 'PRJ-2026-0136', 7, 2, 'Residencial Jardim das Flores', 'São Carlos, SP', 'CPFL Paulista', 6.60, 'finalizado', 4, '2026-05-02', '2026-05-28'),
(6, 'PRJ-2026-0154', 8, 1, 'Galpão Industrial Norte', 'Jundiaí, SP', 'CPFL Paulista', 98.40, 'ativo', 1, '2026-07-10', NULL),
(7, 'PRJ-2026-0128', 9, 2, 'Residencial Bosque Real', 'Piracicaba, SP', 'Elektro', 9.90, 'cancelado', 1, '2026-04-15', NULL),
(8, 'PRJ-2026-0145', 10, 1, 'Chácara Vale Verde', 'Limeira, SP', 'CPFL Paulista', 15.00, 'ativo', 1, '2026-06-25', NULL);

-- DOC_NAMES (do mock), 5 documentos por projeto na mesma ordem/status do array docStatuses do mock
-- Ordem: ['Projeto elétrico assinado (ART/RRT)', 'Documento de identidade do titular', 'Comprovante de propriedade do imóvel', 'Conta de energia (últimos 3 meses)', 'Formulário de solicitação de acesso']

-- Projeto 1 (PRJ-2026-0142): aprovado, aprovado, em_analise, em_analise, pendente
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(1, 3, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0142-ART-20260702101500', 'aceito', '2026-07-02 10:15:00'),
(1, 3, 'Documento de identidade do titular', 'PRJ-2026-0142-IDENT-20260702101600', 'aceito', '2026-07-02 10:16:00'),
(1, 3, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0142-PROP-20260702101700', 'pendente', '2026-07-02 10:17:00'),
(1, 3, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0142-FATURA-20260702101800', 'pendente', '2026-07-02 10:18:00'),
(1, 3, 'Formulário de solicitação de acesso', 'PRJ-2026-0142-FORM-20260702101900', 'pendente', '2026-07-02 10:19:00');

-- Projeto 2 (PRJ-2026-0139): todos aprovados
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(2, 3, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0139-ART-20260518090000', 'aceito', '2026-05-18 09:00:00'),
(2, 3, 'Documento de identidade do titular', 'PRJ-2026-0139-IDENT-20260518090100', 'aceito', '2026-05-18 09:01:00'),
(2, 3, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0139-PROP-20260518090200', 'aceito', '2026-05-18 09:02:00'),
(2, 3, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0139-FATURA-20260518090300', 'aceito', '2026-05-18 09:03:00'),
(2, 3, 'Formulário de solicitação de acesso', 'PRJ-2026-0139-FORM-20260518090400', 'aceito', '2026-05-18 09:04:00');

-- Projeto 3 (PRJ-2026-0151): aprovado, reprovado(revisar), pendente, em_analise, pendente
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(3, 4, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0151-ART-20260705110000', 'aceito', '2026-07-05 11:00:00'),
(3, 4, 'Documento de identidade do titular', 'PRJ-2026-0151-IDENT-20260705110100', 'revisar', '2026-07-05 11:01:00'),
(3, 4, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0151-PROP-20260705110200', 'pendente', '2026-07-05 11:02:00'),
(3, 4, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0151-FATURA-20260705110300', 'pendente', '2026-07-05 11:03:00'),
(3, 4, 'Formulário de solicitação de acesso', 'PRJ-2026-0151-FORM-20260705110400', 'pendente', '2026-07-05 11:04:00');

INSERT INTO comentarios (documento_id, autor_id, texto, created_at) VALUES
(12, 2, 'Documento ilegível, favor reenviar em melhor resolução.', '2026-07-05 14:30:00');

-- Projeto 4 (PRJ-2026-0148): aprovado, aprovado, aprovado, em_analise, aprovado
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(4, 6, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0148-ART-20260629081500', 'aceito', '2026-06-29 08:15:00'),
(4, 6, 'Documento de identidade do titular', 'PRJ-2026-0148-IDENT-20260629081600', 'aceito', '2026-06-29 08:16:00'),
(4, 6, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0148-PROP-20260629081700', 'aceito', '2026-06-29 08:17:00'),
(4, 6, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0148-FATURA-20260629081800', 'pendente', '2026-06-29 08:18:00'),
(4, 6, 'Formulário de solicitação de acesso', 'PRJ-2026-0148-FORM-20260629081900', 'aceito', '2026-06-29 08:19:00');

-- Projeto 5 (PRJ-2026-0136): todos aprovados
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(5, 7, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0136-ART-20260502100000', 'aceito', '2026-05-02 10:00:00'),
(5, 7, 'Documento de identidade do titular', 'PRJ-2026-0136-IDENT-20260502100100', 'aceito', '2026-05-02 10:01:00'),
(5, 7, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0136-PROP-20260502100200', 'aceito', '2026-05-02 10:02:00'),
(5, 7, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0136-FATURA-20260502100300', 'aceito', '2026-05-02 10:03:00'),
(5, 7, 'Formulário de solicitação de acesso', 'PRJ-2026-0136-FORM-20260502100400', 'aceito', '2026-05-02 10:04:00');

-- Projeto 6 (PRJ-2026-0154): em_analise, aprovado, pendente, pendente, pendente
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(6, 8, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0154-ART-20260710133000', 'pendente', '2026-07-10 13:30:00'),
(6, 8, 'Documento de identidade do titular', 'PRJ-2026-0154-IDENT-20260710133100', 'aceito', '2026-07-10 13:31:00'),
(6, 8, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0154-PROP-20260710133200', 'pendente', '2026-07-10 13:32:00'),
(6, 8, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0154-FATURA-20260710133300', 'pendente', '2026-07-10 13:33:00'),
(6, 8, 'Formulário de solicitação de acesso', 'PRJ-2026-0154-FORM-20260710133400', 'pendente', '2026-07-10 13:34:00');

-- Projeto 7 (PRJ-2026-0128): reprovado(revisar), aprovado, aprovado, aprovado, aprovado
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(7, 9, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0128-ART-20260415090000', 'revisar', '2026-04-15 09:00:00'),
(7, 9, 'Documento de identidade do titular', 'PRJ-2026-0128-IDENT-20260415090100', 'aceito', '2026-04-15 09:01:00'),
(7, 9, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0128-PROP-20260415090200', 'aceito', '2026-04-15 09:02:00'),
(7, 9, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0128-FATURA-20260415090300', 'aceito', '2026-04-15 09:03:00'),
(7, 9, 'Formulário de solicitação de acesso', 'PRJ-2026-0128-FORM-20260415090400', 'aceito', '2026-04-15 09:04:00');

INSERT INTO comentarios (documento_id, autor_id, texto, created_at) VALUES
(31, 2, 'ART sem assinatura do responsável técnico, favor corrigir e reenviar.', '2026-04-16 10:00:00');

-- Projeto 8 (PRJ-2026-0145): aprovado, em_analise, pendente, pendente, em_analise
INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, status, created_at) VALUES
(8, 10, 'Projeto elétrico assinado (ART/RRT)', 'PRJ-2026-0145-ART-20260625143000', 'aceito', '2026-06-25 14:30:00'),
(8, 10, 'Documento de identidade do titular', 'PRJ-2026-0145-IDENT-20260625143100', 'pendente', '2026-06-25 14:31:00'),
(8, 10, 'Comprovante de propriedade do imóvel', 'PRJ-2026-0145-PROP-20260625143200', 'pendente', '2026-06-25 14:32:00'),
(8, 10, 'Conta de energia (últimos 3 meses)', 'PRJ-2026-0145-FATURA-20260625143300', 'pendente', '2026-06-25 14:33:00'),
(8, 10, 'Formulário de solicitação de acesso', 'PRJ-2026-0145-FORM-20260625143400', 'pendente', '2026-06-25 14:34:00');

-- Uma conversa tipo=projeto por projeto, com cliente + funcionário responsável como participantes
INSERT INTO conversas (id, tipo, projeto_id) VALUES
(1, 'projeto', 1),
(2, 'projeto', 2),
(3, 'projeto', 3),
(4, 'projeto', 4),
(5, 'projeto', 5),
(6, 'projeto', 6),
(7, 'projeto', 7),
(8, 'projeto', 8);

-- Projetos 2 e 5 já estão finalizados no seed: conversa nasce arquivada
UPDATE conversas SET arquivada = 1 WHERE projeto_id IN (2, 5, 7);

INSERT INTO conversa_participantes (conversa_id, usuario_id)
SELECT c.id, p.cliente_id FROM conversas c JOIN projetos p ON p.id = c.projeto_id WHERE c.tipo = 'projeto';
INSERT INTO conversa_participantes (conversa_id, usuario_id)
SELECT c.id, p.funcionario_responsavel_id FROM conversas c JOIN projetos p ON p.id = c.projeto_id
WHERE c.tipo = 'projeto' AND p.funcionario_responsavel_id IS NOT NULL;

-- projectChats (do mock, para o projeto PRJ-2026-0142 => conversa 1)
INSERT INTO chat_mensagens (conversa_id, autor_id, texto, created_at) VALUES
(1, 3, 'Olá, gostaria de saber se falta algum documento no meu projeto.', '2026-07-15 09:12:00'),
(1, 1, 'Olá Ana! Estamos revisando o formulário de solicitação de acesso, deve sair até amanhã.', '2026-07-15 09:20:00');

-- Log de auditoria inicial (seed)
INSERT INTO log_auditoria (usuario_id, acao, entidade_afetada, entidade_id, detalhes) VALUES
(1, 'seed_inicial', 'sistema', NULL, 'Base populada com dados de teste extraídos do protótipo WATTA.dc.html');
