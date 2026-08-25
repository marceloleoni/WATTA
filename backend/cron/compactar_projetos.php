<?php

declare(strict_types=1);

/**
 * Compacta em .zip os documentos de projetos finalizados/cancelados há 5+ dias.
 * Roda 1x/dia — registrar no cPanel > Cron Jobs com intervalo >= 15 minutos
 * (ex.: "0 3 * * *" para rodar todo dia às 3h). Arquivos originais são mantidos
 * (guardados indefinidamente por enquanto, conforme CLAUDE.md).
 */

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Watta\Config\Database;

if (file_exists(__DIR__ . '/../.env')) {
    Dotenv::createImmutable(__DIR__ . '/..')->load();
}

$db = Database::connection();
$storageBase = __DIR__ . '/../storage/documentos';

$stmt = $db->query(
    "SELECT id, codigo FROM projetos
     WHERE status IN ('finalizado', 'cancelado')
       AND finalizado_at IS NOT NULL
       AND finalizado_at <= (NOW() - INTERVAL 5 DAY)"
);
$projetos = $stmt->fetchAll();

foreach ($projetos as $projeto) {
    $dirProjeto = "{$storageBase}/{$projeto['id']}";
    $zipPath = "{$storageBase}/{$projeto['codigo']}.zip";

    if (!is_dir($dirProjeto) || file_exists($zipPath)) {
        continue;
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
        fwrite(STDERR, "Falha ao criar zip para o projeto {$projeto['codigo']}\n");
        continue;
    }

    $arquivos = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dirProjeto, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($arquivos as $arquivo) {
        $caminhoLocal = substr($arquivo->getPathname(), strlen($dirProjeto) + 1);
        $zip->addFile($arquivo->getPathname(), $caminhoLocal);
    }
    $zip->close();

    echo "Projeto {$projeto['codigo']} compactado em {$zipPath}\n";
}
