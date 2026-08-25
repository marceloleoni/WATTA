<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class DocumentoRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listarPorProjeto(int $projetoId): array
    {
        $stmt = $this->db->prepare(
            'SELECT d.*, a.nome AS autor_nome FROM documentos d JOIN usuarios a ON a.id = d.autor_id WHERE d.projeto_id = :projeto_id ORDER BY d.created_at'
        );
        $stmt->execute(['projeto_id' => $projetoId]);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM documentos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $doc = $stmt->fetch();
        return $doc ?: null;
    }

    public function criar(int $projetoId, int $autorId, string $tipo, string $codigoArquivo, ?string $caminhoArquivo, ?int $solicitadoPorId = null): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO documentos (projeto_id, autor_id, tipo, codigo_arquivo, caminho_arquivo, solicitado_por_id, status)
             VALUES (:projeto_id, :autor_id, :tipo, :codigo, :caminho, :solicitado_por_id, "pendente")'
        );
        $stmt->execute([
            'projeto_id' => $projetoId,
            'autor_id' => $autorId,
            'tipo' => $tipo,
            'codigo' => $codigoArquivo,
            'caminho' => $caminhoArquivo,
            'solicitado_por_id' => $solicitadoPorId,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizarStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE documentos SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);
    }

    public function adicionarComentario(int $documentoId, int $autorId, string $texto): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO comentarios (documento_id, autor_id, texto) VALUES (:documento_id, :autor_id, :texto)'
        );
        $stmt->execute(['documento_id' => $documentoId, 'autor_id' => $autorId, 'texto' => $texto]);
        return (int) $this->db->lastInsertId();
    }

    public function listarComentarios(int $documentoId): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.*, a.nome AS autor_nome FROM comentarios c JOIN usuarios a ON a.id = c.autor_id WHERE c.documento_id = :documento_id ORDER BY c.created_at'
        );
        $stmt->execute(['documento_id' => $documentoId]);
        return $stmt->fetchAll();
    }
}
