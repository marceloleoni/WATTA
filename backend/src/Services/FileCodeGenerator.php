<?php

declare(strict_types=1);

namespace Watta\Services;

/**
 * Gera o código padronizado de um documento: {codigo_projeto}-{tipo_abreviado}-{timestamp}.
 * Usado para nomear arquivos de forma rastreável e evitar colisões (inode único por envio).
 */
class FileCodeGenerator
{
    public function gerar(string $codigoProjeto, string $tipoDocumento): string
    {
        $abreviacao = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', substr($tipoDocumento, 0, 8)));
        $timestamp = date('YmdHis');
        return "{$codigoProjeto}-{$abreviacao}-{$timestamp}";
    }
}
