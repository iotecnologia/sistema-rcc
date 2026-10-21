// Pacote de múltiplas regiões: RM (ou TC) de 2 ou mais regiões diferentes no mesmo pedido = um código só, o de múltiplas regiões
// (SulAmérica, Izabel 21/10/2026). Exames da mesma região continuam no pacote da região.
// Exame que depende do pedido conta com as regiões sugeridas: se nenhuma região serve para todos os exames, vira múltiplas regiões.
import type { BaseDados } from '../repositorio/repositorio';
import type { Id } from '../tipos/modelos';
import type { AutorizacaoExame, CodigoAutorizar } from './autorizacao';

const DE_PACOTE = new Set(['pacote_regiao', 'pacote_conferir']);

export function aplicarMultiplasRegioes(b: BaseDados, convenioId: Id, exames: { autorizacao: AutorizacaoExame }[]): void {
  const cfg = b.pacotes.find((c) => c.convenio_id === convenioId);
  if (!cfg) return;
  for (const mod of ['RM', 'TC'] as const) {
    const multi = cfg.pacotes.find((p) => p.modalidade === mod && p.tipo === 'multiplas');
    if (!multi) continue;
    const regionais = new Set(cfg.pacotes.filter((p) => p.modalidade === mod && p.tipo === 'regiao').map((p) => p.codigo));
    // regiões possíveis de cada exame do pedido (só pacotes de região desta modalidade)
    const doPedido = exames.map((e) => ({ e, regioes: e.autorizacao.codigos.filter((c) => DE_PACOTE.has(c.vinculo) && regionais.has(c.codigo)).map((c) => c.codigo) }))
      .filter((x) => x.regioes.length);
    if (doPedido.length < 2) continue;
    const emComum = doPedido.map((x) => new Set(x.regioes)).reduce((a, s) => new Set([...a].filter((r) => s.has(r))));
    if (emComum.size) continue;   // existe uma região que serve para todos: fica no pacote da região
    const nome = b.codigos.find((c) => c.convenio_id === convenioId && c.codigo === multi.codigo)?.nome_no_convenio ?? multi.regiao;
    const linha: CodigoAutorizar = { codigo: multi.codigo, tipo: 'PACOTE', nome, status: 'ativo', composicao: false, alternativo: false,
      grupo: multi.regiao, vinculo: 'pacote_multiplas',
      observacao: `Um código só para os ${doPedido.length} exames de ${mod === 'RM' ? 'ressonância' : 'tomografia'} (regiões diferentes)` };
    for (const { e } of doPedido)
      e.autorizacao = { ...e.autorizacao, codigos: [...e.autorizacao.codigos.filter((c) => !(DE_PACOTE.has(c.vinculo) && regionais.has(c.codigo))), linha] };
  }
}
