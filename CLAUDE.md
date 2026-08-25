# WATTA — Sistema de Homologação de Projetos Solares

Este arquivo orienta o Claude Code no desenvolvimento deste projeto. Leia antes de gerar qualquer código.

## Visão Geral

Sistema web para uma empresa de energia solar, focado exclusivamente em **homologação de projetos**: envio e aprovação de documentos, comunicação via chat, e um chatbot local para consultas rápidas.

- **Acesso:** `sistema.dominio.com.br` (subdomínio do domínio da empresa)
- **Hospedagem de produção:** HostGator — hospedagem **compartilhada** (cPanel), já contratada pelo cliente
- **Ambiente de desenvolvimento:** local, só sobe para produção quando aprovado

## Stack Técnica

- **Backend:** PHP (sugestão: micro-framework tipo **Slim** — leve, adequado a hospedagem compartilhada; ajustável se preferir outra abordagem)
- **Banco de dados:** MySQL / MariaDB
- **Frontend:** React, compilado como **build estático** (HTML/CSS/JS), servido pelo próprio cPanel
  - Interfaces **desktop e mobile separadas**, com detecção automática de dispositivo
- **Chat ao vivo:** via *polling* (AJAX) — hospedagem compartilhada não sustenta WebSocket persistente
- **Chatbot:** local, baseado em regras/intenção (sem LLM externo) — identifica a pergunta e consulta o banco de dados diretamente (ex: status do projeto, documentos pendentes)
- **Rotina de compactação:** cron job do cPanel (mínimo 15 min entre execuções — sem impacto, já que roda 1x/dia)

## Restrições da Hospedagem (HostGator compartilhada)

Ter isso em mente ao tomar decisões técnicas:
- Sem WebSocket persistente → usar polling
- Cron jobs com intervalo mínimo de 15 minutos
- Limite de 25% de uso de CPU por períodos ≥ 90s, e 25 processos simultâneos por cPanel
- Limite de inodes (arquivos): 250.000–500.000 dependendo do plano — cada documento enviado conta como inode
- **Política de espaço em disco:** se o uso se aproximar do limite, arquivos antigos são copiados para backup externo e removidos do servidor

## Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Administrador** | Tudo do Funcionário + CRUD completo de usuários |
| **Funcionário** | Acesso total à plataforma (projetos, documentos, chats) |
| **Cliente** | Apenas seus projetos: envio de documentos, chat, visualização de detalhes |

Cadastro de cliente: feito pelo funcionário (mantenha essa lógica desacoplada o bastante para permitir auto-cadastro do cliente no futuro, se pedido).

## Módulos e Regras de Negócio

### Projetos
- Um cliente pode ter **N projetos**; um funcionário pode ser responsável por **N projetos**
- Fluxo: cliente solicita abertura → funcionário aprova → projeto ativo
- Projetos finalizados/cancelados ficam em lista separada, documentos preservados
- Compactação automática (.zip) 5 dias após finalização — arquivos guardados indefinidamente por enquanto

### Documentos
- Enviados por **cliente ou funcionário**
- **Status:** `aceito` | `reprovado` | `pendente` | `revisar` (este último sempre acompanhado de comentário)
- Comentários vinculados a cada documento
- Nome de arquivo padronizado por código (vincular projeto + tipo + timestamp/hash) para organização e rastreabilidade

### Chat
- Canal cliente ↔ funcionário (por projeto)
- Canal interno funcionário ↔ funcionário

### Chatbot
- Consulta dados reais do projeto do cliente (não é só FAQ estático)

### Notificações
- Canal: e-mail
- Disparadas por eventos (mudança de status, novo comentário, nova mensagem)
- Template genérico: nome do projeto, ação realizada, horário, responsável

### Logs / Auditoria
- Registro completo de todas as ações (quem, o quê, quando, em qual entidade)
- Visível apenas para administradores, em página dedicada

## Esboço do Modelo de Dados

```
Usuario (admin | funcionario | cliente)
Projeto
  - cliente_id
  - funcionario_responsavel_id
  - status (solicitado | aprovado | ativo | finalizado | cancelado)
Documento
  - projeto_id
  - autor_id (cliente ou funcionário)
  - status (aceito | reprovado | pendente | revisar)
  - codigo_arquivo
Comentario
  - documento_id
  - autor_id
ChatMensagem
  - tipo (cliente_funcionario | interno)
  - projeto_id (quando aplicável)
  - autor_id
Notificacao
  - usuario_id
  - canal (email)
  - evento_origem
LogAuditoria
  - usuario_id
  - acao
  - entidade_afetada
  - timestamp
```

## Convenções do Projeto

*(a preencher conforme o desenvolvimento avança — ex: padrão de nomenclatura de rotas, estrutura de pastas, padrão de commits)*

## Notas para o Claude Code

- Priorize soluções compatíveis com hospedagem compartilhada (sem processos em background persistentes, sem dependência de SSH obrigatório para rodar)
- Ao gerar migrations/schema, já pensar em MySQL/MariaDB (não PostgreSQL)
- Frontend React deve buildar para estático — não depender de SSR/Node rodando em produção
- Ir documentando decisões e progresso em arquivos `.md` adicionais conforme os módulos forem implementados
