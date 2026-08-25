<?php

declare(strict_types=1);

namespace Watta\Repositories;

use PDO;

class ProjetoRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function baseQuery(): string
    {
        return 'SELECT p.*, c.nome AS cliente_nome, f.nome AS funcionario_nome
                 FROM projetos p
                 JOIN usuarios c ON c.id = p.cliente_id
                 LEFT JOIN usuarios f ON f.id = p.funcionario_responsavel_id';
    }

    public function listarParaUsuario(array $usuario): array
    {
        if ($usuario['perfil'] === 'cliente') {
            $stmt = $this->db->prepare($this->baseQuery() . ' WHERE p.excluido = 0 AND p.cliente_id = :cliente_id ORDER BY p.created_at DESC');
            $stmt->execute(['cliente_id' => $usuario['id']]);
            return $stmt->fetchAll();
        }

        $stmt = $this->db->query($this->baseQuery() . ' WHERE p.excluido = 0 ORDER BY p.created_at DESC');
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->db->prepare($this->baseQuery() . ' WHERE p.id = :id AND p.excluido = 0 LIMIT 1');
        $stmt->execute(['id' => $id]);
        $projeto = $stmt->fetch();
        return $projeto ?: null;
    }

    public function podeVisualizar(array $projeto, array $usuario): bool
    {
        if ($usuario['perfil'] === 'cliente') {
            return (int) $projeto['cliente_id'] === (int) $usuario['id'];
        }
        return true;
    }

    public function criar(int $clienteId, string $nome, string $cidade, string $distribuidora, float $potenciaKwp): int
    {
        $codigo = 'PRJ-' . date('Y') . '-' . str_pad((string) (($this->proximoSequencial())), 4, '0', STR_PAD_LEFT);

        $stmt = $this->db->prepare(
            'INSERT INTO projetos (codigo, cliente_id, nome, cidade, distribuidora, potencia_kwp, status, stage_index)
             VALUES (:codigo, :cliente_id, :nome, :cidade, :distribuidora, :potencia, "solicitado", 0)'
        );
        $stmt->execute([
            'codigo' => $codigo,
            'cliente_id' => $clienteId,
            'nome' => $nome,
            'cidade' => $cidade,
            'distribuidora' => $distribuidora,
            'potencia' => $potenciaKwp,
        ]);
        return (int) $this->db->lastInsertId();
    }

    private function proximoSequencial(): int
    {
        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM projetos');
        return ((int) $stmt->fetch()['total']) + 1;
    }

    /**
     * Criação direta pelo funcionário/admin: entra já com responsável atribuído e status
     * "ativo" (stage 1), pulando a etapa de solicitação/aprovação de abertura do cliente.
     */
    public function criarDireto(int $clienteId, int $funcionarioId, string $nome, string $cidade, string $distribuidora, float $potenciaKwp): int
    {
        $codigo = 'PRJ-' . date('Y') . '-' . str_pad((string) (($this->proximoSequencial())), 4, '0', STR_PAD_LEFT);

        $stmt = $this->db->prepare(
            'INSERT INTO projetos (codigo, cliente_id, funcionario_responsavel_id, nome, cidade, distribuidora, potencia_kwp, status, stage_index)
             VALUES (:codigo, :cliente_id, :funcionario_id, :nome, :cidade, :distribuidora, :potencia, "ativo", 1)'
        );
        $stmt->execute([
            'codigo' => $codigo,
            'cliente_id' => $clienteId,
            'funcionario_id' => $funcionarioId,
            'nome' => $nome,
            'cidade' => $cidade,
            'distribuidora' => $distribuidora,
            'potencia' => $potenciaKwp,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void
    {
        $permitidos = ['nome', 'cidade', 'distribuidora', 'potencia_kwp', 'cliente_id', 'funcionario_responsavel_id'];
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

        $stmt = $this->db->prepare('UPDATE projetos SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function excluir(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE projetos SET excluido = 1 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function atualizarStatus(int $id, string $status, int $stageIndex): void
    {
        $finalizadoAt = $status === 'finalizado' ? date('Y-m-d H:i:s') : null;
        $stmt = $this->db->prepare(
            'UPDATE projetos SET status = :status, stage_index = :stage_index, finalizado_at = :finalizado_at WHERE id = :id'
        );
        $stmt->execute([
            'status' => $status,
            'stage_index' => $stageIndex,
            'finalizado_at' => $finalizadoAt,
            'id' => $id,
        ]);
    }

    public function atribuirFuncionario(int $projetoId, int $funcionarioId): void
    {
        $stmt = $this->db->prepare('UPDATE projetos SET funcionario_responsavel_id = :funcionario_id WHERE id = :id');
        $stmt->execute(['funcionario_id' => $funcionarioId, 'id' => $projetoId]);
    }
}
