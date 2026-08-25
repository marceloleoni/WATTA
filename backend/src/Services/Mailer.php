<?php

declare(strict_types=1);

namespace Watta\Services;

use PDO;

/**
 * Notificação por e-mail usando mail() nativo do PHP — compatível com hospedagem
 * compartilhada (sem dependência de SMTP externo ou processos em background).
 */
class Mailer
{
    private PDO $db;
    private string $from;
    private string $fromName;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->from = $_ENV['MAIL_FROM'] ?? 'nao-responda@sistema.dominio.com.br';
        $this->fromName = $_ENV['MAIL_FROM_NAME'] ?? 'WATTA';
    }

    public function notificar(int $usuarioId, string $emailDestino, string $eventoOrigem, string $projetoNome, string $acao, string $responsavelNome): void
    {
        $agora = date('d/m/Y H:i');
        $mensagem = "Projeto: {$projetoNome}\nAção: {$acao}\nHorário: {$agora}\nResponsável: {$responsavelNome}";

        $stmt = $this->db->prepare(
            'INSERT INTO notificacoes (usuario_id, canal, evento_origem, mensagem, enviado) VALUES (:usuario_id, "email", :evento, :mensagem, 0)'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'evento' => $eventoOrigem,
            'mensagem' => $mensagem,
        ]);
        $notificacaoId = (int) $this->db->lastInsertId();

        $assunto = "[WATTA] {$acao} — {$projetoNome}";
        $corpo = "Olá,\n\n{$mensagem}\n\nAcesse o sistema para mais detalhes.\n\nWATTA — Homologação Solar";
        $headers = "From: {$this->fromName} <{$this->from}>\r\nContent-Type: text/plain; charset=UTF-8";

        $enviado = @mail($emailDestino, $assunto, $corpo, $headers);

        $update = $this->db->prepare('UPDATE notificacoes SET enviado = :enviado WHERE id = :id');
        $update->execute(['enviado' => $enviado ? 1 : 0, 'id' => $notificacaoId]);
    }
}
