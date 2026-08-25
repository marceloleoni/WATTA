<?php

declare(strict_types=1);

namespace Watta\Services;

use PDO;

class AuditLogger
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function log(?int $usuarioId, string $acao, string $entidadeAfetada, ?int $entidadeId = null, ?string $detalhes = null): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO log_auditoria (usuario_id, acao, entidade_afetada, entidade_id, detalhes) VALUES (:usuario_id, :acao, :entidade, :entidade_id, :detalhes)'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'acao' => $acao,
            'entidade' => $entidadeAfetada,
            'entidade_id' => $entidadeId,
            'detalhes' => $detalhes,
        ]);
    }

    public function listar(int $limite = 200): array
    {
        $stmt = $this->db->prepare(
            'SELECT l.id, l.usuario_id, u.nome AS usuario_nome, l.acao, l.entidade_afetada, l.entidade_id, l.detalhes, l.timestamp
             FROM log_auditoria l
             LEFT JOIN usuarios u ON u.id = l.usuario_id
             ORDER BY l.timestamp DESC
             LIMIT :limite'
        );
        $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
