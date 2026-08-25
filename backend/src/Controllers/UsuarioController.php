<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\UsuarioRepository;
use Watta\Services\AuditLogger;

class UsuarioController
{
    private const PERFIS = ['admin', 'gerente', 'funcionario', 'cliente'];
    private const CAMPOS_CADASTRO = [
        'telefone', 'documento', 'cargo',
        'endereco_logradouro', 'endereco_numero', 'endereco_bairro',
        'endereco_cidade', 'endereco_uf', 'endereco_cep',
    ];

    private UsuarioRepository $usuarios;
    private AuditLogger $auditLogger;

    public function __construct(UsuarioRepository $usuarios, AuditLogger $auditLogger)
    {
        $this->usuarios = $usuarios;
        $this->auditLogger = $auditLogger;
    }

    public function listar(Request $request, Response $response): Response
    {
        $perfil = $request->getQueryParams()['perfil'] ?? null;
        if ($perfil !== null && !in_array($perfil, self::PERFIS, true)) {
            return $this->json($response, ['erro' => 'Perfil inválido.'], 422);
        }
        return $this->json($response, $this->usuarios->listarTodos($perfil));
    }

    /**
     * Cadastro de funcionário/gerente/cliente feito pela equipe (RoleMiddleware garante
     * que quem chama é funcionario/gerente/admin). As regras de quem pode cadastrar quem
     * são refinadas aqui, por perfil solicitado:
     * - cliente: qualquer membro da equipe.
     * - funcionario: admin ou gerente.
     * - gerente ou admin: só admin.
     */
    public function criar(Request $request, Response $response): Response
    {
        $usuarioAuth = $request->getAttribute('usuario');
        $body = (array) $request->getParsedBody();

        $nome = trim((string) ($body['nome'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $senha = (string) ($body['senha'] ?? '');
        $perfil = (string) ($body['perfil'] ?? 'cliente');

        if ($nome === '' || $email === '' || $senha === '') {
            return $this->json($response, ['erro' => 'Preencha nome, e-mail e senha.'], 422);
        }
        if (!in_array($perfil, self::PERFIS, true)) {
            return $this->json($response, ['erro' => 'Perfil inválido.'], 422);
        }
        if (in_array($perfil, ['gerente', 'admin'], true) && $usuarioAuth['perfil'] !== 'admin') {
            return $this->json($response, ['erro' => 'Apenas administradores podem cadastrar gerente ou administrador.'], 403);
        }
        if ($perfil === 'funcionario' && !in_array($usuarioAuth['perfil'], ['admin', 'gerente'], true)) {
            return $this->json($response, ['erro' => 'Apenas administradores ou gerentes podem cadastrar funcionários.'], 403);
        }
        if ($this->usuarios->buscarPorEmail($email)) {
            return $this->json($response, ['erro' => 'Já existe um usuário com este e-mail.'], 409);
        }

        $hash = password_hash($senha, PASSWORD_BCRYPT);
        $campos = $this->extrairCamposCadastro($body);
        $id = $this->usuarios->criar($nome, $email, $hash, $perfil, $campos);
        $this->auditLogger->log($usuarioAuth['id'], 'criar_usuario', 'usuario', $id);

        return $this->json($response, $this->usuarios->buscarPorId($id), 201);
    }

    public function atualizar(Request $request, Response $response, array $args): Response
    {
        $usuarioAuth = $request->getAttribute('usuario');
        $id = (int) $args['id'];
        $alvo = $this->usuarios->buscarPorId($id);

        if (!$alvo) {
            return $this->json($response, ['erro' => 'Usuário não encontrado.'], 404);
        }
        if (!$this->podeGerenciar($usuarioAuth, $alvo['perfil'])) {
            return $this->json($response, ['erro' => 'Você não tem permissão para editar este usuário.'], 403);
        }

        $body = (array) $request->getParsedBody();
        $campos = [];

        if (array_key_exists('nome', $body)) {
            $nome = trim((string) $body['nome']);
            if ($nome === '') {
                return $this->json($response, ['erro' => 'Nome não pode ficar em branco.'], 422);
            }
            $campos['nome'] = $nome;
        }
        if (array_key_exists('email', $body)) {
            $email = trim((string) $body['email']);
            if ($email === '') {
                return $this->json($response, ['erro' => 'E-mail não pode ficar em branco.'], 422);
            }
            $existente = $this->usuarios->buscarPorEmail($email);
            if ($existente && (int) $existente['id'] !== $id) {
                return $this->json($response, ['erro' => 'Já existe um usuário com este e-mail.'], 409);
            }
            $campos['email'] = $email;
        }
        if (array_key_exists('perfil', $body)) {
            if ($usuarioAuth['perfil'] !== 'admin') {
                return $this->json($response, ['erro' => 'Apenas administradores podem alterar o perfil de um usuário.'], 403);
            }
            $perfil = (string) $body['perfil'];
            if (!in_array($perfil, self::PERFIS, true)) {
                return $this->json($response, ['erro' => 'Perfil inválido.'], 422);
            }
            $campos['perfil'] = $perfil;
        }
        if (!empty($body['senha'])) {
            $campos['senha_hash'] = password_hash((string) $body['senha'], PASSWORD_BCRYPT);
        }

        $campos = array_merge($campos, $this->extrairCamposCadastro($body));

        if (empty($campos)) {
            return $this->json($response, ['erro' => 'Nenhum campo para atualizar.'], 422);
        }

        $this->usuarios->atualizar($id, $campos);
        $this->auditLogger->log($usuarioAuth['id'], 'editar_usuario', 'usuario', $id);

        return $this->json($response, $this->usuarios->buscarPorId($id));
    }

    public function desativar(Request $request, Response $response, array $args): Response
    {
        return $this->alterarAtivo($request, $response, $args, false, 'desativar_usuario');
    }

    public function reativar(Request $request, Response $response, array $args): Response
    {
        return $this->alterarAtivo($request, $response, $args, true, 'reativar_usuario');
    }

    private function alterarAtivo(Request $request, Response $response, array $args, bool $ativo, string $acao): Response
    {
        $usuarioAuth = $request->getAttribute('usuario');
        $id = (int) $args['id'];

        if ($id === (int) $usuarioAuth['id']) {
            return $this->json($response, ['erro' => 'Você não pode alterar o próprio status de acesso.'], 422);
        }

        $alvo = $this->usuarios->buscarPorId($id);
        if (!$alvo) {
            return $this->json($response, ['erro' => 'Usuário não encontrado.'], 404);
        }
        if (!$this->podeGerenciar($usuarioAuth, $alvo['perfil'])) {
            return $this->json($response, ['erro' => 'Você não tem permissão para alterar este usuário.'], 403);
        }

        $this->usuarios->definirAtivo($id, $ativo);
        $this->auditLogger->log($usuarioAuth['id'], $acao, 'usuario', $id);

        return $this->json($response, $this->usuarios->buscarPorId($id));
    }

    /**
     * Admin gerencia qualquer um. Gerente só gerencia funcionário/cliente — não mexe em
     * outro gerente ou em administrador.
     */
    private function podeGerenciar(array $usuarioAuth, string $perfilAlvo): bool
    {
        if ($usuarioAuth['perfil'] === 'admin') {
            return true;
        }
        return $usuarioAuth['perfil'] === 'gerente' && in_array($perfilAlvo, ['funcionario', 'cliente'], true);
    }

    private function extrairCamposCadastro(array $body): array
    {
        $campos = [];
        foreach (self::CAMPOS_CADASTRO as $campo) {
            if (array_key_exists($campo, $body)) {
                $valor = trim((string) $body[$campo]);
                $campos[$campo] = $valor === '' ? null : $valor;
            }
        }
        return $campos;
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        if (is_array($data) && isset($data['senha_hash'])) {
            unset($data['senha_hash']);
        }
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
