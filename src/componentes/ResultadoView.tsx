// Resultado da consulta (igual ao protótipo aprovado): situação e datas no topo; à esquerda como autorizar e quando/onde;
// à direita o que o pedido precisa ter e o que falar ao paciente. Sem código de regra, sem "fonte", sem etiqueta técnica.
import type { Resultado, ResultadoExame } from '../regras/resultado';
import type { AgendaExame } from '../regras/agenda';
import { br, nomeDia } from '../regras/calendario';
import { Bloco, Kpi } from './Comuns';
import { Icone } from './Icone';
import { useBase } from './Dados';
import { calcularJanela } from '../regras/janela';

const COBERTURA_OK = new Set(['coberto', 'sem_informacao']);
const unicos = (l: string[]) => [...new Set(l)];

/** "RM 2 ou RM 4 · 1 horário (10 min)" — sem repetir máquina. */
export function ondeTexto(e: { agenda: AgendaExame }): string {
  const m = e.agenda.maquinas;
  if (m.length) {
    const nomes = unicos(m.map((x) => x.maquina));
    const h = m.map((x) => x.horarios).filter((x): x is number => !!x);
    const min = h.length ? Math.min(...h) : null;
    return `${nomes.join(' ou ')}${min ? ` · ${min} horário${min > 1 ? 's' : ''} (${min * 10} min)` : ''}`;
  }
  if (e.agenda.medicos.length) {
    const n = e.agenda.medicos.map((x) => x.medico);
    return n.slice(0, 3).join(', ') + (n.length > 3 ? ` e mais ${n.length - 3}` : '');
  }
  return '—';
}

export function ResultadoView({ r, dataPedido }: { r: Resultado; dataPedido?: string | null }) {
  const b = useBase();
  const j = r.janela;
  const cor = r.situacao === 'nao_pode' ? '#dc2626' : r.situacao === 'atencao' ? '#d97706' : '#16a34a';
  const sit = r.situacao === 'nao_pode' ? 'Não agendar' : r.situacao === 'atencao' ? 'Atenção' : 'Pode agendar';
  const resp = r.convenio.tem_regras ? (r.geral.responsavel ?? 'setor de autorização') : 'o próprio convênio';
  const prazoDe = (e: ResultadoExame) => {
    const so = calcularJanela(b, r.convenio.slug, [{ exame: e.autorizacao.exame, quantidade: e.quantidade }], dataPedido ?? null, j.hoje);
    return { aPartirDe: so.agendarAPartirDe, motivo: j.prazos.find((x) => x.exameId === e.autorizacao.exame.id)?.motivo ?? so.motivoAPartir };
  };
  return (
    <>
      <div className="kpis">
        <Kpi cor={cor} rot="Situação" txt val={<span style={{ color: cor }}>{sit}</span>} det={r.motivos[0] ?? 'Tudo dentro das regras do convênio.'} />
        <Kpi cor="#3b82f6" rot="Agendar a partir de" txt val={j.agendarAPartirDe ? `${nomeDia(j.agendarAPartirDe)} ${br(j.agendarAPartirDe).slice(0, 5)}` : '—'} det={j.motivoAPartir} />
        <Kpi cor="#a855f7" rot="Agendar até" txt
          val={j.pedidoValeAte ? `${nomeDia(j.pedidoValeAte)} ${br(j.pedidoValeAte).slice(0, 5)}` : r.geral.pedidoSemPrazo ? 'sem prazo' : '—'}
          det={j.pedidoValeAte ? (j.pedidoVencido ? 'PEDIDO VENCIDO' : `pedido vale ${r.geral.validadePedidoDias} dias corridos`)
            : r.geral.validadePedidoDias ? `pedido vale ${r.geral.validadePedidoDias} dias · informe a data do pedido` : `pedido sem data: confirme com ${resp}`} />
        <Kpi cor="#64748b" rot="Onde autorizar" txt val={<span style={{ fontSize: 17 }}>{r.geral.portal ? r.geral.portal.rotulo : resp}</span>} det={`${r.convenio.nome}${r.geral.portal ? ' · ' + resp : ''}`} />
      </div>
      {r.motivos.length > 1 && <div className={'faixa ' + (r.situacao === 'nao_pode' ? 'no' : 'at')}><div className="txt"><ul>{r.motivos.map((m) => <li key={m}>{m}</li>)}</ul></div></div>}

      <div className="grade2">
        <div className="pilha">
          <Bloco titulo="Como autorizar" extra={<span className="mut" style={{ fontSize: 12 }}>{r.convenio.nome}</span>}>
            <table className="tab">
              <thead><tr><th>Exame</th><th>Código</th><th>Observação</th></tr></thead>
              <tbody>{r.exames.map((e) => {
                const a = e.autorizacao;
                const obs = [...(COBERTURA_OK.has(a.cobertura) ? [] : [a.coberturaTexto]), ...a.regras.map((x) => x.texto)];
                return (
                  <tr key={a.exame.id}>
                    <td><b>{a.exame.nome}</b>{e.quantidade > 1 && <div className="mut" style={{ fontSize: 12 }}>quantidade: {e.quantidade}</div>}</td>
                    <td>{a.codigos.length ? <span className="cod">{unicos(a.codigos.map((c) => c.codigo)).join(' + ')}</span> : <span className="mut">sem código</span>}</td>
                    <td>{obs.length ? obs.map((o) => <div key={o}>{o}</div>) : a.codigos.some((c) => c.tipo === 'TUSS') ? 'Código TUSS.' : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            {r.combinacao.length > 0 && <div style={{ padding: '10px 16px', fontSize: 13 }}><b>Por causa da combinação de exames:</b>{r.combinacao.map((x) => <div key={x.id}>• {x.texto}</div>)}</div>}
          </Bloco>
          <Bloco titulo="Quando e onde">
            <table className="tab">
              <thead><tr><th>Exame</th><th>A partir de</th><th>Prazo</th><th>Máquina · médico</th></tr></thead>
              <tbody>{r.exames.map((e) => {
                const p = prazoDe(e);
                return (
                  <tr key={e.autorizacao.exame.id}>
                    <td><b>{e.autorizacao.exame.nome}</b>{e.agenda.avisos.map((x) => <div key={x.id} className="mut" style={{ fontSize: 12, marginTop: 3 }}>{x.texto}</div>)}</td>
                    <td><b>{p?.aPartirDe ? `${nomeDia(p.aPartirDe)} ${br(p.aPartirDe).slice(0, 5)}` : '—'}</b></td>
                    <td className="mut">{p?.motivo ?? '—'}</td>
                    <td>{ondeTexto(e)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </Bloco>
        </div>
        <div className="pilha">
          <Bloco titulo="O pedido médico precisa ter">
            <ul className="checks">{r.geral.checklist.filter((c) => c.situacao === 'confirmada').map((c, i) => (
              <li key={i}><span className="bx" /><span>{c.texto}{c.link && <> · <a href={'./' + c.link} target="_blank" rel="noopener noreferrer">abrir guia</a></>}</span></li>
            ))}</ul>
          </Bloco>
          <Bloco titulo="Fale para o paciente">
            <ul className="feed">{r.exames.map((e) => (
              <li key={e.autorizacao.exame.id}>
                <span className="dot"><Icone n="medico" /></span>
                <div><b>{e.autorizacao.exame.nome}</b>
                  {e.agenda.preparos.map((p) => <details key={p.id}><summary>{p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}
                  {e.agenda.avisosPaciente.map((a) => <div key={a.id} style={{ fontSize: 13 }}><b>Pergunte:</b> {a.texto}</div>)}
                  {!e.agenda.preparos.length && !e.agenda.avisosPaciente.length && <div className="mut" style={{ fontSize: 12 }}>Sem preparo.</div>}
                </div>
              </li>
            ))}</ul>
          </Bloco>
        </div>
      </div>
    </>
  );
}
