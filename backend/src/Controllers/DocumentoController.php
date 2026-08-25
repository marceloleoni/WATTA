<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\DocumentoRepository;
use Watta\Repositories\ProjetoRepository;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\AuditLogger;
use Watta\Services\FileCodeGenerator;
use Watta\Services\Mailer;

class DocumentoController
{
    private DocumentoRepository $documentos;
    private ProjetoRepository $projetos;
    private UsuarioRepository $usuarios;
    private FileCodeGenerator $codeGenerator;
    private AuditLogger $auditLogger;
    private Mailer $mailer;
    private string $storagePath;

    public function __construct(
        DocumentoRepository $documentos,
        ProjetoRepository $projetos,
        UsuarioRepository $usuarios,
        FileCodeGenerator $codeGenerator,
        AuditLogger $auditLogger,
        Mailer $mailer
    ) {
        $this->documentos = $documentos;
        $this->projetos = $projetos;
        $this->usuarios = $usuarios;
        $this->codeGenerator = $codeGenerator;
        $this->auditLogger = $auditLogger;
        $this->mailer = $mailer;
        $this->storagePath = dirname(__DIR__, 2) . '/storage/documentos';
    }

    public function listarPorProjeto(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $projeto = $this->projetos->buscarPorId((int) $args['projetoId']);

        if (!$projeto || !$this->projetos->podeVisualizar($projeto, $usuario)) {
            return $this->json($response, ['erro' => 'Projeto não encontrado ou acesso não permitido.'], 404);
        }

        $lista = $this->documentos->listarPorProjeto((int) $args['projetoId']);
        foreach ($lista as &$doc) {
            $doc['comentarios'] = $this->documentos->listarComentarios((int) $doc['id']);
        }

        return $this->json($response, $lista);
    }

    public function upload(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $projetoId = (int) $args['projetoId'];
        $projeto = $this->projetos->buscarPorId($projetoId);

        if (!$projeto || !$this->projetos->podeVisualizar($projeto, $usuario)) {
            return $this->json($response, ['erro' => 'Projeto não encontrado ou acesso não permitido.'], 404);
        }

        $body = (array) $request->getParsedBody();
        $tipo = trim((string) ($body['tipo'] ?? ''));
        if ($tipo === '') {
            return $this->json($response, ['erro' => 'Informe o tipo do documento.'], 422);
        }

        $codigoArquivo = $this->codeGenerator->gerar($projeto['codigo'], $tipo);
        $caminhoRelativo = null;

        $arquivos = $request->getUploadedFiles();
        if (!empty($arquivos['arquivo'])) {
            $arquivo = $arquivos['arquivo'];
            if ($arquivo->getError() === UPLOAD_ERR_OK) {
                $dirProjeto = "{$this->storagePath}/{$projetoId}";
                if (!is_dir($dirProjeto)) {
                    mkdir($dirProjeto, 0755, true);
                }
                $extensao = pathinfo($arquivo->getClientFilename() ?? '', PATHINFO_EXTENSION);
                $nomeArquivo = $codigoArquivo . ($extensao ? ".{$extensao}" : '');
                $arquivo->moveTo("{$dirProjeto}/{$nomeArquivo}");
                $caminhoRelativo = "{$projetoId}/{$nomeArquivo}";
            }
        }

        // Pedido de documento: funcionário/admin registrando o tipo sem enviar arquivo,
        // pedindo que o cliente faça o upload.
        $ehPedido = $caminhoRelativo === null && $usuario['perfil'] !== 'cliente';
        $solicitadoPorId = $ehPedido ? $usuario['id'] : null;

        $id = $this->documentos->criar($projetoId, $usuario['id'], $tipo, $codigoArquivo, $caminhoRelativo, $solicitadoPorId);
        $this->auditLogger->log($usuario['id'], $ehPedido ? 'solicitar_documento' : 'enviar_documento', 'documento', $id);

        if ($ehPedido) {
            $this->notificarCliente($projeto, 'Novo documento solicitado', $usuario['nome']);
        } else {
            $this->notificarResponsaveis($projeto, 'Novo documento enviado', $usuario['nome']);
        }

        return $this->json($response, $this->documentos->buscarPorId($id), 201);
    }

    public function arquivo(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $documento = $this->documentos->buscarPorId((int) $args['id']);

        if (!$documento || !$documento['caminho_arquivo']) {
            return $this->json($response, ['erro' => 'Documento não encontrado.'], 404);
        }

        $projeto = $this->projetos->buscarPorId((int) $documento['projeto_id']);
        if (!$projeto || !$this->projetos->podeVisualizar($projeto, $usuario)) {
            return $this->json($response, ['erro' => 'Acesso não permitido a este documento.'], 403);
        }

        $caminhoCompleto = "{$this->storagePath}/{$documento['caminho_arquivo']}";
        if (!is_file($caminhoCompleto)) {
            return $this->json($response, ['erro' => 'Arquivo não encontrado no servidor.'], 404);
        }

        $mime = $this->mimePorExtensao($caminhoCompleto);
        $nome = basename($caminhoCompleto);

        $response->getBody()->write(file_get_contents($caminhoCompleto));
        return $response
            ->withHeader('Content-Type', $mime)
            ->withHeader('Content-Disposition', "inline; filename=\"{$nome}\"");
    }

    public function atualizarStatus(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');

        if ($usuario['perfil'] === 'cliente') {
            return $this->json($response, ['erro' => 'Apenas a equipe pode avaliar documentos.'], 403);
        }

        $documento = $this->documentos->buscarPorId((int) $args['id']);
        if (!$documento) {
            return $this->json($response, ['erro' => 'Documento não encontrado.'], 404);
        }

        $body = (array) $request->getParsedBody();
        $status = (string) ($body['status'] ?? '');
        $comentario = trim((string) ($body['comentario'] ?? ''));

        if (!in_array($status, ['aceito', 'reprovado', 'pendente', 'revisar'], true)) {
            return $this->json($response, ['erro' => 'Status de documento inválido.'], 422);
        }
        if ($status === 'revisar' && $comentario === '') {
            return $this->json($response, ['erro' => 'É obrigatório informar um comentário ao solicitar revisão.'], 422);
        }

        $this->documentos->atualizarStatus((int) $documento['id'], $status);
        if ($comentario !== '') {
            $this->documentos->adicionarComentario((int) $documento['id'], $usuario['id'], $comentario);
        }
        $this->auditLogger->log($usuario['id'], "documento_status_{$status}", 'documento', (int) $documento['id']);

        $projeto = $this->projetos->buscarPorId((int) $documento['projeto_id']);
        if ($projeto) {
            $this->notificarCliente($projeto, "Documento marcado como {$status}", $usuario['nome']);
        }

        $atualizado = $this->documentos->buscarPorId((int) $documento['id']);
        $atualizado['comentarios'] = $this->documentos->listarComentarios((int) $documento['id']);
        return $this->json($response, $atualizado);
    }

    private function notificarResponsaveis(array $projeto, string $acao, string $responsavelNome): void
    {
        if (!empty($projeto['funcionario_responsavel_id'])) {
            $funcionario = $this->usuarios->buscarPorId((int) $projeto['funcionario_responsavel_id']);
            if ($funcionario) {
                $this->mailer->notificar((int) $funcionario['id'], $funcionario['email'], 'novo_documento', $projeto['nome'], $acao, $responsavelNome);
            }
        }
    }

    private function notificarCliente(array $projeto, string $acao, string $responsavelNome): void
    {
        $cliente = $this->usuarios->buscarPorId((int) $projeto['cliente_id']);
        if ($cliente) {
            $this->mailer->notificar((int) $cliente['id'], $cliente['email'], 'status_documento', $projeto['nome'], $acao, $responsavelNome);
        }
    }

    /**
     * Mapa por extensão em vez de mime_content_type()/fileinfo — evita depender de uma
     * extensão do PHP que pode estar desabilitada na hospedagem compartilhada.
     */
    private function mimePorExtensao(string $caminho): string
    {
        $extensao = strtolower(pathinfo($caminho, PATHINFO_EXTENSION));
        $mapa = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'txt' => 'text/plain',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        return $mapa[$extensao] ?? 'application/octet-stream';
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
