<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\ChatMensagemRepository;
use Watta\Repositories\ConversaRepository;
use Watta\Repositories\ProjetoRepository;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\AuditLogger;
use Watta\Services\Mailer;

class ChatController
{
    private ChatMensagemRepository $mensagens;
    private ConversaRepository $conversas;
    private ProjetoRepository $projetos;
    private UsuarioRepository $usuarios;
    private AuditLogger $auditLogger;
    private Mailer $mailer;

    public function __construct(
        ChatMensagemRepository $mensagens,
        ConversaRepository $conversas,
        ProjetoRepository $projetos,
        UsuarioRepository $usuarios,
        AuditLogger $auditLogger,
        Mailer $mailer
    ) {
        $this->mensagens = $mensagens;
        $this->conversas = $conversas;
        $this->projetos = $projetos;
        $this->usuarios = $usuarios;
        $this->auditLogger = $auditLogger;
        $this->mailer = $mailer;
    }

    public function conversas(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $arquivada = ($request->getQueryParams()['arquivada'] ?? '') === '1';

        $lista = $this->conversas->listarParaUsuario($usuario['id'], $arquivada);
        return $this->json($response, $lista);
    }

    public function criarConversa(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $body = (array) $request->getParsedBody();
        $tipo = (string) ($body['tipo'] ?? '');

        if ($tipo === 'projeto') {
            $projetoId = (int) ($body['projetoId'] ?? 0);
            $projeto = $this->projetos->buscarPorId($projetoId);
            if (!$projeto) {
                return $this->json($response, ['erro' => 'Projeto não encontrado.'], 404);
            }

            $conversaId = $this->conversas->encontrarOuCriarPorProjeto($projetoId, [
                (int) $projeto['cliente_id'],
                $projeto['funcionario_responsavel_id'] ? (int) $projeto['funcionario_responsavel_id'] : null,
                (int) $usuario['id'],
            ]);
            $this->auditLogger->log($usuario['id'], 'abrir_conversa_projeto', 'conversa', $conversaId);

            return $this->json($response, $this->conversas->buscarPorId($conversaId), 201);
        }

        if ($tipo === 'direta') {
            $usuarioId = (int) ($body['usuarioId'] ?? 0);
            $alvo = $this->usuarios->buscarPorId($usuarioId);
            if (!$alvo || $alvo['perfil'] === 'cliente') {
                return $this->json($response, ['erro' => 'Selecione um funcionário ou administrador válido.'], 422);
            }
            if ($usuarioId === (int) $usuario['id']) {
                return $this->json($response, ['erro' => 'Não é possível abrir uma conversa consigo mesmo.'], 422);
            }

            $conversaId = $this->conversas->criarDireta((int) $usuario['id'], $usuarioId);
            $this->auditLogger->log($usuario['id'], 'abrir_conversa_direta', 'conversa', $conversaId);

            return $this->json($response, $this->conversas->buscarPorId($conversaId), 201);
        }

        return $this->json($response, ['erro' => 'Tipo de conversa inválido.'], 422);
    }

    public function arquivarConversa(Request $request, Response $response, array $args): Response
    {
        return $this->alterarArquivamento($request, $response, $args, true);
    }

    public function desarquivarConversa(Request $request, Response $response, array $args): Response
    {
        return $this->alterarArquivamento($request, $response, $args, false);
    }

    private function alterarArquivamento(Request $request, Response $response, array $args, bool $arquivada): Response
    {
        $usuario = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $conversa = $this->conversas->buscarPorId($id);

        if (!$conversa || !$this->conversas->pertence($id, $usuario['id'])) {
            return $this->json($response, ['erro' => 'Conversa não encontrada.'], 404);
        }

        $this->conversas->arquivar($id, $arquivada);
        $this->auditLogger->log($usuario['id'], $arquivada ? 'arquivar_conversa' : 'desarquivar_conversa', 'conversa', $id);

        return $this->json($response, $this->conversas->buscarPorId($id));
    }

    public function listarMensagens(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $conversaId = (int) $args['id'];

        if (!$this->conversas->pertence($conversaId, $usuario['id'])) {
            return $this->json($response, ['erro' => 'Conversa não encontrada ou acesso não permitido.'], 404);
        }

        $desde = $request->getQueryParams()['since'] ?? null;
        $mensagens = $this->mensagens->listarPorConversa($conversaId, $desde);
        $this->conversas->marcarComoLida($conversaId, $usuario['id']);

        return $this->json($response, $mensagens);
    }

    public function enviarMensagem(Request $request, Response $response, array $args): Response
    {
        $usuario = $request->getAttribute('usuario');
        $conversaId = (int) $args['id'];
        $conversa = $this->conversas->buscarPorId($conversaId);

        if (!$conversa || !$this->conversas->pertence($conversaId, $usuario['id'])) {
            return $this->json($response, ['erro' => 'Conversa não encontrada ou acesso não permitido.'], 404);
        }

        $body = (array) $request->getParsedBody();
        $texto = trim((string) ($body['texto'] ?? ''));
        if ($texto === '') {
            return $this->json($response, ['erro' => 'Mensagem vazia.'], 422);
        }

        $id = $this->mensagens->enviar($conversaId, $usuario['id'], $texto);
        $this->auditLogger->log($usuario['id'], 'enviar_mensagem_chat', 'chat_mensagem', $id);

        if ($conversa['tipo'] === 'projeto' && $conversa['projeto_id']) {
            $projeto = $this->projetos->buscarPorId((int) $conversa['projeto_id']);
            if ($projeto) {
                $this->notificarContraparte($projeto, $usuario);
            }
        }

        $mensagens = $this->mensagens->listarPorConversa($conversaId);
        return $this->json($response, end($mensagens), 201);
    }

    private function notificarContraparte(array $projeto, array $remetente): void
    {
        if ($remetente['perfil'] === 'cliente' && !empty($projeto['funcionario_responsavel_id'])) {
            $funcionario = $this->usuarios->buscarPorId((int) $projeto['funcionario_responsavel_id']);
            if ($funcionario) {
                $this->mailer->notificar((int) $funcionario['id'], $funcionario['email'], 'nova_mensagem', $projeto['nome'], 'Nova mensagem do cliente', $remetente['nome']);
            }
        } elseif ($remetente['perfil'] !== 'cliente') {
            $cliente = $this->usuarios->buscarPorId((int) $projeto['cliente_id']);
            if ($cliente) {
                $this->mailer->notificar((int) $cliente['id'], $cliente['email'], 'nova_mensagem', $projeto['nome'], 'Nova mensagem do responsável', $remetente['nome']);
            }
        }
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
