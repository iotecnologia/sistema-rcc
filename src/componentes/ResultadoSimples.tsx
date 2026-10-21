// Resultado para quem agenda: 3 blocos, sem termo técnico.
// 1 Pode ou não pode (e a partir de quando) · 2 Faça isto (inclui "se o paciente…") · 3 Fale para o paciente (preparo)
import type { Resultado } from '../regras/resultado';
import { br } from '../regras/calendario';
import type { RelatorioDados } from './Relatorio';
import { pedidoEmLinhas } from '../regras/conselhos';

const unicos = <T,>(l: T[], k: (x: T) => string) => l.filter((x, i) => l.findIndex((y) => k(y) === k(x)) === i);

function dados(r: Resultado) {
  const resp = r.geral.responsavel ?? 'o setor de autorização';
  const quando = r.janela.agendarAPartirDe ? `a partir de ${br(r.janela.agendarAPartirDe)}` : r.janela.motivoAPartir;
  const codigos = r.exames.map((e) => ({ nome: e.autorizacao.exame.nome, qtd: e.quantidade, cod: e.autorizacao.codigos.map((c) => c.codigo).join(' + ') }));
  const pedido = pedidoEmLinhas(r.geral.checklist.filter((x) => x.situacao === 'confirmada').map((x) => x.texto), r.conselhos);
  const regras = unicos([...r.combinacao, ...r.exames.flatMap((e) => [...e.autorizacao.regras, ...e.agenda.avisos, ...e.agenda.avisosPaciente])].filter((x) => x.situacao === 'confirmada'), (x) => x.id).map((x) => x.texto);
  const preparos = unicos(r.exames.flatMap((e) => e.agenda.preparos), (p) => String(p.id));
  const paciente: string[] = [];
  const confirmar = unicos(r.pendentes, (x) => x.id).map((x) => x.texto);
  return { resp, quando, codigos, pedido, regras, preparos, paciente, confirmar };
}

export function ResultadoSimples({ r }: { r: Resultado }) {
  const d = dados(r);
  const cls = r.situacao === 'pode_agendar' ? 'ok' : r.situacao === 'atencao' ? 'at' : 'no';
  return (
    <div className="res-simples">
      <div className={'faixa ' + cls}>
        <div className="txt">
          <b className="res-grande">{r.situacao === 'nao_pode' ? 'NÃO PODE AGENDAR' : `PODE AGENDAR ${d.quando}`}</b>
          {r.janela.pedidoValeAte && !r.janela.pedidoVencido && <span>Pedido vale até {br(r.janela.pedidoValeAte)}</span>}
          {r.motivos.length > 0 && <ul>{r.motivos.map((m) => <li key={m}>{m}</li>)}</ul>}
        </div>
      </div>
      {d.confirmar.length > 0 && <div className="res-bloco"><h3>Antes de agendar, confirme com {d.resp}</h3><ul>{d.confirmar.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      <div className="res-bloco">
        <h3>Faça isto</h3>
        <ul>
          <li>Autorização: {d.resp}</li>
          {d.codigos.map((c) => <li key={c.nome}>{c.nome}{c.qtd > 1 ? ` (${c.qtd}x)` : ''}: {c.cod ? <>autorizar com o código <b>{c.cod}</b></> : 'sem código cadastrado — confirmar'}</li>)}
          {d.pedido.map((x) => <li key={x}>{x}</li>)}
          {d.regras.map((x) => <li key={x}>{x}</li>)}
        </ul>
        {(r.geral.portal || r.geral.guiaPdf) && <div className="res-links">
          {r.geral.portal && <a className="btn2" href={r.geral.portal.url} target="_blank" rel="noopener noreferrer">{r.geral.portal.rotulo}</a>}
          {r.geral.guiaPdf && <a className="btn2" href={'./' + r.geral.guiaPdf} target="_blank" rel="noopener noreferrer">Guia SP/SADT</a>}
        </div>}
      </div>
      <div className="res-bloco">
        <h3>Fale para o paciente</h3>
        {d.preparos.length + d.paciente.length === 0 ? <p className="mini">Nenhum preparo ou aviso para este exame.</p> : <>
          <ul>{d.paciente.map((x) => <li key={x}>{x}</li>)}</ul>
          {d.preparos.map((p) => <details key={p.id}><summary>Preparo: {p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}
        </>}
      </div>
    </div>
  );
}

/** Relatório "Orientações do exame" (mesmo cartão do orçamento). */
export function relatorioAgendamento(r: Resultado): RelatorioDados {
  const d = dados(r);
  return {
    titulo: 'Orientações do exame',
    secoes: [
      { titulo: 'Exames', linhas: d.codigos.map((c) => [c.nome + (c.qtd > 1 ? ` (${c.qtd}x)` : ''), c.cod || '—'] as [string, string]) },
      { titulo: 'Agendamento', linhas: [['Convênio', r.convenio.nome], ['Agendar', r.situacao === 'nao_pode' ? 'não pode agendar' : d.quando],
        ...(r.janela.pedidoValeAte ? [['Pedido vale até', br(r.janela.pedidoValeAte)] as [string, string]] : [])] },
      ...(d.pedido.length ? [{ titulo: 'O pedido médico precisa ter', linhas: d.pedido.map((x) => [x] as [string]) }] : []),
      ...(d.paciente.length ? [{ titulo: 'Avisos', linhas: d.paciente.map((x) => [x] as [string]) }] : []),
      ...d.preparos.map((p) => ({ titulo: /^preparo/i.test(p.titulo) ? p.titulo : 'Preparo: ' + p.titulo, texto: p.texto })),
    ],
  };
}
