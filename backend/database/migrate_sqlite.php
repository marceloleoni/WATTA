<?php

declare(strict_types=1);

/**
 * Recria o banco SQLite local a partir de schema.sqlite.sql (+ seed.sqlite.sql, opcional).
 * Uso: php backend/database/migrate_sqlite.php [--seed] [--path=caminho/para/watta.sqlite]
 */

$seed = in_array('--seed', $argv, true);

$path = __DIR__ . '/watta.sqlite';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--path=')) {
        $path = substr($arg, strlen('--path='));
    }
}

if (file_exists($path)) {
    unlink($path);
}

$pdo = new PDO('sqlite:' . $path, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);
$pdo->exec('PRAGMA foreign_keys = OFF');

$schema = file_get_contents(__DIR__ . '/schema.sqlite.sql');
$pdo->exec($schema);

if ($seed) {
    $seedSql = file_get_contents(__DIR__ . '/seed.sqlite.sql');
    $pdo->exec($seedSql);
}

$pdo->exec('PRAGMA foreign_keys = ON');

echo "Banco SQLite criado em: {$path}" . ($seed ? ' (com dados de teste)' : '') . PHP_EOL;
