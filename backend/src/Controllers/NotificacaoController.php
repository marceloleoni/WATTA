<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\NotificacaoRepository;

class NotificacaoController
{
    private NotificacaoRepository $notificacoes;

    public function __construct(NotificacaoRepository $notificacoes)
    {
        $this->notificacoes = $notificacoes;
    }

    public function listar(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $limite = (int) ($request->getQueryParams()['limite'] ?? 10);
        $limite = max(1, min(50, $limite));

        return $this->json($response, $this->notificacoes->listar($usuario['id'], $limite));
    }

    public function resumo(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');

        $resumo = [
            'naoLidas' => $this->notificacoes->contarNaoLidas($usuario['id']),
            'conversasNaoLidas' => $this->notificacoes->contarConversasNaoLidas($usuario['id']),
            'documentosAguardandoAprovacao' => $usuario['perfil'] !== 'cliente'
                ? $this->notificacoes->contarDocumentosAguardandoAprovacao()
                : 0,
        ];

        return $this->json($response, $resumo);
    }

    public function marcarLida(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $this->notificacoes->marcarLida((int) $args['id'], $usuario['id']);
        return $this->json($response, ['ok' => true]);
    }

    public function marcarTodasLidas(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $this->notificacoes->marcarTodasLidas($usuario['id']);
        return $this->json($response, ['ok' => true]);
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
