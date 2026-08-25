<?php

declare(strict_types=1);

namespace Watta\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as Psr7Response;
use Watta\Services\JwtService;

class AuthMiddleware
{
    private JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function __invoke(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');
        $token = null;

        if ($header && str_starts_with($header, 'Bearer ')) {
            $token = substr($header, 7);
        } else {
            // Fallback via querystring: usado só para abrir arquivos em nova aba
            // (window.open não permite enviar o header Authorization).
            $token = $request->getQueryParams()['token'] ?? null;
        }

        if (!$token) {
            return $this->unauthorized('Token de autenticação ausente.');
        }

        $payload = $this->jwtService->validar($token);

        if ($payload === null) {
            return $this->unauthorized('Token inválido ou expirado.');
        }

        $request = $request->withAttribute('usuario', [
            'id' => (int) $payload['sub'],
            'nome' => $payload['nome'],
            'perfil' => $payload['perfil'],
        ]);

        return $handler->handle($request);
    }

    private function unauthorized(string $mensagem): Response
    {
        $response = new Psr7Response();
        $response->getBody()->write(json_encode(['erro' => $mensagem]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
}
