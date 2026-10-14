// Varredura: todo convênio × todo exame do catálogo roda sem erro e sempre devolve uma situação.
import { expect, it } from 'vitest';
import { baseJson as b } from '../src/repositorio/repo-json';
import { consultar } from '../src/regras/resultado';

it('todos os convênios × todos os exames', () => {
  let n = 0; const semMaquina: string[] = []; const semPreparo: string[] = [];
  for (const c of b.convenios) for (const e of b.exames) {
    const r = consultar(b, { convenio: c.slug, exames: [{ exameId: e.id }], dataPedido: '2026-10-10', hoje: '2026-10-14' });
    expect(['pode_agendar', 'atencao', 'nao_pode']).toContain(r.situacao);
    n++;
    if (c.slug === 'bradesco' && ['RESSONANCIA', 'TOMOGRAFIA', 'ANGIOTOMOGRAFIA', 'ANGIORRESSONANCIA'].includes(e.modalidade)) {
      if (!r.exames[0].agenda.maquinas.length) semMaquina.push(e.nome);
      if (!r.exames[0].agenda.preparos.length) semPreparo.push(e.nome);
    }
  }
  console.log(`consultas: ${n}\nRM/TC sem máquina sugerida (${semMaquina.length}):\n  ${semMaquina.join('\n  ')}\nsem preparo: ${semPreparo.length}`);
  expect(n).toBe(b.convenios.length * b.exames.length);
});
