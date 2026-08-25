<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class ConversaRepository
{
    private PDO $db;
    private bool $sqlite;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM conversas WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $conversa = $stmt->fetch();
        return $conversa ?: null;
    }

    public function pertence(int $conversaId, int $usuarioId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM conversa_participantes WHERE conversa_id = :conversa_id AND usuario_id = :usuario_id LIMIT 1');
        $stmt->execute(['conversa_id' => $conversaId, 'usuario_id' => $usuarioId]);
        return (bool) $stmt->fetch();
    }

    /**
     * Encontra (ou cria) a conversa do projeto e garante que cliente + funcionário
     * responsável estejam entre os participantes (o responsável pode mudar ao longo do tempo).
     */
    public function encontrarOuCriarPorProjeto(int $projetoId, array $participantesIds): int
    {
        $stmt = $this->db->prepare('SELECT id FROM conversas WHERE projeto_id = :projeto_id LIMIT 1');
        $stmt->execute(['projeto_id' => $projetoId]);
        $existente = $stmt->fetch();

        if ($existente) {
            $conversaId = (int) $existente['id'];
        } else {
            $insert = $this->db->prepare('INSERT INTO conversas (tipo, projeto_id) VALUES ("projeto", :projeto_id)');
            $insert->execute(['projeto_id' => $projetoId]);
            $conversaId = (int) $this->db->lastInsertId();
        }

        $insertIgnore = $this->sqlite
            ? 'INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (:conversa_id, :usuario_id)'
            : 'INSERT IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (:conversa_id, :usuario_id)';

        foreach (array_unique(array_filter($participantesIds)) as $usuarioId) {
            $participante = $this->db->prepare($insertIgnore);
            $participante->execute(['conversa_id' => $conversaId, 'usuario_id' => $usuarioId]);
        }

        return $conversaId;
    }

    public function criarDireta(int $usuarioAId, int $usuarioBId): int
    {
        $stmt = $this->db->prepare(
            'SELECT cp1.conversa_id
             FROM conversa_participantes cp1
             JOIN conversa_participantes cp2 ON cp2.conversa_id = cp1.conversa_id
             JOIN conversas c ON c.id = cp1.conversa_id
             WHERE c.tipo = "direta" AND cp1.usuario_id = :a AND cp2.usuario_id = :b
             LIMIT 1'
        );
        $stmt->execute(['a' => $usuarioAId, 'b' => $usuarioBId]);
        $existente = $stmt->fetch();
        if ($existente) {
            return (int) $existente['conversa_id'];
        }

        $insert = $this->db->prepare('INSERT INTO conversas (tipo) VALUES ("direta")');
        $insert->execute();
        $conversaId = (int) $this->db->lastInsertId();

        $participantes = $this->db->prepare(
            'INSERT INTO conversa_participantes (conversa_id, usuario_id) VALUES (:conversa_id, :a), (:conversa_id2, :b)'
        );
        $participantes->execute([
            'conversa_id' => $conversaId,
            'a' => $usuarioAId,
            'conversa_id2' => $conversaId,
            'b' => $usuarioBId,
        ]);

        return $conversaId;
    }

    public function listarParaUsuario(int $usuarioId, bool $arquivada): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.id, c.tipo, c.projeto_id, c.arquivada, c.created_at,
                    COALESCE(p.nome, outro.nome) AS nome,
                    COALESCE(p.codigo, "") AS codigo,
                    p.status AS projeto_status,
                    cli.nome AS cliente_nome,
                    (SELECT COUNT(*) FROM chat_mensagens m
                       WHERE m.conversa_id = c.id AND m.autor_id <> :usuario_id4
                         AND (cl.lida_em IS NULL OR m.created_at > cl.lida_em)) AS nao_lidas
             FROM conversas c
             JOIN conversa_participantes cp ON cp.conversa_id = c.id AND cp.usuario_id = :usuario_id
             LEFT JOIN projetos p ON p.id = c.projeto_id
             LEFT JOIN usuarios cli ON cli.id = p.cliente_id
             LEFT JOIN conversa_participantes cp2 ON cp2.conversa_id = c.id AND cp2.usuario_id <> :usuario_id2 AND c.tipo = "direta"
             LEFT JOIN usuarios outro ON outro.id = cp2.usuario_id
             LEFT JOIN conversa_leituras cl ON cl.conversa_id = c.id AND cl.usuario_id = :usuario_id3
             WHERE c.arquivada = :arquivada AND (c.projeto_id IS NULL OR p.excluido = 0)
             ORDER BY c.created_at DESC'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'usuario_id2' => $usuarioId,
            'usuario_id3' => $usuarioId,
            'usuario_id4' => $usuarioId,
            'arquivada' => $arquivada ? 1 : 0,
        ]);
        return $stmt->fetchAll();
    }

    public function marcarComoLida(int $conversaId, int $usuarioId): void
    {
        $sql = $this->sqlite
            ? 'INSERT INTO conversa_leituras (conversa_id, usuario_id, lida_em) VALUES (:conversa_id, :usuario_id, CURRENT_TIMESTAMP)
               ON CONFLICT(conversa_id, usuario_id) DO UPDATE SET lida_em = CURRENT_TIMESTAMP'
            : 'INSERT INTO conversa_leituras (conversa_id, usuario_id, lida_em) VALUES (:conversa_id, :usuario_id, NOW())
               ON DUPLICATE KEY UPDATE lida_em = NOW()';

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['conversa_id' => $conversaId, 'usuario_id' => $usuarioId]);
    }

    public function arquivar(int $id, bool $arquivada): void
    {
        $stmt = $this->db->prepare('UPDATE conversas SET arquivada = :arquivada WHERE id = :id');
        $stmt->execute(['arquivada' => $arquivada ? 1 : 0, 'id' => $id]);
    }

    public function arquivarPorProjeto(int $projetoId): void
    {
        $stmt = $this->db->prepare('UPDATE conversas SET arquivada = 1 WHERE projeto_id = :projeto_id');
        $stmt->execute(['projeto_id' => $projetoId]);
    }
}
