// Dois calendários (decisão D11):
//  - Operadora: conta prazo em dias ÚTEIS = segunda a sexta, sem feriado nacional.
//  - RCC: atende todos os dias (domingo só RM) e trabalha em feriado.
// Datas sempre como texto ISO "AAAA-MM-DD" (sem fuso horário, para não "pular" dia).
import type { Feriado } from '../tipos/modelos';

const DIA = 86_400_000;
const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const paraData = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d)); };
export const paraIso = (d: Date) => d.toISOString().slice(0, 10);
export const somarDias = (iso: string, n: number) => paraIso(new Date(paraData(iso).getTime() + n * DIA));
export const diaSemana = (iso: string) => paraData(iso).getUTCDay();
export const nomeDia = (iso: string) => NOMES_DIA[diaSemana(iso)];
export const br = (iso: string | null | undefined) => (iso ? iso.split('-').reverse().join('/') : '—');
export const hojeIso = () => { const d = new Date(); return paraIso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))); };
export const diferencaDias = (de: string, ate: string) => Math.round((paraData(ate).getTime() - paraData(de).getTime()) / DIA);

export function ehFeriado(feriados: Feriado[], iso: string): Feriado | undefined {
  return feriados.find((f) => f.data === iso);
}

/** Dia útil da operadora: segunda a sexta e não é feriado nacional. */
export function ehDiaUtil(feriados: Feriado[], iso: string): boolean {
  const ds = diaSemana(iso);
  return ds >= 1 && ds <= 5 && !ehFeriado(feriados, iso);
}

/** Soma N dias úteis a partir do dia SEGUINTE (o dia de hoje não conta). */
export function somarDiasUteis(feriados: Feriado[], iso: string, n: number): string {
  let d = iso; let contados = 0;
  while (contados < n) { d = somarDias(d, 1); if (ehDiaUtil(feriados, d)) contados++; }
  return d;
}

/** A RCC atende nesse dia para essa modalidade? Domingo só RM. Feriado atende. */
export function rccAtende(iso: string, modalidade: string): boolean {
  return diaSemana(iso) !== 0 || modalidade === 'RM';
}

export function proximoDiaAtendimento(iso: string, modalidades: string[]): string {
  let d = iso;
  for (let i = 0; i < 7; i++) { if (modalidades.every((m) => rccAtende(d, m))) return d; d = somarDias(d, 1); }
  return d;
}
