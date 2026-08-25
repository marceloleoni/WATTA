<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use Slim\Factory\AppFactory;
use Watta\Config\Database;
use Watta\Controllers\AuthController;
use Watta\Controllers\ChatbotController;
use Watta\Controllers\ChatController;
use Watta\Controllers\DocumentoController;
use Watta\Controllers\LogController;
use Watta\Controllers\NotificacaoController;
use Watta\Controllers\ProjetoController;
use Watta\Controllers\UsuarioController;
use Watta\Middleware\AuthMiddleware;
use Watta\Middleware\RoleMiddleware;
use Watta\Repositories\ChatMensagemRepository;
use Watta\Repositories\ConversaRepository;
use Watta\Repositories\DocumentoRepository;
use Watta\Repositories\NotificacaoRepository;
use Watta\Repositories\ProjetoRepository;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\AuditLogger;
use Watta\Services\FileCodeGenerator;
use Watta\Services\JwtService;
use Watta\Services\Mailer;

return function () {
    // O .env já foi carregado em public/index.php (precisa estar disponível
    // ali mais cedo para o header de CORS). safeLoad() é idempotente.
    if (file_exists(__DIR__ . '/../.env')) {
        Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();
    }

    $db = Database::connection();

    $usuarioRepo = new UsuarioRepository($db);
    $projetoRepo = new ProjetoRepository($db);
    $documentoRepo = new DocumentoRepository($db);
    $chatRepo = new ChatMensagemRepository($db);
    $conversaRepo = new ConversaRepository($db);

    $jwtService = new JwtService();
    $auditLogger = new AuditLogger($db);
    $mailer = new Mailer($db);
    $codeGenerator = new FileCodeGenerator();

    $authController = new AuthController($usuarioRepo, $jwtService);
    $projetoController = new ProjetoController($projetoRepo, $usuarioRepo, $auditLogger, $mailer, $conversaRepo);
    $documentoController = new DocumentoController($documentoRepo, $projetoRepo, $usuarioRepo, $codeGenerator, $auditLogger, $mailer);
    $chatController = new ChatController($chatRepo, $conversaRepo, $projetoRepo, $usuarioRepo, $auditLogger, $mailer);
    $usuarioController = new UsuarioController($usuarioRepo, $auditLogger);
    $chatbotController = new ChatbotController($projetoRepo, $documentoRepo);
    $logController = new LogController($auditLogger);
    $notificacaoController = new NotificacaoController(new NotificacaoRepository($db));

    $authMiddleware = new AuthMiddleware($jwtService);

    $app = AppFactory::create();

    $app->addBodyParsingMiddleware();
    $app->addRoutingMiddleware();

    // CORS e o preflight OPTIONS já são tratados em public/index.php, antes do
    // bootstrap do banco de dados — assim o navegador nunca vê "erro de CORS"
    // no lugar de um erro real (ex.: banco fora do ar) sem headers.
    $errorMiddleware = $app->addErrorMiddleware((bool) ($_ENV['APP_ENV'] === 'development'), true, true);

    // Autenticação
    $app->post('/api/auth/login', [$authController, 'login']);

    // Rotas autenticadas
    $app->group('/api', function ($group) use (
        $authController,
        $projetoController,
        $documentoController,
        $chatController,
        $usuarioController,
        $chatbotController,
        $logController,
        $notificacaoController
    ) {
        $group->get('/auth/me', [$authController, 'me']);

        $group->get('/notificacoes', [$notificacaoController, 'listar']);
        $group->get('/notificacoes/resumo', [$notificacaoController, 'resumo']);
        $group->patch('/notificacoes/lidas', [$notificacaoController, 'marcarTodasLidas']);
        $group->patch('/notificacoes/{id}/lida', [$notificacaoController, 'marcarLida']);

        $group->get('/projetos', [$projetoController, 'listar']);
        $group->post('/projetos', [$projetoController, 'solicitar']);
        $group->get('/projetos/{id}', [$projetoController, 'detalhe']);

        $group->get('/projetos/{projetoId}/documentos', [$documentoController, 'listarPorProjeto']);
        $group->post('/projetos/{projetoId}/documentos', [$documentoController, 'upload']);
        $group->get('/documentos/{id}/arquivo', [$documentoController, 'arquivo']);

        $group->get('/conversas/{id}/mensagens', [$chatController, 'listarMensagens']);
        $group->post('/conversas/{id}/mensagens', [$chatController, 'enviarMensagem']);
        $group->get('/chat/conversas', [$chatController, 'conversas']);

        $group->post('/chatbot/mensagem', [$chatbotController, 'responder']);

        $group->group('', function ($group) use ($documentoController, $projetoController, $chatController, $usuarioController) {
            $group->patch('/documentos/{id}/status', [$documentoController, 'atualizarStatus']);
            $group->post('/projetos/criar', [$projetoController, 'criar']);
            $group->patch('/projetos/{id}', [$projetoController, 'atualizar']);
            $group->delete('/projetos/{id}', [$projetoController, 'excluir']);
            $group->patch('/projetos/{id}/aprovar-abertura', [$projetoController, 'aprovarAbertura']);
            $group->patch('/projetos/{id}/homologar', [$projetoController, 'homologar']);
            $group->patch('/projetos/{id}/rejeitar', [$projetoController, 'rejeitar']);
            $group->patch('/projetos/{id}/solicitar-correcao', [$projetoController, 'solicitarCorrecao']);
            $group->post('/chat/conversas', [$chatController, 'criarConversa']);
            $group->patch('/chat/conversas/{id}/arquivar', [$chatController, 'arquivarConversa']);
            $group->patch('/chat/conversas/{id}/desarquivar', [$chatController, 'desarquivarConversa']);
            $group->get('/usuarios', [$usuarioController, 'listar']);
            $group->post('/usuarios', [$usuarioController, 'criar']);
        })->add(new RoleMiddleware(['funcionario', 'gerente', 'admin']));

        $group->group('', function ($group) use ($usuarioController, $logController) {
            $group->patch('/usuarios/{id}', [$usuarioController, 'atualizar']);
            $group->patch('/usuarios/{id}/desativar', [$usuarioController, 'desativar']);
            $group->patch('/usuarios/{id}/reativar', [$usuarioController, 'reativar']);
            $group->get('/admin/logs', [$logController, 'listar']);
        })->add(new RoleMiddleware(['gerente', 'admin']));
    })->add($authMiddleware);

    return $app;
};
