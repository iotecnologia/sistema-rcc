// Códigos que vêm dos pacotes por região (ex.: SulAmérica). Cada pacote vira uma linha de código para cada exame ligado a ele;
// o exame que depende do pedido ganha uma linha para cada código sugerido, com o aviso para conferir.
// Quando o convênio autoriza assim, os exames que não são RM/TC recebem o TUSS do próprio exame.
// Assim as telas e as regras continuam lendo tudo em b.codigos, sem caso especial por convênio.
import type * as M from '../tipos/modelos';

/** Modalidades autorizadas por pacote (o resto vai pelo TUSS). */
export const MODALIDADE_PACOTE: Record<string, 'RM' | 'TC'> = { RESSONANCIA: 'RM', ANGIORRESSONANCIA: 'RM', TOMOGRAFIA: 'TC', ANGIOTOMOGRAFIA: 'TC' };

export function codigosDosPacotes(cfg: M.ConvenioPacotes[], codigos: M.ConvenioCodigo[], exames: M.Exame[]): M.ConvenioCodigo[] {
  let id = 900000;   // ids altos: não colidem com os da tabela de códigos
  const novos: M.ConvenioCodigo[] = [];
  for (const c of cfg) {
    const nomeNoConvenio = (cod: string) => codigos.find((x) => x.convenio_id === c.convenio_id && x.codigo === cod)?.nome_no_convenio ?? '';
    const pacote = (cod: string) => c.pacotes.find((p) => p.codigo === cod)!;
    const linha = (exameId: M.Id, p: M.PacoteRegiao, extra: Partial<M.ConvenioCodigo>): M.ConvenioCodigo => ({
      id: id++, convenio_id: c.convenio_id, exame_id: exameId, codigo: p.codigo, tipo: 'PACOTE', nome_no_convenio: nomeNoConvenio(p.codigo),
      observacao: null, composicao: false, alternativo: false, grupo: p.regiao, secao: `Pacote ${p.modalidade} · ${p.regiao}`,
      revisao: null, status: 'ativo', vinculo: p.tipo === 'especial' ? 'pacote_especial' : 'pacote_regiao', ...extra });
    const temCodigo = new Set(codigos.filter((x) => x.convenio_id === c.convenio_id && x.exame_id && x.status === 'ativo').map((x) => x.exame_id));
    for (const p of c.pacotes) for (const exameId of p.exames) { novos.push(linha(exameId, p, {})); temCodigo.add(exameId); }
    for (const d of c.duvidas ?? []) {
      for (const cod of d.opcoes) novos.push(linha(d.exame, pacote(cod), { alternativo: d.opcoes.length > 1, observacao: d.aviso, vinculo: 'pacote_conferir' }));
      temCodigo.add(d.exame);
    }
    if (c.tuss_fora_dos_pacotes) for (const e of exames)
      if (e.ativo && e.tuss && !MODALIDADE_PACOTE[e.modalidade] && !temCodigo.has(e.id))
        novos.push({ id: id++, convenio_id: c.convenio_id, exame_id: e.id, codigo: e.tuss, tipo: 'TUSS', nome_no_convenio: e.nome,
          observacao: null, composicao: false, alternativo: false, grupo: null, secao: 'TUSS do exame (fora dos pacotes)',
          revisao: null, status: 'ativo', vinculo: 'tuss_convenio' });
  }
  return novos;
}

/** Convênios que autorizam pelo TUSS padrão (config.codigos_tuss): cada exame ativo sem código próprio recebe o TUSS do catálogo. */
export function codigosTussPadrao(cfg: M.ConvenioConfig[], codigos: M.ConvenioCodigo[], exames: M.Exame[]): M.ConvenioCodigo[] {
  let id = 950000;   // ids altos: não colidem com os da tabela nem com os dos pacotes
  const novos: M.ConvenioCodigo[] = [];
  for (const c of cfg.filter((x) => x.codigos_tuss)) {
    const temCodigo = new Set(codigos.filter((x) => x.convenio_id === c.convenio_id && x.exame_id && x.status === 'ativo').map((x) => x.exame_id));
    for (const e of exames)
      if (e.ativo && e.tuss && !temCodigo.has(e.id))
        novos.push({ id: id++, convenio_id: c.convenio_id, exame_id: e.id, codigo: e.tuss, tipo: 'TUSS', nome_no_convenio: e.nome,
          observacao: null, composicao: false, alternativo: false, grupo: null, secao: 'TUSS do exame',
          revisao: null, status: 'ativo', vinculo: 'tuss_padrao' });
  }
  return novos;
}
