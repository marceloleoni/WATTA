<?php

declare(strict_types=1);

namespace Watta\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    private string $secret;
    private int $expiresIn;

    public function __construct()
    {
        $this->secret = $_ENV['JWT_SECRET'] ?? 'dev-secret-change-me';
        $this->expiresIn = (int) ($_ENV['JWT_EXPIRES_IN_SECONDS'] ?? 28800);
    }

    public function emitir(array $usuario): string
    {
        $now = time();
        $payload = [
            'sub' => $usuario['id'],
            'nome' => $usuario['nome'],
            'perfil' => $usuario['perfil'],
            'iat' => $now,
            'exp' => $now + $this->expiresIn,
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validar(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return (array) $decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
