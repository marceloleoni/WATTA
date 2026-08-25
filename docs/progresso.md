# Progresso — WATTA

## 2026-07-15 — Implementação inicial (full stack)

Importado o protótipo visual `WATTA.dc.html` do Claude Design (projeto "Sistema WATTA homologação solar") e implementado como projeto completo: backend PHP (Slim) + MySQL operacional, frontend React consumindo a API real, responsivo.

### Estrutura

- `backend/` — API Slim (PHP 8.1+), PDO/MySQL, JWT, upload de documentos, e-mail via `mail()` nativo, log de auditoria.
- `frontend/` — Vite + React, build estático (`npm run build` → `dist/`), sem SSR.
- `docs/` — este arquivo.

### Como rodar localmente

**Backend (dev local, SQLite — sem precisar de servidor MySQL)**
```
cd backend
composer install
cp .env.example .env         # DB_DRIVER=sqlite já vem descomentado no .env de dev
composer db:sqlite           # cria backend/database/watta.sqlite a partir de schema.sqlite.sql + seed.sqlite.sql
php -S localhost:8080 -t public
```
Requer a extensão `pdo_sqlite` habilitada no `php.ini` (`extension=pdo_sqlite`).

**Backend (MySQL — produção ou quando quiser testar contra MySQL local)**
```
cd backend
composer install
cp .env.example .env   # setar DB_DRIVER=mysql e credenciais do MySQL local
mysql -u root -p < database/schema.sql
mysql -u root -p watta < database/seed.sql
php -S localhost:8080 -t public
```

**Frontend**
```
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8080/api
npm run dev
```

### Usuários de teste (seed)

Senha para todos: `watta123`

| E-mail | Perfil |
|---|---|
| marcos.lima@watta.com.br | Funcionário (analista) |
| juliana.prado@watta.com.br | Funcionário (analista) |
| ana.ferreira@gmail.com | Cliente |
| roberto.duarte@gmail.com | Cliente |
| caue.ribeiro@watta.com.br | Administrador |

Os dados de projetos/documentos/chat do seed foram extraídos diretamente do mock (`RAW_PROJECTS`, `USERS`, `DOC_NAMES`, `projectChats`) do protótipo original.

### Decisões de arquitetura

- **Auth real via JWT**, substituindo o seletor "Visualizar como" do protótipo (que trocava de perfil sem login). O perfil agora vem sempre do usuário autenticado.
- **Mapeamento de status**: o protótipo usava status de apresentação (`em_analise`, `pendente_doc`, `aprovado`, `rejeitado`) diferentes do fluxo real do `CLAUDE.md` (`solicitado → aprovado → ativo → finalizado/cancelado`). O frontend traduz o status real em rótulos de UI equivalentes (`statusMeta.js`).
- **Chat e chatbot via polling AJAX** (sem WebSocket), compatível com hospedagem compartilhada.
- **Chatbot** (`ChatbotController`) mantém a mesma lógica de intenção do protótipo, mas consulta dados reais do projeto do cliente autenticado em vez de responder com texto fixo.
- **Responsivo**: sidebar vira drawer, tabelas viram linhas empilhadas, chat ocupa a tela toda abaixo de 768px (`tokens.css`). Ainda não existe um design mobile dedicado — isso é uma adaptação do mesmo layout desktop.
- **Cadastro de cliente** feito por funcionário/admin, mas a criação vive em `UsuarioRepository::criar`, desacoplada do controller, para permitir auto-cadastro futuro sem reescrever essa camada.

### Cron job de compactação (produção)

Registrar no cPanel > Cron Jobs (intervalo mínimo 15 min, mas roda apenas 1x/dia):
```
0 3 * * * php /home/usuario/watta/backend/cron/compactar_projetos.php
```
Compacta em `.zip` os documentos de projetos finalizados/cancelados há 5+ dias. Os arquivos originais são mantidos (guardados indefinidamente por enquanto).

### Pendências / próximos passos

- Auto-cadastro de cliente (hoje só funcionário/admin cadastram).
- Refinar layout mobile com um design dedicado (hoje é responsivo adaptado do desktop).
- Métricas mais ricas no dashboard (hoje "tempo médio" só considera projetos já finalizados).
- Testes automatizados (unitários no backend, componentes no frontend).

## 2026-07-28 — Permissões e telas completas por perfil

Implementado o conjunto de capacidades por perfil que faltava no MVP inicial (funcionário, administrador, cliente).

### Funcionário
- Criação direta de projeto (`POST /api/projetos/criar`), sem passar pelo fluxo de solicitação/aprovação — entra direto como `ativo`.
- Editar (`PATCH /api/projetos/{id}`) e excluir projeto (`DELETE /api/projetos/{id}`) — exclusão é **soft delete** (`projetos.excluido`), reversível e mantém histórico/auditoria.
- Pedido de documento ao cliente: `POST /projetos/{id}/documentos` sem arquivo, feito por funcionário/admin, grava `solicitado_por_id` e notifica o cliente (em vez de notificar a equipe, como no upload comum).
- Abrir novos chats: com um cliente (resolve/cria a conversa do projeto) ou com um colega (conversa direta 1:1) via `POST /api/chat/conversas`.
- Arquivar/desarquivar conversas (`PATCH /api/chat/conversas/{id}/arquivar|desarquivar`) — projetos que viram `finalizado`/`cancelado` arquivam a conversa automaticamente.

### Administrador
- CRUD completo de usuários: editar (`PATCH /usuarios/{id}`) e desativar/reativar (`PATCH /usuarios/{id}/desativar|reativar`) — reaproveita a coluna `ativo` já existente; login já bloqueava usuário inativo. Autodesativação é bloqueada.
- Tela de usuários dividida em abas "Funcionários" / "Clientes".

### Cliente
- Visualizar documento em nova aba: `GET /api/documentos/{id}/arquivo` — como `window.open` não envia o header `Authorization`, o `AuthMiddleware` passou a aceitar o JWT também via querystring `?token=` como fallback (só usado por essa rota).
- Aba "Projetos arquivados" (finalizado/cancelado) separada de "Projetos ativos".
- Toggle "Ativas/Arquivadas" no chat (chats de projetos concluídos ficam arquivados automaticamente).

### Decisões de arquitetura
- **Modelo de chat reformulado**: `chat_mensagens.tipo`+`projeto_id` foi substituído por uma entidade `conversas` (tipo `projeto`|`direta`) + `conversa_participantes`, permitindo criar conversas sob demanda (inclusive DMs entre funcionários) e arquivá-las. A antiga sala única "chat interno" (`/api/chat/interno`) foi removida — nunca tinha tela no frontend.
- **MIME de documento por extensão**: o endpoint de visualização usa um mapa fixo de extensão→mime em vez de `mime_content_type()`/`ext-fileinfo`, que pode estar desabilitada em hospedagem compartilhada.
- Como o app ainda não subiu para produção, o schema foi editado diretamente em `schema.sql`/`seed.sql` (sem migrations incrementais).

## 2026-07-28 (2) — Perfil GERENTE, cadastros completos, UI estilizada e notificações

### Perfil GERENTE
- Novo perfil entre funcionário e administrador. Mesmas permissões de funcionário (projetos, documentos, chat) + pode cadastrar funcionários + editar/desativar funcionários e clientes + ver Logs.
- Só administrador cadastra/edita gerente ou administrador, e só administrador troca o campo `perfil` de qualquer usuário (`UsuarioController::podeGerenciar`).

### Cadastros completos
- Novos campos em `usuarios`: telefone, documento (CPF/CNPJ), cargo (funcionário), endereço completo (cliente — endereço do imóvel do projeto).
- Cadastro/edição em modal (`components/ui/Modal.jsx`), com abas Funcionários/Gerentes(admin)/Clientes e sub-toggle Ativos/Inativos em `UsersPage.jsx`.

### UI estilizada
- `alert()`/`confirm()`/`prompt()` do navegador substituídos por `Modal`, `ConfirmDialog`, `PromptDialog` e um sistema de toasts (`ToastContext`/`useToast`), usados em `ProjectDetailPage`, `DocumentsPage`, `ChatPage` e `UsersPage`.

### Notificações
- Reaproveita a tabela `notificacoes` (já populada pelo `Mailer` a cada evento) como feed in-app: nova coluna `lida`, endpoints `GET /notificacoes`, `GET /notificacoes/resumo`, `PATCH /notificacoes/{id}/lida` e `/notificacoes/lidas`.
- Sino no `Topbar` (contador + dropdown) e card "Notificações recentes" no painel; para a equipe, um `StatCard` extra de "Docs aguardando aprovação" (distingue documento com arquivo enviado e ainda pendente de avaliação, vs. documento só solicitado sem envio).
- Nova tabela `conversa_leituras` marca quando cada usuário leu cada conversa (upsert em `ChatController::listarMensagens`), alimentando o contador de conversas não lidas do resumo e o badge por conversa na lista lateral do chat.
- Chat também ganhou rolagem automática para a última mensagem e polling de mensagens mais rápido (3s).

## 2026-08-25 — Banco SQLite para desenvolvimento local

Adicionado suporte a SQLite como banco de dev local, para não depender de um servidor MySQL rodando na máquina. Produção continua em MySQL/MariaDB (HostGator) sem mudanças — a troca é só uma variável de ambiente.

### O que mudou
- `Config/Database.php`: escolhe o driver por `DB_DRIVER` (`mysql` default | `sqlite`). SQLite ativa `PRAGMA foreign_keys = ON` na conexão (desligado por padrão no SQLite).
- Novo `database/schema.sqlite.sql` — schema espelhado do `schema.sql` (MySQL), com `ENUM` virando `TEXT CHECK(...)`, `AUTO_INCREMENT` virando `INTEGER PRIMARY KEY AUTOINCREMENT`, índices via `CREATE INDEX` separado (SQLite não aceita `KEY`/`UNIQUE KEY` inline). **Os dois schemas precisam ser mantidos em sincronia manualmente** — não há migration engine ainda.
- Novo `database/seed.sqlite.sql` — mesmo conteúdo do `seed.sql`, só sem o `SET NAMES` (MySQL-only).
- Novo `database/migrate_sqlite.php` — recria `database/watta.sqlite` do zero a partir do schema (+ seed com `--seed`). Atalho: `composer db:sqlite`.
- `Repositories/ConversaRepository.php` tinha 3 trechos MySQL-only (`NOW()`, `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE`) sem equivalente direto em SQLite — o repositório agora detecta o driver (`PDO::ATTR_DRIVER_NAME`) e usa `CURRENT_TIMESTAMP` / `INSERT OR IGNORE` / `ON CONFLICT(...) DO UPDATE` quando SQLite. Nenhum outro repositório tinha SQL específico de um só banco.
- `.env` (dev) agora usa `DB_DRIVER=sqlite` por padrão; `.env.example` documenta as duas opções.
- `backend/database/*.sqlite` entrou no `.gitignore` (arquivo de banco não é versionado, como já era o caso do MySQL local).

### Como voltar para MySQL
Trocar `DB_DRIVER=sqlite` por `DB_DRIVER=mysql` no `.env` (e preencher `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS`) — nenhum outro ajuste necessário, o restante da aplicação é agnóstico de banco.
