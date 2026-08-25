<?php

declare(strict_types=1);

namespace Watta\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Watta\Repositories\DocumentoRepository;
use Watta\Repositories\ProjetoRepository;

/**
 * Chatbot local baseado em regras/intenção — sem LLM externo.
 * Identifica a pergunta e consulta o banco de dados diretamente (status do
 * projeto do cliente logado, documentos pendentes), em vez de responder com FAQ estático.
 */
class ChatbotController
{
    private ProjetoRepository $projetos;
    private DocumentoRepository $documentos;

    public function __construct(ProjetoRepository $projetos, DocumentoRepository $documentos)
    {
        $this->projetos = $projetos;
        $this->documentos = $documentos;
    }

    public function responder(Request $request, Response $response): Response
    {
        $usuario = $request->getAttribute('usuario');
        $body = (array) $request->getParsedBody();
        $texto = mb_strtolower(trim((string) ($body['texto'] ?? '')));

        if ($texto === '') {
            return $this->json($response, ['erro' => 'Mensagem vazia.'], 422);
        }

        $resposta = $this->interpretar($texto, $usuario);

        return $this->json($response, ['resposta' => $resposta]);
    }

    private function interpretar(string $texto, array $usuario): string
    {
        if (str_contains($texto, 'documento')) {
            if ($usuario['perfil'] === 'cliente') {
                $pendentes = $this->documentosPendentesDoCliente($usuario['id']);
                if ($pendentes !== null) {
                    return $pendentes;
                }
            }
            return 'Os documentos exigidos são: projeto elétrico (ART/RRT), identidade do titular, comprovante de propriedade, conta de energia dos últimos 3 meses e o formulário de solicitação de acesso. Você pode enviá-los na tela "Meus Documentos".';
        }

        if (str_contains($texto, 'prazo') || str_contains($texto, 'tempo') || str_contains($texto, 'demora')) {
            return 'O prazo médio de homologação é de 15 a 30 dias após o envio de todos os documentos, variando por distribuidora.';
        }

        if (str_contains($texto, 'status') || str_contains($texto, 'andamento')) {
            if ($usuario['perfil'] === 'cliente') {
                $statusResumo = $this->statusProjetosDoCliente($usuario['id']);
                if ($statusResumo !== null) {
                    return $statusResumo;
                }
            }
            return 'Você pode acompanhar o status detalhado do seu projeto na tela "Meus Projetos", clicando no projeto desejado.';
        }

        if (str_contains($texto, 'analista') || str_contains($texto, 'falar') || str_contains($texto, 'atendente') || str_contains($texto, 'humano')) {
            return 'Vou te direcionar para o chat com o analista responsável pelo seu projeto.';
        }

        if (str_contains($texto, 'rejeit') || str_contains($texto, 'recusa')) {
            return 'Se um documento foi rejeitado, reenvie a versão corrigida na tela "Meus Documentos" — o analista será notificado automaticamente.';
        }

        return 'Não tenho certeza sobre isso ainda. Posso ajudar com: documentos exigidos, prazos de homologação, status do projeto ou te conectar com um analista.';
    }

    private function documentosPendentesDoCliente(int $clienteId): ?string
    {
        $projetos = $this->projetos->listarParaUsuario(['id' => $clienteId, 'perfil' => 'cliente']);
        if (empty($projetos)) {
            return null;
        }

        $partes = [];
        foreach ($projetos as $projeto) {
            $docs = $this->documentos->listarPorProjeto((int) $projeto['id']);
            $pendentes = array_filter($docs, fn ($d) => $d['status'] === 'pendente' || $d['status'] === 'revisar');
            if (!empty($pendentes)) {
                $nomes = implode(', ', array_map(fn ($d) => $d['tipo'], $pendentes));
                $partes[] = "{$projeto['nome']} ({$projeto['codigo']}): {$nomes}";
            }
        }

        if (empty($partes)) {
            return 'Todos os seus documentos estão em dia, não há pendências no momento.';
        }

        return 'Você tem documentos pendentes em: ' . implode(' | ', $partes) . '.';
    }

    private function statusProjetosDoCliente(int $clienteId): ?string
    {
        $projetos = $this->projetos->listarParaUsuario(['id' => $clienteId, 'perfil' => 'cliente']);
        if (empty($projetos)) {
            return null;
        }

        $partes = array_map(fn ($p) => "{$p['nome']} ({$p['codigo']}): {$p['status']}", $projetos);
        return 'Status dos seus projetos — ' . implode(' | ', $partes) . '.';
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
