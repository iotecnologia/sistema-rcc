// Conferência do pedido médico e regras gerais do convênio (valem para o pedido inteiro).
import type { BaseDados } from '../repositorio/repositorio';
import type { Situacao } from '../tipos/modelos';
import { paraItem, type ItemRegra } from './autorizacao';
import { ALVOS_GERAIS, convenioPorSlug, regrasDoConvenio } from './contexto';

export interface LinhaChecklist { texto: string; forte: boolean; situacao: Situacao; fonte?: string; link?: string }

export interface RegrasGerais {
  validadePedidoDias: number | null;      // null = sem informação
  pedidoSemPrazo: boolean;
  validadeAutorizacaoDias: number | null;
  guiaPdf: string | null;
  portal: { url: string; rotulo: string } | null;
  responsavel: string | null;
  itens: ItemRegra[];                     // todas as regras gerais (para mostrar no convênio)
  checklist: LinhaChecklist[];            // o que o pedido precisa ter
}

const MOLDES_GERAIS = new Set(['M01', 'M02', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M03', 'M04', 'M13', 'M14', 'INFO']);

export function regrasGerais(b: BaseDados, slug: string): RegrasGerais {
  const conv = convenioPorSlug(b, slug);
  const cfg = conv ? b.config.find((c) => c.convenio_id === conv.id) : undefined;
  const regras = regrasDoConvenio(b, slug).filter((r) => MOLDES_GERAIS.has(r.molde) && (r.alvos.length === 0 || r.alvos.every((a) => ALVOS_GERAIS.has(a))));
  const itens = regras.map((r) => paraItem(b, r));
  const sit = (molde: string): Situacao => regras.find((r) => r.molde === molde)?.situacao ?? 'sem_informacao';
  const arq = conv ? b.arquivos.find((a) => a.convenio_id === conv.id && a.tipo === 'guia_sp_sadt') : undefined;

  const checklist: LinhaChecklist[] = [];
  const pedidoSemPrazo = regras.some((r) => r.molde === 'M01' && r.campos.sem_prazo);
  if (cfg?.validade_pedido_dias) checklist.push({ texto: `Pedido com no máximo ${cfg.validade_pedido_dias} dias (corridos)`, forte: true, situacao: sit('M01') });
  else if (pedidoSemPrazo) checklist.push({ texto: 'Pedido sem prazo de validade', forte: false, situacao: 'confirmada' });
  else checklist.push({ texto: 'Validade do pedido: sem informação — confirmar com ' + (conv?.responsavel ?? 'o setor'), forte: true, situacao: 'sem_informacao' });

  // conselho do médico solicitante
  const cons = conv ? b.conselhos.filter((c) => c.convenio_id === conv.id) : [];
  if (cons.length) {
    const ok = cons.filter((c) => c.aceita).map((c) => c.conselho + (c.restricao ? ` (${c.restricao})` : ''));
    const nao = cons.filter((c) => !c.aceita).map((c) => c.conselho);
    checklist.push({ texto: `Médico solicitante: ${ok.length ? 'aceita ' + ok.join(', ') : ''}${ok.length && nao.length ? ' · ' : ''}${nao.length ? 'NÃO aceita ' + nao.join(', ') : ''}`, forte: nao.length > 0, situacao: 'confirmada' });
  } else checklist.push({ texto: `Conselhos aceitos: sem informação — confirmar com ${conv?.responsavel ?? 'o setor'}`, forte: false, situacao: 'sem_informacao' });

  if (cfg?.exige_original || cfg?.aceita_copia === false) checklist.push({ texto: 'Pedido ORIGINAL (não aceita cópia)' + (regras.some((r) => r.molde === 'M07' && (r.campos.aceita ?? []).includes('digitalizado')) ? ' ou digitalizado' : ''), forte: true, situacao: 'confirmada' });
  else if (cfg?.aceita_copia) checklist.push({ texto: 'Aceita cópia legível do pedido', forte: false, situacao: sit('M07') });
  if (cfg?.exige_carimbo_assinatura) checklist.push({ texto: 'Pedido carimbado e assinado', forte: true, situacao: 'confirmada' });
  if (cfg?.exige_cid) checklist.push({ texto: 'CID ou indicação clínica em TODOS os exames', forte: true, situacao: 'confirmada' });
  if (cfg?.aceita_multipla_escolha === false) checklist.push({ texto: 'Não aceita pedido de múltipla escolha (X)', forte: true, situacao: 'confirmada' });
  if (cfg?.aceita_outro_estado === false) checklist.push({ texto: 'Só médico com CRM de São Paulo', forte: true, situacao: 'confirmada' });
  if (cfg?.guia_sp_sadt) checklist.push({ texto: 'Transcrever o pedido na guia SP/SADT antes de enviar', forte: true, situacao: 'confirmada', link: arq ? arq.arquivo : undefined });

  return {
    validadePedidoDias: cfg?.validade_pedido_dias ?? null,
    pedidoSemPrazo,
    validadeAutorizacaoDias: cfg?.validade_autorizacao_dias ?? null,
    guiaPdf: arq ? arq.arquivo : null,
    portal: conv?.portal_url ? { url: conv.portal_url, rotulo: conv.portal_rotulo ?? 'Portal de autorização' } : null,
    responsavel: conv?.responsavel ?? null,
    itens,
    checklist,
  };
}
