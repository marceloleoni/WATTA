<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class NotificacaoRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listar(int $usuarioId, int $limite = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, evento_origem, mensagem, lida, created_at FROM notificacoes
             WHERE usuario_id = :usuario_id ORDER BY created_at DESC LIMIT :limite'
        );
        $stmt->bindValue('usuario_id', $usuarioId, PDO::PARAM_INT);
        $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function marcarLida(int $id, int $usuarioId): void
    {
        $stmt = $this->db->prepare('UPDATE notificacoes SET lida = 1 WHERE id = :id AND usuario_id = :usuario_id');
        $stmt->execute(['id' => $id, 'usuario_id' => $usuarioId]);
    }

    public function marcarTodasLidas(int $usuarioId): void
    {
        $stmt = $this->db->prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = :usuario_id AND lida = 0');
        $stmt->execute(['usuario_id' => $usuarioId]);
    }

    public function contarNaoLidas(int $usuarioId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = :usuario_id AND lida = 0');
        $stmt->execute(['usuario_id' => $usuarioId]);
        return (int) $stmt->fetch()['total'];
    }

    /**
     * Documentos com arquivo enviado (não apenas solicitado) e ainda não avaliados pela
     * equipe — distingue "aguardando envio" (sem arquivo) de "aguardando aprovação".
     */
    public function contarDocumentosAguardandoAprovacao(): int
    {
        $stmt = $this->db->query(
            'SELECT COUNT(*) AS total FROM documentos d
             JOIN projetos p ON p.id = d.projeto_id
             WHERE p.excluido = 0 AND d.status = "pendente" AND d.caminho_arquivo IS NOT NULL'
        );
        return (int) $stmt->fetch()['total'];
    }

    public function contarConversasNaoLidas(int $usuarioId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) AS total FROM conversas c
             JOIN conversa_participantes cp ON cp.conversa_id = c.id AND cp.usuario_id = :usuario_id
             LEFT JOIN conversa_leituras cl ON cl.conversa_id = c.id AND cl.usuario_id = :usuario_id2
             WHERE c.arquivada = 0 AND EXISTS (
               SELECT 1 FROM chat_mensagens m
               WHERE m.conversa_id = c.id AND m.autor_id <> :usuario_id3
                 AND (cl.lida_em IS NULL OR m.created_at > cl.lida_em)
             )'
        );
        $stmt->execute(['usuario_id' => $usuarioId, 'usuario_id2' => $usuarioId, 'usuario_id3' => $usuarioId]);
        return (int) $stmt->fetch()['total'];
    }
}
