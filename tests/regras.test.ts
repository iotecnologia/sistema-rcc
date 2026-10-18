// Casos reais da RCC. Cada teste diz qual regra da base está sendo provada (id entre colchetes).
import { describe, expect, it } from 'vitest';
import { baseJson as b } from '../src/repositorio/repo-json';
import { consultar } from '../src/regras/resultado';
import { proximoDiaAtendimento, somarDias, somarDiasUteis } from '../src/regras/calendario';

const porTuss = (tuss: string) => {
  const e = b.exames.find((x) => x.tuss === tuss);
  if (!e) throw new Error('TUSS não está no catálogo: ' + tuss);
  return e.id;
};
const CORONARIA = porTuss('41001230');
const RM_CORACAO = porTuss('41101138');
const RM_ARTICULAR = porTuss('41101316');
const RM_CRANIO = porTuss('41101014');
const RM_COLUNA = porTuss('41101227');
const RM_BACIA = porTuss('41101278');
const ESCORE = porTuss('41001087');
const MAMOGRAFIA = porTuss('40808041');
const ANGIO_TC_MMII = porTuss('41001478');
const HOJE = '2026-10-14'; // quarta-feira

const textos = (r: ReturnType<typeof consultar>) => [
  ...r.geral.itens.map((x) => x.texto), ...r.exames.flatMap((e) => e.autorizacao.regras.map((x) => x.texto)), ...r.combinacao.map((x) => x.texto),
].join(' | ');

describe('calendário (D11)', () => {
  it('dias úteis pulam fim de semana e feriado nacional', () => {
    expect(somarDiasUteis(b.feriados, '2026-10-14', 4)).toBe('2026-10-20');     // qui, sex, seg, ter
    expect(somarDiasUteis(b.feriados, '2026-11-19', 1)).toBe('2026-11-23');     // 20/11 Consciência Negra
  });
  it('domingo a RCC só atende RM', () => {
    expect(proximoDiaAtendimento('2026-10-18', ['TC'])).toBe('2026-10-19');
    expect(proximoDiaAtendimento('2026-10-18', ['RM'])).toBe('2026-10-18');
  });
  it('validade conta dias corridos a partir do dia seguinte', () => {
    expect(somarDias('2026-10-01', 28)).toBe('2026-10-29');
  });
});

describe('Bradesco', () => {
  const r = consultar(b, { convenio: 'bradesco', exames: [{ exameId: CORONARIA }], dataPedido: '2026-10-01', hoje: HOJE });
  it('coronária é autorizada como aorta torácica + tórax [BRA-01]', () => {
    expect(textos(r)).toContain('41001176 + 41001079');
  });
  it('pedido precisa trazer o texto exigido [BRA-02]', () => {
    expect(textos(r).normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toMatch(/ANGIOTOMOGRAFIA DE AORTA TORACICA/i);
  });
  it('cardíaco: 4 dias úteis [BRA-16]', () => {
    expect(r.janela.agendarAPartirDe).toBe('2026-10-20');
  });
  it('pedido de 28 dias [BRA-06] vale até 29/10', () => {
    expect(r.janela.pedidoValeAte).toBe('2026-10-29');
    expect(r.janela.pedidoVencido).toBe(false);
  });
  it('pedido vencido trava o agendamento', () => {
    const v = consultar(b, { convenio: 'bradesco', exames: [{ exameId: CORONARIA }], dataPedido: '2026-09-01', hoje: HOJE });
    expect(v.situacao).toBe('nao_pode');
  });
  it('escore segue o padrão PAD-01 (descrever TC de tórax)', () => {
    const e = consultar(b, { convenio: 'bradesco', exames: [{ exameId: ESCORE }], dataPedido: HOJE, hoje: HOJE });
    expect(textos(e)).toContain('escore de cálcio');
  });
  it('coluna lombar + bacia pede relatório [BRA-21]', () => {
    const c = consultar(b, { convenio: 'bradesco', exames: [{ exameId: RM_COLUNA }, { exameId: RM_BACIA }], dataPedido: HOJE, hoje: HOJE });
    expect(c.combinacao.map((x) => x.id)).toContain('BRA-21');
  });
  it('exige CID e carimbo no pedido [BRA-07, BRA-08]', () => {
    const t = r.geral.checklist.map((x) => x.texto).join(' ');
    expect(t).toContain('CID');
    expect(t).toContain('carimbado');
  });
});

describe('Amil', () => {
  it('3 articulações: 4 dias úteis [AMI-13]', () => {
    const r = consultar(b, { convenio: 'amil', exames: [{ exameId: RM_ARTICULAR, quantidade: 3 }], dataPedido: HOJE, hoje: HOJE });
    expect(r.janela.agendarAPartirDe).toBe('2026-10-20');
  });
  it('2 articulações: prazo padrão de 3 dias úteis [AMI-12]', () => {
    const r = consultar(b, { convenio: 'amil', exames: [{ exameId: RM_ARTICULAR, quantidade: 2 }], dataPedido: HOJE, hoje: HOJE });
    expect(r.janela.agendarAPartirDe).toBe('2026-10-19');
  });
  it('angio-TC MMII: consultar faturamento [AMI-16]', () => {
    const r = consultar(b, { convenio: 'amil', exames: [{ exameId: ANGIO_TC_MMII }], dataPedido: HOJE, hoje: HOJE });
    expect(r.exames[0].autorizacao.cobertura).toBe('consultar_faturamento');
  });
});

describe('SulAmérica', () => {
  const r = consultar(b, { convenio: 'sulamerica', exames: [{ exameId: CORONARIA }], dataPedido: HOJE, hoje: HOJE });
  it('coronária: só agenda depois de autorizado [SUL-07]', () => {
    expect(r.janela.soDepoisDeAutorizar.length).toBe(1);
    expect(r.janela.agendarAPartirDe).toBeNull();
  });
  it('coronária: pacote 64625885 (resposta da equipe) [SUL-22]', () => {
    expect(textos(r)).toContain('64625885');
  });
  it('RM coração: só cardíaca, sem angio de aorta [SUL-02]', () => {
    const c = consultar(b, { convenio: 'sulamerica', exames: [{ exameId: RM_CORACAO }], dataPedido: HOJE, hoje: HOJE });
    expect(textos(c)).toMatch(/NÃO incluir angio-RM/i);
  });
});

describe('Outros convênios', () => {
  it('Cesp: RM coração = 41101138 + 98411013 [CES-02]', () => {
    const r = consultar(b, { convenio: 'cespvivest', exames: [{ exameId: RM_CORACAO }], dataPedido: HOJE, hoje: HOJE });
    expect(textos(r)).toContain('41101138 + 98411013');
  });
  it('Proasa: validade da autorização sem informação (não chuta) [PRO-10]', () => {
    const r = consultar(b, { convenio: 'proasa', exames: [{ exameId: RM_CRANIO }], dataPedido: HOJE, hoje: HOJE });
    expect(r.janela.autorizacaoValeDias).toBeNull();
    expect(r.janela.semInformacao.join(' ')).toContain('autorização');
  });
  it('Hapvida: RM cardíaca não autoriza [HAP-01]', () => {
    const r = consultar(b, { convenio: 'hapvida', exames: [{ exameId: RM_CORACAO }], dataPedido: HOJE, hoje: HOJE });
    expect(r.situacao).toBe('nao_pode');
  });
  it('Mediservice: mamografia de 40 a 69 anos (resposta da equipe) [MED-14]', () => {
    const r = consultar(b, { convenio: 'mediservice', exames: [{ exameId: MAMOGRAFIA }], dataPedido: HOJE, hoje: HOJE });
    expect(textos(r)).toContain('40 a 69');
  });
  it('Economus: pedido original e guia SP/SADT [ECO-05, ECO-01]', () => {
    const r = consultar(b, { convenio: 'economus', exames: [{ exameId: RM_CRANIO }], dataPedido: HOJE, hoje: HOJE });
    const t = r.geral.checklist.map((x) => x.texto).join(' ');
    expect(t).toContain('ORIGINAL');
    expect(r.geral.guiaPdf).toContain('economus');
  });
  it('convênio sem regras: pedido vem autorizado pelo convênio [RCC-01]', () => {
    const r = consultar(b, { convenio: 'unimed', exames: [{ exameId: RM_CRANIO }], dataPedido: HOJE, hoje: HOJE });
    expect(r.motivos.join(' ')).toContain('já vem AUTORIZADO pelo próprio');
  });
});

describe('Agenda (máquina, preparo)', () => {
  it('RM crânio: RM 1 e RM 3, preparo de RM', () => {
    const r = consultar(b, { convenio: 'bradesco', exames: [{ exameId: RM_CRANIO }], dataPedido: HOJE, hoje: HOJE });
    const maq = r.exames[0].agenda.maquinas.map((m) => m.maquina);
    expect(maq).toContain('RM 1');
    expect(maq).toContain('RM 3');
    expect(r.exames[0].agenda.preparos[0].titulo).toMatch(/Ressonância \(geral\)/);
  });
  it('coronária: TC 2 e preparo próprio', () => {
    const r = consultar(b, { convenio: 'bradesco', exames: [{ exameId: CORONARIA }], dataPedido: HOJE, hoje: HOJE });
    expect(r.exames[0].agenda.maquinas.map((m) => m.maquina)).toContain('TC 2');
    expect(r.exames[0].agenda.preparos[0].titulo).toMatch(/Coronárias/);
  });
  it('RM: peso máximo 180 kg aparece como aviso [RCC-09]', () => {
    const r = consultar(b, { convenio: 'bradesco', exames: [{ exameId: RM_CRANIO }], dataPedido: HOJE, hoje: HOJE });
    expect(r.exames[0].agenda.avisos.map((a) => a.id)).toContain('RCC-09');
  });
});

describe('Rede do paciente (só Bradesco)', () => {
  const q = (rede?: string, convenio = 'bradesco') => consultar(b, { convenio, exames: [{ exameId: CORONARIA }], dataPedido: HOJE, hoje: HOJE, rede });
  it('sem rede escolhida: só alerta, não trava', () => {
    const r = q();
    expect(r.rede?.situacao).toBe('escolher');
    expect(r.situacao).not.toBe('nao_pode');
  });
  it('rede da lista atende', () => { expect(q('ABB NACIONAL').rede).toEqual({ nome: 'ABB NACIONAL', situacao: 'atende' }); });
  it('rede que a RCC não atende → não pode agendar', () => {
    const r = q('Personal 25');
    expect(r.rede?.situacao).toBe('nao_atende');
    expect(r.situacao).toBe('nao_pode');
  });
  it('Sistel sozinho não existe; só REDE SISTEL (atende)', () => {
    expect(q('Sistel').rede?.situacao).toBe('escolher');
    expect(q('REDE SISTEL').rede?.situacao).toBe('atende');
  });
  it('outros convênios não pedem rede', () => { expect(q('ABB NACIONAL', 'amil').rede).toBeNull(); });
});
