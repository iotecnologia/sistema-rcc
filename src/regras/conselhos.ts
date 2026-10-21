// Médico solicitante em texto (impressão / WhatsApp): um conselho por linha, dizendo se aceita ou não.
// Mesma leitura da tela (componentes/Conselhos.tsx): aceita · não aceita · aceita com condição.
import type { ConvenioConselho } from '../tipos/modelos';

const ORDEM = ['CRM', 'CRO', 'CREFITO'];

/** "• CRM: aceita" · "• CRO: aceita só se o pedido for TC de face…" · "• CREFITO: não aceita" */
export function conselhosEmLinhas(cons: ConvenioConselho[]): string[] {
  return [...cons].sort((x, y) => (ORDEM.indexOf(x.conselho) + 99) % 99 - (ORDEM.indexOf(y.conselho) + 99) % 99).map((c) => {
    const cond = c.aceita && c.restricao && !/^inclusive/i.test(c.restricao);   // "Inclusive ..." é só observação
    return `• ${c.conselho}: ${!c.aceita ? 'não aceita' : cond ? `aceita ${c.restricao!.charAt(0).toLowerCase()}${c.restricao!.slice(1)}` : `aceita${c.restricao ? ' · ' + c.restricao.toLowerCase() : ''}`}`;
  });
}

/** Troca a linha "Médico solicitante: ..." do checklist por um título + um conselho por linha (quando há cadastro). */
export const pedidoEmLinhas = (pedido: string[], cons: ConvenioConselho[]): string[] =>
  pedido.flatMap((t) => (/^m[ée]dico solicitante/i.test(t) && cons.length ? ['Médico solicitante:', ...conselhosEmLinhas(cons)] : [t]));
