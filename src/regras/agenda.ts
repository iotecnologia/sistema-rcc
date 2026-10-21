// Onde e como agendar: máquina (e quantos horários), médico do ultrassom, preparo e avisos da RCC.
// ATENÇÃO: os exames das máquinas e dos médicos ainda estão com nome livre na base (não ligados ao TUSS).
// Aqui a ligação é feita por palavras-chave da anatomia e marcada como "sugestão".
import type { BaseDados } from '../repositorio/repositorio';
import type { Exame, Preparo } from '../tipos/modelos';
import { paraItem, type ItemRegra } from './autorizacao';
import { ALVOS_COMBINACAO, ALVOS_GERAIS, ALVOS_PACIENTE, alvoCasa, ehAngio, modalidadeBase, norm, regrasRCC } from './contexto';

export interface OpcaoMaquina {
  maquina: string; unidade: string; exameNaMaquina: string; horarios: number | null; minutos: number | null;
  contraste: string | null; condicao: string | null; periodo: string | null; pesoMaxKg: number;
}
export interface OpcaoMedico { medico: string; exameDoMedico: string; agendaTodoDia: boolean; restricoes: string[]; agendas: string[] }
export interface AgendaExame {
  maquinas: OpcaoMaquina[]; medicos: OpcaoMedico[]; preparos: Preparo[]; avisos: ItemRegra[]; avisosPaciente: ItemRegra[];
  ligacaoPorNome: boolean;
}

// [palavras no nome do exame do catálogo, palavras no nome do exame da máquina]
const ANATOMIA: [RegExp, RegExp][] = [
  [/ESCORE/, /ESCORE/],
  [/ESPECTROSCOPIA/, /ESPECTROSCOPIA/],
  [/FLUXO LIQUORICO/, /FLUXO/],
  [/CORONARIA/, /CORONARIA/],
  [/BASE DO CRANIO/, /BASE DO CRANIO/],
  [/SELA|HIPOFISE/, /SELA|HIPOFISE/],
  [/OSSOS TEMPORAIS|MASTOIDE|ORELHA|OUVIDO/, /OUVIDO|TEMPORA|MASTOIDE/],
  [/TEMPOROMANDIBULAR|\bATM\b/, /\bATM\b|TEMPORO ?MANDIBULAR/],
  [/ORBITA/, /ORBITA/],
  [/MANDIBULA|MAXILA/, /MANDIBULA|MAXILA/],
  [/FACE|SEIOS/, /FACE/],
  [/PESCOCO/, /PESCOCO/],
  [/CORACAO/, /CORACAO/],
  [/MAMA/, /MAMA/],
  [/ABDOME SUPERIOR/, /ABDOME SUPERIOR/],
  [/ABDOME TOTAL/, /ABDOME TOTAL/],
  [/HIDRO|COLANGIO/, /COLANGIO/],
  [/ENDOMETRIOSE/, /PELVE FEM/],          // RM pelve (endometriose): máquinas de pelve feminina
  [/PROSTATA/, /PROSTATA/],
  [/PELVE/, /PELVE/],
  [/BOLSA ESCROTAL/, /ESCROTAL/],
  [/PENIS/, /PENIS/],
  [/COLUNA/, /COLUNA/],
  [/PLEXO/, /PLEXO/],
  [/BACIA|SACROILIACA/, /BACIA|SACROILIACA/],
  [/TORAX/, /TORAX/],
  [/SEGMENTO APENDICULAR/, /SEGMENTO APENDICULAR/],
  [/MEMBRO SUPERIOR/, /BRACO|ANTEBRACO|MEMBRO SUP/],
  [/\bMAO\b/, /\bMAO\b/],
  [/COXA/, /COXA\b|FEMUR/],
  [/PERNA/, /PERNA/],
  [/\bPE\b|ANTEPE/, /\bPE\b|ANTEPE/],
  [/ARTICULA/, /OMBRO|COTOVELO|PUNHO|JOELHO|TORNOZELO|QUADRIL|COXO|ESCAPULA|ARTICULACOES/],
  [/FETAL/, /GESTANTE/],
  [/CRANIO|ENCEFALO/, /CRANIO/],
];

// regiões dos angios
const REGIAO_ANGIO: [RegExp, RegExp][] = [
  [/CRANIO/, /CRANIO|ART\./], [/PESCOCO/, /PESCOCO/], [/PELVE/, /PELVE/], [/ABDOME|AORTA ABDOMINAL/, /ABD/],
  [/AORTA TORACICA|TORAX|PULMONAR/, /AORTA TOR/], [/MEMBRO INFERIOR/, /MMII/], [/MEMBRO SUPERIOR/, /MEMBRO SUP/],
];

function maquinasDoExame(b: BaseDados, e: Exame): OpcaoMaquina[] {
  const mod = modalidadeBase(e);
  if (mod !== 'RM' && mod !== 'TC') return [];
  const n = norm(e.nome); const angio = ehAngio(e);
  const eqs = b.equipamentos.filter((q) => q.tipo === mod);
  const itens = b.equipamentoExames.filter((x) => eqs.some((q) => q.id === x.equipamento_id));
  let casa: (nomeMaq: string) => boolean;
  if (angio && /CORONARIA/.test(n)) casa = (m) => /CORONARIA/.test(m);
  else if (angio) {
    const reg = REGIAO_ANGIO.find(([c]) => c.test(n));
    // arterial x venosa: a máquina que só faz arterial (ou só venosa) não aparece para o outro tipo
    const art = /ARTERIAL/.test(n), ven = /VENOSA/.test(n);
    const tipoOk = (m: string) => !(art && !ven && /VENOSA/.test(m)) && !(ven && !art && /ARTERIAL|ART\./.test(m));
    casa = (m) => /\bANGIO/.test(m) && (mod === 'TC' ? true : reg ? reg[1].test(m) : true) && tipoOk(m);
  } else {
    const par = ANATOMIA.find(([c]) => c.test(n));
    if (!par) return [];
    casa = (m) => !/\bANGIO/.test(m) && par[1].test(m) && !(par[1].source === 'CRANIO' && /BASE DO CRANIO/.test(m));
  }
  return itens.filter((x) => casa(norm(x.exame_nome))).map((x) => {
    const q = b.equipamentos.find((y) => y.id === x.equipamento_id)!;
    return { maquina: q.nome, unidade: b.unidades.find((u) => u.id === q.unidade_id)?.apelido ?? '', exameNaMaquina: x.exame_nome,
      horarios: x.horarios, minutos: x.minutos, contraste: x.contraste, condicao: x.condicao_paciente, periodo: x.periodo, pesoMaxKg: q.peso_max_kg };
  });
}

const US_MEDICO: [RegExp, RegExp][] = [
  [/OBSTETRICA/, /OBSTETRICA/], [/CAROTIDA|VASOS CERVICAIS ARTERIAIS/, /CAROTIDA/], [/ARTERIAS RENAIS|RENAL/, /RENAL/],
  [/DOPPLER.*MEMBRO INFERIOR|MEMBRO INFERIOR/, /MEMBROS INFERIORES/], [/MEMBRO SUPERIOR/, /MEMBROS SUPERIORES/],
  [/VISCERAIS|AORTA E ILIACAS/, /DOPPLER ABDOMINAL/], [/TRANSVAGINAL|ABDOME INFERIOR FEMININO|ENDOMETRIOSE/, /TRANSVAGINAL/],
  [/MAMA/, /MAMA/], [/TIREOIDE|ORGAOS SUPERFICIAIS/, /TIREOIDE/], [/PROSTATA|ABDOME INFERIOR MASCULINO/, /PROSTATA/],
  [/APARELHO URINARIO/, /URINARI/], [/ABDOME/, /ABDOME/], [/SALIVARES/, /SALIVARES|PAROTIDA/], [/AXILA|ESTRUTURAS SUPERFICIAIS/, /AXILA|CERVICAL/],
  [/ARTICULA/, /ARTICULA|OMBRO|COTOVELO|JOELHO|PUNHO/],
];

function medicosDoExame(b: BaseDados, e: Exame): OpcaoMedico[] {
  if (modalidadeBase(e) !== 'US') return [];
  const n = norm(e.nome); const par = US_MEDICO.find(([c]) => c.test(n));
  if (!par) return [];
  const out: OpcaoMedico[] = [];
  for (const me of b.medicoExames.filter((x) => par[1].test(norm(x.exame_nome)))) {
    const m = b.medicos.find((x) => x.id === me.medico_id);
    if (!m || out.some((o) => o.medico === m.nome)) continue;
    out.push({ medico: m.nome, exameDoMedico: me.exame_nome, agendaTodoDia: m.agenda_todos_os_dias,
      restricoes: b.medicoRestricoes.filter((r) => r.medico_id === m.id).map((r) => r.texto),
      agendas: b.medicoAgendas.filter((a) => a.medico_id === m.id).map((a) => a.tipo === 'recorrente' ? `${a.dia_semana} ${a.inicio}–${a.fim}` : `${a.data} ${a.inicio}–${a.fim} (eventual)`) });
  }
  return out;
}

// preparo pelo tipo de exame (títulos da base de preparos)
const PREPARO: [(n: string, mod: string, angio: boolean) => boolean, RegExp][] = [
  [(n) => /ENTERO/.test(n), /ENTERO/],
  [(n) => /ENDOMETRIOSE/.test(n), /ENDOMETRIOSE/],
  [(n, m) => m === 'RM' && /HIDRO|COLANGIO/.test(n), /COLANGIO/],
  [(n, m) => m === 'RM' && /PROSTATA/.test(n), /PROSTATA/],
  [(n, m) => m === 'RM' && /CORACAO/.test(n), /CARDIACA/],
  [(n, m) => m === 'RM' && /PELVE/.test(n), /PELVE$|PELVE \(|MAGNETICA DA PELVE$/],
  [(n) => /CORONARIA/.test(n), /CORONARIAS/],
  [(n) => /ESCORE/.test(n), /ESCORE/],
  [(n) => /ARTERIAS RENAIS|DOPPLER RENAL/.test(n), /DOPPLER RENAL/],
  [(_n, m) => m === 'RM', /RESSONANCIA \(GERAL\)/],
  [(_n, m) => m === 'TC', /TOMOGRAFIA \(GERAL\)/],
];

function preparosDoExame(b: BaseDados, e: Exame): Preparo[] {
  const n = norm(e.nome); const mod = modalidadeBase(e);
  const regra = PREPARO.find(([f]) => f(n, mod, ehAngio(e)));
  if (!regra) return [];
  return b.preparos.filter((p) => regra[1].test(norm(p.titulo)));
}

/** Condição do paciente que dispara a regra (o texto da regra sozinho não diz). */
const CONDICAO: Record<string, string> = {
  GESTANTE: 'Se a paciente for gestante', NEUROESTIMULADOR: 'Se o paciente tiver neuroestimulador',
  OPERADO_TUMOR: 'Se o paciente foi operado de tumor', TATUAGEM_RECENTE: 'Se o paciente fez tatuagem recente',
  JOELHO_90KG: 'Se o paciente tiver mais de 90 kg',
};

export function agendaDoExame(b: BaseDados, e: Exame): AgendaExame {
  const rcc = regrasRCC(b);
  const doExame = rcc.filter((r) => ['M23', 'M24', 'M25', 'M26', 'M16', 'M20'].includes(r.molde) && r.alvos.length
    && r.alvos.some((a) => !ALVOS_GERAIS.has(a) && !ALVOS_COMBINACAO.has(a) && !ALVOS_PACIENTE.has(a) && alvoCasa(b, a, e)));
  const doPaciente = rcc.filter((r) => r.alvos.some((a) => ALVOS_PACIENTE.has(a) && (a !== 'JOELHO_90KG' || /JOELHO/.test(norm(e.nome))))
    && ['RM'].includes(modalidadeBase(e)));
  const condicao = (r: (typeof doPaciente)[number]) => CONDICAO[r.alvos.find((a) => ALVOS_PACIENTE.has(a)) ?? ''] ?? 'Condição do paciente';
  return { maquinas: maquinasDoExame(b, e), medicos: medicosDoExame(b, e), preparos: preparosDoExame(b, e),
    avisos: doExame.map((r) => paraItem(b, r)), avisosPaciente: doPaciente.map((r) => { const i = paraItem(b, r); return { ...i, texto: `${condicao(r)}: ${i.texto}` }; }), ligacaoPorNome: true };
}
