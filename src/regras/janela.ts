// Janela de agendamento: a partir de quando pode agendar e até quando vale.
//  T1 antecedência (dias úteis) · T2 antecedência por quantidade · T3 análise da operadora
//  T4 só depois de autorizado · T5 validade do pedido / autorização (dias corridos, a partir do dia seguinte)
// Vários exames no mesmo pedido: vale o MAIOR prazo (decisão D13).
import type { BaseDados } from '../repositorio/repositorio';
import type { Exame } from '../tipos/modelos';
import { br, diferencaDias, nomeDia, proximoDiaAtendimento, somarDias, somarDiasUteis } from './calendario';
import { convenioPorSlug, gruposDoExame, modalidadeBase, regrasDoConvenio, alvoCasa } from './contexto';

export interface ExamePedido { exame: Exame; quantidade: number }

export interface PrazoExame { exameId: number; grupo: string; dias: number | null; motivo: string }

export interface Janela {
  hoje: string;
  agendarAPartirDe: string | null;   // null = depende da autorização (T4) ou sem informação
  motivoAPartir: string;
  prazos: PrazoExame[];
  soDepoisDeAutorizar: string[];      // nomes dos exames com T4
  analise: string[];                  // avisos de análise da operadora (T3)
  pedidoValeAte: string | null;
  pedidoVencido: boolean;
  diasRestantesPedido: number | null;
  autorizacaoValeDias: number | null;
  autorizacaoValeAte: string | null;
  semInformacao: string[];
  avisos: string[];
}

const NOME_GRUPO: Record<string, string> = { cardiaco: 'exame cardíaco', articulacao: 'articulações', padrao: 'prazo padrão do convênio' };

export function calcularJanela(b: BaseDados, slug: string, exames: ExamePedido[], dataPedido: string | null, hoje: string,
  dataAutorizacao?: string | null): Janela {
  const conv = convenioPorSlug(b, slug);
  const prazos = conv ? b.prazos.filter((p) => p.convenio_id === conv.id) : [];
  const ag = prazos.filter((p) => p.tipo === 'agendamento');
  const cfg = conv ? b.config.find((c) => c.convenio_id === conv.id) : undefined;
  const regras = regrasDoConvenio(b, slug);
  const semInformacao: string[] = []; const avisos: string[] = [];

  // quantidade de articulações no pedido (T2)
  const qtdArticulacoes = exames.filter((x) => gruposDoExame(b, x.exame).includes('articulacao')).reduce((s, x) => s + x.quantidade, 0);

  const prazosExame: PrazoExame[] = exames.map(({ exame }) => {
    const g = gruposDoExame(b, exame);
    // prazos de grupo que valem para este exame (cardíaco, angio; articulação só a partir da quantidade mínima)
    const doGrupo = ag.filter((p) => p.grupo !== null && p.dias !== null && (
      (p.grupo === 'articulacao' ? g.includes('articulacao') && qtdArticulacoes >= (p.qtd_minima ?? 1) : g.includes(p.grupo))));
    if (doGrupo.length) {
      const p = doGrupo.reduce((m, x) => ((x.dias ?? 0) > (m.dias ?? 0) ? x : m));
      const rot = p.grupo === 'articulacao' ? `${qtdArticulacoes} articulações no pedido` : p.grupo === 'cardiaco' ? 'exame cardíaco' : 'exame angio';
      return { exameId: exame.id, grupo: p.grupo!, dias: p.dias, motivo: `${p.dias} dias úteis (${rot})` };
    }
    const pad = ag.find((p) => p.grupo === null);
    if (pad) return { exameId: exame.id, grupo: 'padrao', dias: pad.dias, motivo: `${pad.dias} dias úteis (${NOME_GRUPO.padrao})` };
    return { exameId: exame.id, grupo: 'padrao', dias: null, motivo: 'Antecedência: sem informação' };
  });
  if (prazosExame.some((p) => p.dias === null)) semInformacao.push(`Antecedência de agendamento sem informação — confirmar com ${conv?.responsavel ?? 'o setor'}`);

  // T4: só depois de autorizado
  const soDepois = exames.filter(({ exame }) => regras.some((r) => r.molde === 'M05' && r.alvos.some((a) => alvoCasa(b, a, exame)))).map((x) => x.exame.nome);
  // T3: análise da operadora
  const analise: string[] = [];
  for (const r of regras.filter((x) => x.molde === 'M04')) {
    const vale = r.alvos.some((a) => a === 'TODOS') || exames.some(({ exame }) => r.alvos.some((a) => alvoCasa(b, a, exame)));
    if (!vale) continue;
    if (r.campos.auditoria_todos) analise.push('Todos os pedidos passam por auditoria da operadora');
    else if (r.campos.dias_max) analise.push(`A operadora pode levar até ${r.campos.dias_max} dias${r.campos.contagem === 'uteis' ? ' úteis' : r.campos.contagem ? '' : ' (úteis ou corridos: a confirmar)'} para autorizar`);
  }

  // data mínima = maior antecedência entre os exames, ajustada para um dia em que a RCC atende
  const maior = prazosExame.reduce((m, p) => (p.dias !== null && p.dias > m ? p.dias : m), -1);
  let agendarAPartirDe: string | null = null; let motivoAPartir = '';
  const modalidades = [...new Set(exames.map((x) => modalidadeBase(x.exame)))];
  if (soDepois.length) {
    motivoAPartir = 'Só agendar depois que o convênio autorizar';
    if (dataAutorizacao) { agendarAPartirDe = proximoDiaAtendimento(dataAutorizacao, modalidades); motivoAPartir = 'Autorizado em ' + br(dataAutorizacao); }
  } else if (maior >= 0) {
    const base = somarDiasUteis(b.feriados, hoje, maior);
    agendarAPartirDe = proximoDiaAtendimento(base, modalidades);
    const p = prazosExame.find((x) => x.dias === maior)!;
    motivoAPartir = p.motivo + (agendarAPartirDe !== base ? ` · ${nomeDia(base)} a RCC não atende essa modalidade` : '');
  } else motivoAPartir = 'Antecedência sem informação';

  // T5 validade do pedido: N dias corridos começando no dia seguinte ao pedido
  const semPrazo = regras.some((r) => r.molde === 'M01' && r.campos.sem_prazo);
  let pedidoValeAte: string | null = null; let pedidoVencido = false; let diasRestantesPedido: number | null = null;
  if (dataPedido && cfg?.validade_pedido_dias) {
    pedidoValeAte = somarDias(dataPedido, cfg.validade_pedido_dias);
    diasRestantesPedido = diferencaDias(hoje, pedidoValeAte);
    pedidoVencido = diasRestantesPedido < 0;
  } else if (!semPrazo && !cfg?.validade_pedido_dias) semInformacao.push(`Validade do pedido sem informação — confirmar com ${conv?.responsavel ?? 'o setor'}`);
  if (dataPedido && dataPedido > hoje) avisos.push('A data do pedido está no futuro — confira a data digitada');

  const autorizacaoValeDias = cfg?.validade_autorizacao_dias ?? null;
  const autorizacaoValeAte = dataAutorizacao && autorizacaoValeDias ? somarDias(dataAutorizacao, autorizacaoValeDias) : null;
  const autorizacaoSemPrazo = regras.some((r) => r.molde === 'M02' && r.campos.sem_prazo);
  if (autorizacaoValeDias === null && !autorizacaoSemPrazo) semInformacao.push(`Validade da autorização sem informação — confirmar com ${conv?.responsavel ?? 'o setor'}`);
  if (pedidoValeAte && agendarAPartirDe && agendarAPartirDe > pedidoValeAte)
    avisos.push(`O pedido vence (${br(pedidoValeAte)}) antes da primeira data possível (${br(agendarAPartirDe)})`);

  return { hoje, agendarAPartirDe, motivoAPartir, prazos: prazosExame, soDepoisDeAutorizar: soDepois, analise, pedidoValeAte, pedidoVencido,
    diasRestantesPedido, autorizacaoValeDias, autorizacaoValeAte, semInformacao, avisos };
}
