import { describe, expect, test } from 'vitest';
import { baseJson as b } from '../src/repositorio/repo-json';
import { buscarExames, buscarPrecos, precoDoExame } from '../src/regras/busca';
import { norm } from '../src/regras/contexto';

describe('busca pelo nome falado', () => {
  test('"resso joelho" acha a RM articular com rótulo amigável', () => {
    const r = buscarExames(b, 'resso joelho');
    expect(r[0].exame.tuss).toBe('41101316');
    expect(r[0].rotulo).toBe('Ressonância de joelho');
  });
  test('"tomo de torax" acha TC - TORAX', () => {
    expect(buscarExames(b, 'tomo de torax').map((x) => norm(x.exame.nome))).toContain('TC - TORAX');
  });
  test('"ultrassom barriga" acha US de abdome', () => {
    expect(buscarExames(b, 'ultrassom barriga').some((x) => /US - ABDOME TOTAL/.test(norm(x.exame.nome)))).toBe(true);
  });
  test('preço: busca "ultrassom abdome total" acha ECO ABDOME TOTAL', () => {
    expect(buscarPrecos(b.precos.filter((p) => p.tabela_id === 1), 'ultrassom abdome total').map((p) => p.procedimento)).toContain('ECO ABDOME TOTAL');
  });
  test('preço da RM de joelho particular = 700', () => {
    const e = b.exames.find((x) => x.tuss === '41101316')!;
    expect(precoDoExame(b, e, 1, 'Ressonância de joelho')?.valor).toBe(700);
  });
  test('preço vinculado pela base (TC tórax)', () => {
    const e = b.exames.find((x) => norm(x.nome) === 'TC - TORAX')!;
    expect(precoDoExame(b, e, 1)?.procedimento).toBe('TC TORAX');
  });
  test('"rm pé" traz a RM do pé primeiro (palavra inteira vem antes de pelve/perna)', () => {
    expect(buscarExames(b, 'rm pé', 12)[0].exame.id).toBe(140);
    expect(buscarExames(b, 'pé', 30).some((x) => x.exame.id === 140)).toBe(true);
  });
  test('"abdo" lista as angio-TC de abdome dentro do limite da Consultar', () => {
    const ids = buscarExames(b, 'abdo', 30).map((x) => x.exame.id);
    expect(ids).toContain(156);
  });
});
