// Busca pelo nome que o paciente fala: "resso joelho", "ultrassom de barriga", "tomo de tórax".
// Cada palavra vira uma lista de formas aceitas; o exame entra se TODAS as palavras aparecem no nome (ou nos apelidos dele).
import type { BaseDados } from '../repositorio/repositorio';
import type { Exame, Preco } from '../tipos/modelos';
import { norm } from './contexto';

const IGNORAR = new Set(['DE', 'DO', 'DA', 'DOS', 'DAS', 'E', 'COM', 'O', 'A', 'QUANTO', 'CUSTA', 'EXAME', 'FAZER', 'UM', 'UMA']);
const FORMAS: [RegExp, string[]][] = [
  [/^(RESSO\w*|RNM|RM|RESONANCIA)$/, ['RM', 'RESSONANCIA']],
  [/^(TOMO\w*|TC)$/, ['TC', 'TOMOGRAFIA', 'ANGIOTOMO']],
  [/^(ULTRA\w*|USG|US|ECO\w*)$/, ['US', 'ULTRASSOM', 'ECO']],
  [/^(RAIO\w*|RX|RAIOX)$/, ['RX', 'RAIO']],
  [/^X$/, ['']],
  [/^MAMO\w*$/, ['MAMOGRAFIA', 'MAMO']],
  [/^DENSITO\w*$/, ['DENSITOMETRIA', 'DENSITO']],
  [/^(BARRIGA|ABDOMEN|ABDOME|ABDOMINAL)$/, ['ABDOME', 'ABDOMEN', 'ABDOMINAL']],
  [/^(CABECA|CRANIO|CEREBRO|ENCEFALO)$/, ['CRANIO', 'ENCEFALO']],
  [/^(PULMAO|PULMOES|TORAX|PEITO)$/, ['TORAX']],
  [/^(CORACAO|CARDIACA|CARDIACO)$/, ['CORACAO', 'CARDIACA', 'CORONARIA']],
];
const JUNTAS = ['JOELHO', 'OMBRO', 'TORNOZELO', 'PUNHO', 'COTOVELO', 'QUADRIL'];

/** Formas aceitas para cada palavra digitada. */
export function palavras(q: string): string[][] {
  return norm(q).replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter((p) => p && !IGNORAR.has(p))
    .map((p) => FORMAS.find(([r]) => r.test(p))?.[1] ?? [p]).filter((f) => f[0] !== '');
}

/** Apelidos de um exame (o que o paciente fala e o nome oficial não tem). */
const apelidos = (e: Exame) => (/^RM - ARTICULAR \(POR/.test(norm(e.nome)) ? JUNTAS.join(' ') : '');

export interface Achado { exame: Exame; rotulo: string }

/** Rótulo amigável: "RM - ARTICULAR…" buscado como "resso joelho" vira "Ressonância de joelho". */
function rotulo(e: Exame, q: string): string {
  const junta = JUNTAS.find((j) => norm(q).includes(j));
  if (junta && apelidos(e)) return `Ressonância de ${junta.toLowerCase()}`;
  return e.nome;
}

export function buscarExames(b: BaseDados, q: string, limite = 10): Achado[] {
  const ps = palavras(q);
  if (!ps.length || norm(q).trim().length < 2) return [];
  const casa = (texto: string) => { const h = norm(texto); return ps.every((formas) => formas.some((f) => h.includes(f))); };
  return b.exames.filter((e) => casa(`${e.nome} ${e.tuss ?? ''} ${apelidos(e)}`)).slice(0, limite).map((e) => ({ exame: e, rotulo: rotulo(e, q) }));
}

export function buscarPrecos(precos: Preco[], q: string, limite = 12): Preco[] {
  const ps = palavras(q);
  if (!ps.length) return [];
  return precos.filter((p) => { const h = norm(`${p.procedimento} ${p.subgrupo} ${(p.nomes_alternativos ?? []).join(' ')}`); return ps.every((f) => f.some((x) => h.includes(x))); }).slice(0, limite);
}

/** Preço do exame na tabela: primeiro pelo vínculo da base; senão só quando o nome bate com segurança. */
export function precoDoExame(b: BaseDados, e: Exame, tabelaId: number, rotuloFalado?: string): Preco | null {
  const tab = b.precos.filter((p) => p.tabela_id === tabelaId);
  const direto = tab.find((p) => p.exame_id === e.id);
  if (direto) return direto;
  const alvo = rotuloFalado && rotuloFalado !== e.nome ? rotuloFalado : e.nome;
  const ps = palavras(alvo.replace(/\(.*?\)/g, ' ').replace(/ - /g, ' '));
  if (ps.length < 2) return null;
  const cands = tab.filter((p) => { const h = norm(`${p.procedimento} ${(p.nomes_alternativos ?? []).join(' ')}`); return ps.every((f) => f.some((x) => h.includes(x))); })
    .filter((p) => !/NAO USAR/.test(norm(p.procedimento)));
  return cands.length ? cands.sort((a, c) => a.procedimento.length - c.procedimento.length)[0] : null;
}
