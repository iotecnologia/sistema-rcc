// Rede do paciente: hoje só o Bradesco pede a rede (está na carteirinha). A lista vem de planos.json.
import type { BaseDados } from '../repositorio/repositorio';
import type { Plano } from '../tipos/modelos';
import { norm } from './contexto';

export const CONVENIOS_COM_REDE = new Set(['bradesco']);
export type SituacaoRede = 'atende' | 'nao_atende' | 'escolher';
export interface RedeInfo { nome: string | null; situacao: SituacaoRede }

export const pedeRede = (slug: string) => CONVENIOS_COM_REDE.has(slug);

export function redesDoConvenio(b: BaseDados, slug: string): Plano[] {
  const c = b.convenios.find((x) => x.slug === slug);
  if (!c || !pedeRede(slug)) return [];
  return b.planos.filter((p) => p.convenio_id === c.id).sort((x, y) => x.nome.localeCompare(y.nome));
}

/** Rede escolhida → atende ou não. Sem rede escolhida: só um alerta (não trava a consulta). */
export function situacaoDaRede(b: BaseDados, slug: string, rede?: string | null): RedeInfo | null {
  if (!pedeRede(slug)) return null;
  const p = rede ? redesDoConvenio(b, slug).find((x) => norm(x.nome) === norm(rede)) : undefined;
  if (!p) return { nome: null, situacao: 'escolher' };
  return { nome: p.nome, situacao: p.atende === false ? 'nao_atende' : 'atende' };
}
