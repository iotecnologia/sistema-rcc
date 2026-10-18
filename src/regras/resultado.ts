// Junta tudo numa resposta só: convênio + exames + data do pedido → o que fazer.
import type { BaseDados } from '../repositorio/repositorio';
import type { Convenio, Situacao } from '../tipos/modelos';
import { agendaDoExame, type AgendaExame } from './agenda';
import { autorizacaoDoExame, coberturaImpede, paraItem, type AutorizacaoExame, type ItemRegra } from './autorizacao';
import { br } from './calendario';
import { ALVOS_COMBINACAO, convenioPorSlug, ehAngio, gruposDoExame, modalidadeBase, norm, regrasDoConvenio } from './contexto';
import { calcularJanela, type ExamePedido, type Janela } from './janela';
import { regrasGerais, type RegrasGerais } from './pedido';
import { situacaoDaRede, type RedeInfo } from './rede';

export interface Consulta {
  convenio: string;                 // slug
  exames: { exameId: number; quantidade?: number }[];
  dataPedido: string | null;        // AAAA-MM-DD
  hoje: string;                     // AAAA-MM-DD
  dataAutorizacao?: string | null;
  rede?: string | null;             // só para convênios que pedem a rede (Bradesco)
}

export interface ResultadoExame { autorizacao: AutorizacaoExame; agenda: AgendaExame; quantidade: number; grupos: string[] }

export type Situacao_Geral = 'pode_agendar' | 'atencao' | 'nao_pode';

export interface Resultado {
  convenio: Convenio;
  geral: RegrasGerais;
  exames: ResultadoExame[];
  combinacao: ItemRegra[];          // regras que dispararam pela combinação de exames (relatório, agrupamento…)
  janela: Janela;
  situacao: Situacao_Geral;
  motivos: string[];                // por que "não pode" ou "atenção"
  pendentes: ItemRegra[];           // regras envolvidas que estão a confirmar / em conflito / sem informação
  rede: RedeInfo | null;            // null quando o convênio não pede a rede
}

/** Regras do convênio que dependem da combinação de exames do pedido. */
function regrasDeCombinacao(b: BaseDados, slug: string, itens: ExamePedido[]): ItemRegra[] {
  const nomes = itens.map((x) => norm(x.exame.nome));
  const mods = itens.map((x) => modalidadeBase(x.exame));
  const temRM = mods.includes('RM');
  const temAngio = itens.some((x) => ehAngio(x.exame));
  const colunas = itens.filter((x) => norm(x.exame.nome).includes('COLUNA')).reduce((s, x) => s + x.quantidade, 0);
  const bilateral = itens.some((x) => x.quantidade >= 2 || nomes.some((n) => n.includes('BILATERAL')));
  const artBilateral = itens.some((x) => gruposDoExame(b, x.exame).includes('articulacao') && x.quantidade >= 2);
  const lombarBacia = nomes.some((n) => n.includes('COLUNA')) && nomes.some((n) => n.includes('BACIA') || n.includes('SACROILIACA'));
  const regioes = new Set(itens.filter((x) => ['RM', 'TC'].includes(modalidadeBase(x.exame))).map((x) => x.exame.id)).size;
  const dispara: Record<string, boolean> = {
    RM_MAIS_ANGIO: temRM && temAngio && itens.length > 1,
    COLUNA_MAIS_DE_UMA: colunas >= 2,
    ARTICULACAO_BILATERAL: artBilateral,
    EXAMES_BILATERAIS: bilateral,
    COLUNA_LOMBAR_BACIA: lombarBacia,
    REGIOES_DIFERENTES: regioes >= 2,
  };
  return regrasDoConvenio(b, slug)
    .filter((r) => r.alvos.some((a) => ALVOS_COMBINACAO.has(a) && dispara[a]))
    .map((r) => paraItem(b, r));
}

const PROBLEMA: Situacao[] = ['a_confirmar', 'conflito', 'sem_informacao', 'vencida'];

export function consultar(b: BaseDados, q: Consulta): Resultado {
  const convenio = convenioPorSlug(b, q.convenio);
  if (!convenio) throw new Error(`Convênio "${q.convenio}" não existe`);
  const itens: ExamePedido[] = q.exames.map((x) => ({ exame: b.exames.find((e) => e.id === x.exameId)!, quantidade: x.quantidade ?? 1 }))
    .filter((x) => x.exame);
  const geral = regrasGerais(b, q.convenio);
  const exames: ResultadoExame[] = itens.map((x) => ({
    autorizacao: autorizacaoDoExame(b, q.convenio, x.exame), agenda: agendaDoExame(b, x.exame), quantidade: x.quantidade,
    grupos: gruposDoExame(b, x.exame),
  }));
  const combinacao = regrasDeCombinacao(b, q.convenio, itens);
  const janela = calcularJanela(b, q.convenio, itens, q.dataPedido, q.hoje, q.dataAutorizacao);

  const motivos: string[] = []; let situacao: Situacao_Geral = 'pode_agendar';
  if (!convenio.tem_regras) {
    situacao = 'atencao';
    motivos.push(`${convenio.nome}: o pedido já vem AUTORIZADO pelo próprio convênio. Antes de agendar, confira na guia autorizada: nome do paciente, exame autorizado e validade da senha.`);
  }
  const rede = situacaoDaRede(b, q.convenio, q.rede);
  if (rede?.situacao === 'nao_atende') { situacao = 'nao_pode'; motivos.push(`Rede ${rede.nome}: a RCC não atende essa rede`); }
  if (janela.pedidoVencido) { situacao = 'nao_pode'; motivos.push(`Pedido vencido em ${br(janela.pedidoValeAte)} — pedir um pedido novo ao paciente`); }
  for (const e of exames) if (coberturaImpede(e.autorizacao.cobertura))
    { situacao = 'nao_pode'; motivos.push(`${e.autorizacao.exame.nome}: ${e.autorizacao.coberturaTexto}`); }
  if (situacao !== 'nao_pode') {
    if (janela.soDepoisDeAutorizar.length) { situacao = 'atencao'; motivos.push('Só agendar depois que o convênio autorizar'); }
    for (const e of exames) if (['conflito', 'consultar_contrato', 'consultar_faturamento', 'so_contrato_amb'].includes(e.autorizacao.cobertura))
      { situacao = 'atencao'; motivos.push(`${e.autorizacao.exame.nome}: ${e.autorizacao.coberturaTexto}`); }
    if (combinacao.some((r) => r.molde === 'M19')) { situacao = 'atencao'; motivos.push('Esta combinação de exames precisa de relatório médico'); }
    if (janela.avisos.length) { situacao = 'atencao'; motivos.push(...janela.avisos); }
  }
  const todas = [...geral.itens, ...exames.flatMap((e) => e.autorizacao.regras), ...combinacao];
  const pendentes = todas.filter((r) => PROBLEMA.includes(r.situacao)).filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i);
  // regras ainda não confirmadas NÃO mudam a situação: a confirmação acontece antes de o sistema ir para produção
  return { convenio, geral, exames, combinacao, janela, situacao, motivos, pendentes, rede };
}

/** Texto curto para WhatsApp / área de transferência. */
export function resumoTexto(r: Resultado): string {
  const l: string[] = [`*Analiza RCC — ${r.convenio.nome}*`];
  l.push(r.situacao === 'nao_pode' ? '❌ NÃO PODE AGENDAR' : r.situacao === 'atencao' ? '⚠️ ATENÇÃO' : '✅ PODE AGENDAR');
  r.motivos.forEach((m) => l.push('- ' + m));
  if (r.rede) l.push(r.rede.situacao === 'escolher' ? '⚠️ Conferir a rede do paciente (está na carteirinha)' : `Rede: ${r.rede.nome} — ${r.rede.situacao === 'atende' ? 'atendemos' : 'NÃO atendemos'}`);
  l.push('', `Agendar a partir de: ${r.janela.agendarAPartirDe ? br(r.janela.agendarAPartirDe) : r.janela.motivoAPartir}`);
  if (r.janela.pedidoValeAte) l.push(`Pedido vale até: ${br(r.janela.pedidoValeAte)}`);
  for (const e of r.exames) {
    l.push('', `*${e.autorizacao.exame.nome}*`);
    if (e.autorizacao.codigos.length) l.push('Código: ' + e.autorizacao.codigos.map((c) => c.codigo).join(' / '));
    e.autorizacao.regras.forEach((x) => l.push('- ' + x.texto));
    e.agenda.preparos.forEach((p) => l.push('Preparo: ' + p.titulo));
  }
  return l.join('\n');
}
