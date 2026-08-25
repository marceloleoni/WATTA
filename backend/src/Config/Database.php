<?php

declare(strict_types=1);

namespace Watta\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            $driver = $_ENV['DB_DRIVER'] ?? 'mysql';

            try {
                self::$instance = $driver === 'sqlite'
                    ? self::conectarSqlite()
                    : self::conectarMysql();
            } catch (PDOException $e) {
                throw new PDOException('Falha ao conectar ao banco de dados: ' . $e->getMessage(), (int) $e->getCode());
            }
        }

        return self::$instance;
    }

    private static function conectarMysql(): PDO
    {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $name = $_ENV['DB_NAME'] ?? 'watta';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASS'] ?? '';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    /**
     * Banco local de desenvolvimento — evita depender de um servidor MySQL rodando.
     * Produção (HostGator) continua em MySQL/MariaDB (DB_DRIVER=mysql).
     */
    private static function conectarSqlite(): PDO
    {
        $path = $_ENV['DB_PATH'] ?? (__DIR__ . '/../../database/watta.sqlite');

        $pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');

        return $pdo;
    }
}
