// Ajustes de 27 a 29/10/2026: triagem da Av. Norte Sul, Saúde Caixa (Funcef), Amafresp, convênios pelo TUSS padrão, tabela Particular.
import { describe, expect, test } from 'vitest';
import { baseJson as b } from '../src/repositorio/repo-json';
import { consultar } from '../src/regras/resultado';
import { buscarExames } from '../src/regras/busca';

const HOJE = '2026-10-29';
const q = (convenio: string, ids: number[]) => consultar(b, { convenio, exames: ids.map((exameId) => ({ exameId })), dataPedido: HOJE, hoje: HOJE });
const textos = (r: ReturnType<typeof q>) => [...r.combinacao, ...r.exames.flatMap((e) => [...e.autorizacao.regras, ...e.agenda.avisos])].map((x) => x.texto).join(' | ');
const codigos = (convId: number, exameId: number) => b.codigos.filter((c) => c.convenio_id === convId && c.exame_id === exameId).map((c) => c.codigo);

describe('triagem da Av. Norte Sul', () => {
  test('US + RM no mesmo pedido mostra a ordem obrigatória com 1 hora de intervalo', () => {
    expect(textos(q('bradesco', [82, 115]))).toMatch(/1º Ultrassom/);
    expect(textos(q('bradesco', [115]))).not.toMatch(/1º Ultrassom/);
  });
  test('RM cardíaca (todas as variantes): Dr. Juliano e código 4X no X-Clinic', () => {
    for (const id of [125, 126, 127]) expect(textos(q('bradesco', [id]))).toMatch(/código 4X/);
  });
  test('triagem: RM pergunta metal e contraste; TC pergunta frutos do mar ou iodo', () => {
    expect(textos(q('bradesco', [115]))).toMatch(/metal no corpo/);
    expect(textos(q('bradesco', [105]))).toMatch(/frutos do mar ou iodo/);
  });
  test('densitometria de corpo inteiro até 100 kg; mamografia sem talco', () => {
    expect(textos(q('bradesco', [147]))).toMatch(/100 kg/);
    expect(textos(q('bradesco', [99]))).toMatch(/talco/);
  });
  test('escore de cálcio só na TC 2 e todas as angio-TC só na TC 2', () => {
    const tc1 = b.equipamentoExames.filter((x) => x.equipamento_id === 6).map((x) => x.exame_nome.toLowerCase());
    expect(tc1.some((n) => n.includes('escore') || n.includes('angio') || n.includes('coron'))).toBe(false);
  });
});

describe('Saúde Caixa (Funcef)', () => {
  test('RM coração com viabilidade e com estresse: pacotes', () => {
    expect(codigos(4, 127)).toContain('98322800');
    expect(codigos(4, 126)).toContain('98322702');
  });
  test('angio-TC venosa de pelve: TUSS (sem pacote no PDF); angio-RM de membro superior criada', () => {
    expect(codigos(4, 159)).toEqual(['41001460']);
    const ms = b.exames.find((e) => e.tuss === '41101570')!;
    expect(codigos(4, ms.id)).toEqual(['41101570']);
  });
  test('angio-TC de membros inferiores: tem cobertura e vai para o setor responsável', () => {
    const r = q('saudecaixa', [374]);
    expect(r.exames[0].autorizacao.cobertura).toBe('coberto');
    expect(textos(r)).toMatch(/setor responsável/);
  });
});

describe('convênios', () => {
  test('Amafresp: autorização sem vencimento (sem o aviso "sem informação")', () => {
    expect(q('aafresp', [115]).janela.semInformacao.join(' ')).not.toMatch(/autorização/i);
  });
  test('convênios pelo TUSS padrão recebem o TUSS do exame; Care Plus mantém a RM coração', () => {
    expect(codigos(5, 115)).toEqual(['41101014']);
    expect(codigos(28, 115)).toEqual(['41101014']);
    expect(codigos(6, 125).sort()).toEqual(['41101138', '41101154']);
  });
  test('exames que a RCC não faz não aparecem na busca', () => {
    for (const id of [224, 274, 371]) expect(buscarExames(b, b.exames.find((e) => e.id === id)!.nome, 400).some((x) => x.exame.id === id)).toBe(false);
  });
  test('tabela Particular: colangio RM R$ 700 e hidro-RM + abdome total', () => {
    const p = b.precos.filter((x) => x.tabela_id === 1);
    expect(p.find((x) => x.procedimento === 'COLANGIO RM')?.valor).toBe(700);
    expect(p.some((x) => x.procedimento === 'HIDRO-RM (COLANGIORESSONANCIA) + RM ABDOME TOTAL')).toBe(true);
    expect(p.some((x) => x.procedimento === 'RM - URO RM (HIDRO-RM)')).toBe(false);
  });
});
