<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class UsuarioRepository
{
    private const CAMPOS_CADASTRO = [
        'telefone', 'documento', 'cargo',
        'endereco_logradouro', 'endereco_numero', 'endereco_bairro',
        'endereco_cidade', 'endereco_uf', 'endereco_cep',
    ];

    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function buscarPorEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $usuario = $stmt->fetch();
        return $usuario ?: null;
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $usuario = $stmt->fetch();
        return $usuario ?: null;
    }

    private const COLUNAS_LISTAGEM = 'id, nome, email, perfil, ativo, telefone, documento, cargo,
        endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, created_at';

    public function listarTodos(?string $perfil = null): array
    {
        if ($perfil !== null) {
            $stmt = $this->db->prepare('SELECT ' . self::COLUNAS_LISTAGEM . ' FROM usuarios WHERE perfil = :perfil ORDER BY nome');
            $stmt->execute(['perfil' => $perfil]);
            return $stmt->fetchAll();
        }

        $stmt = $this->db->query('SELECT ' . self::COLUNAS_LISTAGEM . ' FROM usuarios ORDER BY nome');
        return $stmt->fetchAll();
    }

    /**
     * Criação de usuário desacoplada do fluxo de cadastro (hoje só a equipe cadastra;
     * permite plugar auto-cadastro do cliente no futuro sem mudar esta camada).
     */
    public function criar(string $nome, string $email, string $senhaHash, string $perfil, array $camposCadastro = []): int
    {
        $colunas = ['nome', 'email', 'senha_hash', 'perfil'];
        $params = ['nome' => $nome, 'email' => $email, 'senha_hash' => $senhaHash, 'perfil' => $perfil];

        foreach (self::CAMPOS_CADASTRO as $campo) {
            if (array_key_exists($campo, $camposCadastro)) {
                $colunas[] = $campo;
                $params[$campo] = $camposCadastro[$campo];
            }
        }

        $placeholders = implode(', ', array_map(fn ($c) => ":{$c}", $colunas));
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (' . implode(', ', $colunas) . ', ativo) VALUES (' . $placeholders . ', 1)'
        );
        $stmt->execute($params);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void
    {
        $permitidos = array_merge(['nome', 'email', 'perfil', 'senha_hash'], self::CAMPOS_CADASTRO);
        $sets = [];
        $params = ['id' => $id];

        foreach ($permitidos as $campo) {
            if (array_key_exists($campo, $campos)) {
                $sets[] = "{$campo} = :{$campo}";
                $params[$campo] = $campos[$campo];
            }
        }

        if (empty($sets)) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function definirAtivo(int $id, bool $ativo): void
    {
        $stmt = $this->db->prepare('UPDATE usuarios SET ativo = :ativo WHERE id = :id');
        $stmt->execute(['ativo' => $ativo ? 1 : 0, 'id' => $id]);
    }
}
