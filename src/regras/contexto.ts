// Funções de apoio usadas por todo o motor: achar convênio, exame, grupo do exame,
// e saber se uma regra (pelo seu "alvo") vale para um exame.
import type { BaseDados } from '../repositorio/repositorio';
import type { Convenio, Exame, RegraPadronizada } from '../tipos/modelos';

/** Maiúsculas e sem acento, para comparar textos escritos de jeitos diferentes. */
export const norm = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/** Modalidade "de agenda": RM, TC, US, RX, MAMO, DENSITO ou OUTROS. */
export function modalidadeBase(e: Exame): string {
  switch (e.modalidade) {
    case 'RESSONANCIA': case 'ANGIORRESSONANCIA': return 'RM';
    case 'TOMOGRAFIA': case 'ANGIOTOMOGRAFIA': return 'TC';
    case 'ULTRASSOM': case 'DOPPLER': return 'US';
    case 'RX': return 'RX';
    case 'MAMOGRAFIA': return 'MAMO';
    case 'DENSITOMETRIA': return 'DENSITO';
    default: return 'OUTROS';
  }
}

export const ehAngio = (e: Exame) => e.modalidade === 'ANGIOTOMOGRAFIA' || e.modalidade === 'ANGIORRESSONANCIA';

export function convenioPorSlug(b: BaseDados, slug: string): Convenio | undefined {
  return b.convenios.find((c) => c.slug === slug);
}

export function exame(b: BaseDados, id: number): Exame {
  const e = b.exames.find((x) => x.id === id);
  if (!e) throw new Error(`Exame ${id} não existe no catálogo`);
  return e;
}

/** Grupos de prazo do exame: cardiaco | angio | articulacao (pode ser mais de um). */
export function gruposDoExame(b: BaseDados, e: Exame): string[] {
  const ids = b.exameGrupos.filter((g) => g.exame_id === e.id).map((g) => g.grupo_id);
  return b.gruposPrazo.filter((g) => ids.includes(g.id)).map((g) => g.slug);
}

/** Alvos que não são de um exame: valem para o pedido / convênio inteiro. */
export const ALVOS_GERAIS = new Set(['TODOS', 'DEMAIS', 'PEDIDO', 'AUTORIZACAO', 'SOLICITANTE', 'PLANO', 'CANAL', 'CODIGOS',
  'UNIDADE', 'ORCAMENTO', 'SISTEMA', 'MEDICO', 'MAQUINAS_SEM_TEMPO']);

/** Alvos que dependem da COMBINAÇÃO de exames do pedido (avaliados em resultado.ts). */
export const ALVOS_COMBINACAO = new Set(['COLUNA_MAIS_DE_UMA', 'ARTICULACAO_BILATERAL', 'COLUNA_LOMBAR_BACIA', 'EXAMES_BILATERAIS',
  'RM_MAIS_ANGIO', 'REGIOES_DIFERENTES']);

/** Alvos que dependem de uma condição do PACIENTE (perguntadas no passo a passo). */
export const ALVOS_PACIENTE = new Set(['GESTANTE', 'NEUROESTIMULADOR', 'OPERADO_TUMOR', 'TATUAGEM_RECENTE', 'JOELHO_90KG']);

// alvos sem código TUSS no catálogo: reconhecidos pelo nome / modalidade do exame
const PALAVRAS: Record<string, (e: Exame, n: string, g: string[]) => boolean> = {
  G_RM: (e) => modalidadeBase(e) === 'RM',
  G_TC: (e) => modalidadeBase(e) === 'TC',
  G_ANGIO: (_e, _n, g) => g.includes('angio'),
  G_CARDIACO: (_e, _n, g) => g.includes('cardiaco'),
  G_ARTICULACAO: (_e, _n, g) => g.includes('articulacao'),
  TC_SIMPLES: (e) => e.modalidade === 'TOMOGRAFIA',
  PRIMOVIST: (e, n) => modalidadeBase(e) === 'RM' && n.includes('ABDOME'),
  CONTRASTE: (e) => ['RM', 'TC'].includes(modalidadeBase(e)),
  ANGIO_TC_MMSS: (e, n) => e.modalidade === 'ANGIOTOMOGRAFIA' && n.includes('MEMBRO SUPERIOR'),
  ANGIO_RM_MMSS: (e, n) => e.modalidade === 'ANGIORRESSONANCIA' && n.includes('MEMBRO SUPERIOR'),
  ANGIO_TC_MMII: (e, n) => e.modalidade === 'ANGIOTOMOGRAFIA' && n.includes('MEMBRO INFERIOR'),
  ANGIO_RM_MMII: (e, n) => e.modalidade === 'ANGIORRESSONANCIA' && n.includes('MEMBRO INFERIOR'),
  RM_ABDOME_TOTAL: (e, n) => e.modalidade === 'RESSONANCIA' && n.includes('ABDOME TOTAL'),
  RM_TALASSEMIA: (_e, n) => n.includes('TALASSEMIA'),
  RM_CORPO_INTEIRO: (e, n) => modalidadeBase(e) === 'RM' && n.includes('CORPO'),
  TC_CORPO_INTEIRO: (e, n) => modalidadeBase(e) === 'TC' && n.includes('CORPO'),
  RM_PROSTATA: (e, n) => modalidadeBase(e) === 'RM' && n.includes('PROSTATA'),
  RM_PELVE_ENDOMETRIOSE: (_e, n) => n.includes('ENDOMETRIOSE'),
  RM_ENTERO: (_e, n) => n.includes('ENTERO'),
  TC_APARELHO_URINARIO: (e, n) => modalidadeBase(e) === 'TC' && n.includes('URINARIO'),
  ARCOS_COSTAIS: (_e, n) => n.includes('ARCOS COSTAIS') || n.includes('COSTELAS'),
  TOMOSSINTESE: (_e, n) => n.includes('TOMOSSINTESE'),
  PAAF_BIOPSIA: (_e, n) => n.includes('PAAF') || n.includes('BIOPSIA') || n.includes('PUNCAO'),
  DOPPLER_COLORIDO: (e) => e.modalidade === 'DOPPLER',
  RX_DACRIOCISTOGRAFIA: (_e, n) => n.includes('DACRIOCISTOGRAFIA'),
  COXOFEMORAL: (_e, n) => n.includes('COXOFEMORAL') || n.includes('COXO-FEMORAL'),
  CORPO_TOTAL_RM4: (e, n) => modalidadeBase(e) === 'RM' && n.includes('CORPO'),
  RM_COCCIX_PUBIS: (e, n) => modalidadeBase(e) === 'RM' && (n.includes('COCCIX') || n.includes('PUBIS')),
  ABDOME_SUP_COM_PROSTATA: () => false,
  ANGIO_ARTERIAL_RM3: () => false,
};

/** A regra com esse alvo vale para esse exame? */
export function alvoCasa(b: BaseDados, alvoId: string, e: Exame): boolean {
  const alvo = b.regras.alvos.find((a) => a.id === alvoId);
  if (alvo && alvo.exame_ids.length && alvo.exame_ids.includes(e.id)) return true;
  const f = PALAVRAS[alvoId];
  return f ? f(e, norm(e.nome), gruposDoExame(b, e)) : false;
}

/** Regras padronizadas de um convênio (sem as substituídas). */
export function regrasDoConvenio(b: BaseDados, slug: string): RegraPadronizada[] {
  return b.regras.regras.filter((r) => r.convenio === slug && r.situacao !== 'substituida');
}

/** Regras gerais da RCC (operação: máquinas, preparo, peso, médico…). */
export function regrasRCC(b: BaseDados): RegraPadronizada[] {
  return b.regras.regras.filter((r) => r.convenio === null && r.situacao !== 'substituida');
}

export function nomeConvenio(b: BaseDados, slug: string) {
  return convenioPorSlug(b, slug)?.nome ?? slug;
}
