<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class ChatMensagemRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listarPorConversa(int $conversaId, ?string $desde = null): array
    {
        $sql = 'SELECT m.*, a.nome AS autor_nome, a.perfil AS autor_perfil
                FROM chat_mensagens m JOIN usuarios a ON a.id = m.autor_id
                WHERE m.conversa_id = :conversa_id';
        $params = ['conversa_id' => $conversaId];

        if ($desde !== null) {
            $sql .= ' AND m.created_at > :desde';
            $params['desde'] = $desde;
        }

        $sql .= ' ORDER BY m.created_at';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function enviar(int $conversaId, int $autorId, string $texto): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO chat_mensagens (conversa_id, autor_id, texto) VALUES (:conversa_id, :autor_id, :texto)'
        );
        $stmt->execute([
            'conversa_id' => $conversaId,
            'autor_id' => $autorId,
            'texto' => $texto,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
