export const PROJETO_STATUS_META = {
  solicitado: { label: 'Solicitado', className: 'badge-gray' },
  aprovado: { label: 'Aberto', className: 'badge-blue' },
  ativo: { label: 'Em análise', className: 'badge-blue' },
  finalizado: { label: 'Homologado', className: 'badge-green' },
  cancelado: { label: 'Rejeitado', className: 'badge-red' },
};

export const DOCUMENTO_STATUS_META = {
  pendente: { label: 'Pendente', className: 'badge-gray' },
  revisar: { label: 'Revisar', className: 'badge-amber' },
  aceito: { label: 'Aprovado', className: 'badge-green' },
  reprovado: { label: 'Reprovado', className: 'badge-red' },
};

export const TIMELINE_STAGES = [
  'Protocolo recebido',
  'Análise documental',
  'Vistoria técnica',
  'Parecer de acesso',
  'Homologação concluída',
];

export const ROLE_LABELS = {
  cliente: 'Cliente',
  funcionario: 'Analista',
  gerente: 'Gerente',
  admin: 'Administrador',
};

export function formatPotencia(kwp) {
  return `${Number(kwp).toFixed(1).replace('.', ',')} kWp`;
}

export function formatDataHora(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatHora(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
