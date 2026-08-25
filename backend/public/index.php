<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

if (file_exists(__DIR__ . '/../.env')) {
    \Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();
}

// CORS aplicado antes de qualquer outra coisa: garante que o preflight (OPTIONS)
// e qualquer erro fatal no bootstrap (ex.: banco de dados fora do ar) ainda
// respondam com os headers corretos, em vez de o navegador reportar "erro de CORS"
// para o que na verdade é um erro 500 sem headers.
$corsOrigin = $_ENV['APP_CORS_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$corsOrigin}");
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$app = (require __DIR__ . '/../src/App.php')();

$app->run();
