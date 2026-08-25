<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\JwtService;

class AuthController
{
    private UsuarioRepository $usuarios;
    private JwtService $jwt;

    public function __construct(UsuarioRepository $usuarios, JwtService $jwt)
    {
        $this->usuarios = $usuarios;
        $this->jwt = $jwt;
    }

    public function login(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();
        $email = trim((string) ($body['email'] ?? ''));
        $senha = (string) ($body['senha'] ?? '');

        $usuario = $email !== '' ? $this->usuarios->buscarPorEmail($email) : null;

        if (!$usuario || !$usuario['ativo'] || !password_verify($senha, $usuario['senha_hash'])) {
            return $this->json($response, ['erro' => 'E-mail ou senha inválidos.'], 401);
        }

        $token = $this->jwt->emitir($usuario);

        return $this->json($response, [
            'token' => $token,
            'usuario' => [
                'id' => (int) $usuario['id'],
                'nome' => $usuario['nome'],
                'email' => $usuario['email'],
                'perfil' => $usuario['perfil'],
            ],
        ]);
    }

    public function me(Request $request, Response $response): Response
    {
        $usuarioAuth = $request->getAttribute('usuario');
        $usuario = $this->usuarios->buscarPorId($usuarioAuth['id']);

        if (!$usuario) {
            return $this->json($response, ['erro' => 'Usuário não encontrado.'], 404);
        }

        return $this->json($response, [
            'id' => (int) $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $usuario['email'],
            'perfil' => $usuario['perfil'],
        ]);
    }

    private function json(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
