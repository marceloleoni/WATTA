<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\ConversaRepository;
use Watta\Repositories\ProjetoRepository;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\AuditLogger;
use Watta\Services\Mailer;

class ProjetoController
{
    private ProjetoRepository $projetos;
    private UsuarioRepository $usuarios;
    private AuditLogger $auditLogger;
    private Mailer $mailer;
    private ConversaRepository $conversas;

    public function __construct(ProjetoRepository $projetos, UsuarioRepository $usuarios, AuditLogger $auditLogger, Mailer $mailer, ConversaRepository $conversas)
    {
        $this->projetos = $projetos;
        $this->usuarios = $usuarios;
        $this->auditLogger = $auditLogger;
        $this->mailer = $mailer;
        $this->conversas = $conversas;
    }

    public function listar(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $lista = $this->projetos->listarParaUsuario($usuario);
        return $this->json($response, $lista);
    }

    public function detalhe(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $projeto = $this->projetos->buscarPorId((int) $args['id']);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }
        if (!$this->projetos->podeVisualizar($projeto, $usuario)) {
            return $this->json($response, ['erro' => 'Acesso não permitido a este projeto.'], 403);
        }

        return $this->json($response, $projeto);
    }

    public function solicitar(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $body = (array) $request->getParsedBody();

        $nome = trim((string) ($body['nome'] ?? ''));
        $cidade = trim((string) ($body['cidade'] ?? ''));
        $distribuidora = trim((string) ($body['distribuidora'] ?? ''));
        $potencia = (float) ($body['potenciaKwp'] ?? 0);

        if ($nome === '' || $cidade === '' || $distribuidora === '' || $potencia <= 0) {
            return $this->json($response, ['erro' => 'Preencha nome, cidade, distribuidora e potência do projeto.'], 422);
        }

        $id = $this->projetos->criar($usuario['id'], $nome, $cidade, $distribuidora, $potencia);
        $this->auditLogger->log($usuario['id'], 'solicitar_projeto', 'projeto', $id);
        $this->conversas->encontrarOuCriarPorProjeto($id, [$usuario['id']]);

        $projeto = $this->projetos->buscarPorId($id);
        return $this->json($response, $projeto, 201);
    }

    public function criar(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $body = (array) $request->getParsedBody();

        $clienteId = (int) ($body['clienteId'] ?? 0);
        $nome = trim((string) ($body['nome'] ?? ''));
        $cidade = trim((string) ($body['cidade'] ?? ''));
        $distribuidora = trim((string) ($body['distribuidora'] ?? ''));
        $potencia = (float) ($body['potenciaKwp'] ?? 0);

        if ($clienteId <= 0 || $nome === '' || $cidade === '' || $distribuidora === '' || $potencia <= 0) {
            return $this->json($response, ['erro' => 'Selecione o cliente e preencha nome, cidade, distribuidora e potência do projeto.'], 422);
        }

        $cliente = $this->usuarios->buscarPorId($clienteId);
        if (!$cliente || $cliente['perfil'] !== 'cliente') {
            return $this->json($response, ['erro' => 'Cliente inválido.'], 422);
        }

        $id = $this->projetos->criarDireto($clienteId, $usuario['id'], $nome, $cidade, $distribuidora, $potencia);
        $this->auditLogger->log($usuario['id'], 'criar_projeto_direto', 'projeto', $id);
        $this->conversas->encontrarOuCriarPorProjeto($id, [$clienteId, $usuario['id']]);

        $projeto = $this->projetos->buscarPorId($id);
        $this->notificarCliente($projeto, 'Novo projeto criado', $usuario['nome']);

        return $this->json($response, $projeto, 201);
    }

    public function atualizar(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $projeto = $this->projetos->buscarPorId($id);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }

        $body = (array) $request->getParsedBody();
        $campos = [];

        if (array_key_exists('nome', $body)) {
            $campos['nome'] = trim((string) $body['nome']);
        }
        if (array_key_exists('cidade', $body)) {
            $campos['cidade'] = trim((string) $body['cidade']);
        }
        if (array_key_exists('distribuidora', $body)) {
            $campos['distribuidora'] = trim((string) $body['distribuidora']);
        }
        if (array_key_exists('potenciaKwp', $body)) {
            $campos['potencia_kwp'] = (float) $body['potenciaKwp'];
        }
        if (array_key_exists('funcionarioResponsavelId', $body)) {
            $campos['funcionario_responsavel_id'] = $body['funcionarioResponsavelId'] !== null ? (int) $body['funcionarioResponsavelId'] : null;
        }
        if (array_key_exists('clienteId', $body)) {
            $novoCliente = $this->usuarios->buscarPorId((int) $body['clienteId']);
            if (!$novoCliente || $novoCliente['perfil'] !== 'cliente') {
                return $this->json($response, ['erro' => 'Cliente inválido.'], 422);
            }
            $campos['cliente_id'] = (int) $body['clienteId'];
        }

        if (empty($campos)) {
            return $this->json($response, ['erro' => 'Nenhum campo para atualizar.'], 422);
        }

        $this->projetos->atualizar($id, $campos);
        $this->auditLogger->log($usuario['id'], 'editar_projeto', 'projeto', $id);

        return $this->json($response, $this->projetos->buscarPorId($id));
    }

    public function excluir(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $projeto = $this->projetos->buscarPorId($id);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }

        $this->projetos->excluir($id);
        $this->auditLogger->log($usuario['id'], 'excluir_projeto', 'projeto', $id);

        return $this->json($response, ['ok' => true]);
    }

    public function aprovarAbertura(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $projeto = $this->projetos->buscarPorId($id);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }

        $this->projetos->atribuirFuncionario($id, $usuario['id']);
        $this->projetos->atualizarStatus($id, 'ativo', 0);
        $this->auditLogger->log($usuario['id'], 'aprovar_abertura_projeto', 'projeto', $id);
        $this->conversas->encontrarOuCriarPorProjeto($id, [(int) $projeto['cliente_id'], $usuario['id']]);
        $this->notificarCliente($projeto, 'Abertura de projeto aprovada', $usuario['nome']);

        return $this->json($response, $this->projetos->buscarPorId($id));
    }

    public function homologar(Request $request, Response $response, array $args): Response
    {
        return $this->transicionar($request, $response, $args, 'finalizado', 4, 'homologar_projeto', 'Projeto homologado');
    }

    public function rejeitar(Request $request, Response $response, array $args): Response
    {
        return $this->transicionar($request, $response, $args, 'cancelado', null, 'rejeitar_projeto', 'Projeto rejeitado');
    }

    public function solicitarCorrecao(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $projeto = $this->projetos->buscarPorId($id);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }

        $this->auditLogger->log($usuario['id'], 'solicitar_correcao_projeto', 'projeto', $id);
        $this->notificarCliente($projeto, 'Correção solicitada no projeto', $usuario['nome']);

        return $this->json($response, $this->projetos->buscarPorId($id));
    }

    private function transicionar(Request $request, Response $response, array $args, string $status, ?int $stageIndex, string $acao, string $mensagemAcao): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $projeto = $this->projetos->buscarPorId($id);

        if (!$projeto) {
            return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
        }

        $this->projetos->atualizarStatus($id, $status, $stageIndex ?? (int) $projeto['stage_index']);
        $this->auditLogger->log($usuario['id'], $acao, 'projeto', $id);
        if (in_array($status, ['finalizado', 'cancelado'], true)) {
            $this->conversas->arquivarPorProjeto($id);
        }
        $this->notificarCliente($projeto, $mensagemAcao, $usuario['nome']);

        return $this->json($response, $this->projetos->buscarPorId($id));
    }

    private function notificarCliente(array $projeto, string $acao, string $responsavelNome): void
    {
        $cliente = $this->usuarios->buscarPorId((int) $projeto['cliente_id']);
        if ($cliente) {
            $this->mailer->notificar((int) $cliente['id'], $cliente['email'], 'status_projeto', $projeto['nome'], $acao, $responsavelNome);
        }
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
