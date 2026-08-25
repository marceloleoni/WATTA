<?php

declare(strict_types=1);

namespace Watta\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as Psr7Response;

class RoleMiddleware
{
    /** @var string[] */
    private array $perfisPermitidos;

    public function __construct(array $perfisPermitidos)
    {
        $this->perfisPermitidos = $perfisPermitidos;
    }

    public function __invoke(Request $request, Handler $handler): Response
    {
        $usuario = $request->getAttribute('usuario');

        if (!$usuario || !in_array($usuario['perfil'], $this->perfisPermitidos, true)) {
            $response = new Psr7Response();
            $response->getBody()->write(json_encode(['erro' => 'Acesso não permitido para este perfil.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        return $handler->handle($request);
    }
}
