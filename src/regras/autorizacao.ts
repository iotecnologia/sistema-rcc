// "Como autorizar" um exame em um convênio: códigos, cobertura, composição, substituição,
// texto exigido no pedido, quantidade, cobrança. Tudo vem das regras padronizadas + tabela de códigos.
import type { BaseDados } from '../repositorio/repositorio';
import type { ConvenioCodigo, Exame, RegraPadronizada, Situacao } from '../tipos/modelos';
import { ALVOS_COMBINACAO, ALVOS_GERAIS, ALVOS_PACIENTE, alvoCasa, convenioPorSlug, norm, regrasDoConvenio } from './contexto';
import { frase } from './frase';

export interface ItemRegra {
  id: string; molde: string; moldeNome: string; texto: string; situacao: Situacao;
  original: string; fontes: string[];
}

export const paraItem = (b: BaseDados, r: RegraPadronizada): ItemRegra => ({
  id: r.id, molde: r.molde, moldeNome: r.molde_nome, texto: frase(b, r), situacao: r.situacao,
  original: r.texto_original, fontes: r.fontes,
});

export type Cobertura = 'coberto' | 'sem_cobertura' | 'nao_autoriza' | 'nao_aceito_no_contrato' | 'conflito'
  | 'consultar_contrato' | 'consultar_faturamento' | 'so_contrato_amb' | 'sem_informacao';

const GRAVIDADE: Cobertura[] = ['nao_autoriza', 'sem_cobertura', 'nao_aceito_no_contrato', 'conflito', 'consultar_faturamento',
  'consultar_contrato', 'so_contrato_amb', 'coberto', 'sem_informacao'];
export const coberturaImpede = (c: Cobertura) => ['nao_autoriza', 'sem_cobertura', 'nao_aceito_no_contrato'].includes(c);

export interface CodigoAutorizar {
  codigo: string; tipo: string; nome: string; status: string; observacao: string | null;
  composicao: boolean; alternativo: boolean; grupo: string | null; quantidade?: number; vinculo: string;
}

export interface AutorizacaoExame {
  exame: Exame;
  codigos: CodigoAutorizar[];          // tabela de códigos do convênio ligada a este exame
  regras: ItemRegra[];                 // regras do convênio que valem para este exame
  cobertura: Cobertura;
  coberturaTexto: string;
}

const MOLDES_EXAME = new Set(['M05', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M04', 'M10']);

/** Regras do convênio que valem para este exame (não inclui as gerais, de combinação e de paciente). */
export function regrasDoExame(b: BaseDados, slug: string, e: Exame): RegraPadronizada[] {
  return regrasDoConvenio(b, slug).filter((r) =>
    MOLDES_EXAME.has(r.molde) &&
    r.alvos.length > 0 &&
    r.alvos.some((a) => !ALVOS_GERAIS.has(a) && !ALVOS_COMBINACAO.has(a) && !ALVOS_PACIENTE.has(a) && alvoCasa(b, a, e)));
}

function coberturaDe(regras: RegraPadronizada[], e: Exame): Cobertura {
  const achadas: Cobertura[] = [];
  for (const r of regras.filter((x) => x.molde === 'M13')) {
    let c = r.campos.cobertura as Cobertura;
    // variante "só arterial": a versão venosa do exame fica sem cobertura
    if (r.campos.variante === 'só arterial' && norm(e.nome).includes('VENOSA')) c = 'sem_cobertura';
    if (c) achadas.push(c);
  }
  if (!achadas.length) return 'sem_informacao';
  return achadas.sort((a, b) => GRAVIDADE.indexOf(a) - GRAVIDADE.indexOf(b))[0];
}

const TEXTO_COB: Record<Cobertura, string> = {
  coberto: 'Tem cobertura', sem_cobertura: 'Sem cobertura', nao_autoriza: 'O convênio não autoriza',
  nao_aceito_no_contrato: 'Não aceito no contrato', conflito: 'Cadastro em conflito — confirmar',
  consultar_contrato: 'Consultar o contrato', consultar_faturamento: 'Consultar o faturamento',
  so_contrato_amb: 'Só se estiver no contrato (AMB)', sem_informacao: 'Sem restrição cadastrada',
};

export function autorizacaoDoExame(b: BaseDados, slug: string, e: Exame): AutorizacaoExame {
  const conv = convenioPorSlug(b, slug);
  const regras = regrasDoExame(b, slug, e);
  const codigos: CodigoAutorizar[] = conv
    ? b.codigos
        .filter((c: ConvenioCodigo) => c.convenio_id === conv.id && c.exame_id === e.id)
        .map((c) => ({ codigo: c.codigo, tipo: c.tipo, nome: c.nome_no_convenio, status: c.status, observacao: c.observacao,
          composicao: c.composicao, alternativo: c.alternativo, grupo: c.grupo, quantidade: c.quantidade, vinculo: c.vinculo }))
    : [];
  // regra geral "só autoriza o que está no contrato" (Hapvida) entra como cobertura quando não há regra específica
  let cobertura = coberturaDe(regras, e);
  if (cobertura === 'sem_informacao') {
    const geral = regrasDoConvenio(b, slug).find((r) => r.molde === 'M13' && r.alvos.includes('TODOS'));
    if (geral) cobertura = (codigos.length ? 'coberto' : 'so_contrato_amb');
  }
  return { exame: e, codigos, regras: regras.map((r) => paraItem(b, r)), cobertura, coberturaTexto: TEXTO_COB[cobertura] };
}
