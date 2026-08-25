<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Services\AuditLogger;

class LogController
{
    private AuditLogger $auditLogger;

    public function __construct(AuditLogger $auditLogger)
    {
        $this->auditLogger = $auditLogger;
    }

    public function listar(Request $request, Response $response): Response
    {
        $lista = $this->auditLogger->listar(200);
        $response->getBody()->write(json_encode($lista, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
