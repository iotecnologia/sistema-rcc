// Mostra o resultado do motor (usado na Consulta e no Passo a passo). Linha de leitura:
// 1) pode ou não pode  2) datas  3) como autorizar  4) o pedido precisa ter  5) onde/quando  6) fale para o paciente  7) a confirmar
import type { Resultado } from '../regras/resultado';
import { br, nomeDia } from '../regras/calendario';
import { Bloco, Kpi, TagSituacao } from './Comuns';
import { Icone } from './Icone';
import type { ItemRegra } from '../regras/autorizacao';

const COB_TAG: Record<string, string> = { coberto: 't-ok', sem_cobertura: 't-no', nao_autoriza: 't-no', nao_aceito_no_contrato: 't-no',
  conflito: 't-no', consultar_contrato: 't-at', consultar_faturamento: 't-at', so_contrato_amb: 't-at', sem_informacao: 't-in' };

function Regras({ itens }: { itens: ItemRegra[] }) {
  if (!itens.length) return <span className="mut">—</span>;
  return (
    <ul className="lista-regras">
      {itens.map((r) => (
        <li key={r.id}>
          {r.situacao !== 'confirmada' && <TagSituacao s={r.situacao} />}
          <div>{r.texto}<div className="orig">{r.id} · fonte: “{r.original}”</div></div>
        </li>
      ))}
    </ul>
  );
}

export function ResultadoView({ r }: { r: Resultado }) {
  const j = r.janela;
  const faixa = r.situacao === 'nao_pode' ? ['no', 'Não pode agendar'] : r.situacao === 'atencao' ? ['at', 'Atenção antes de agendar'] : ['ok', 'Pode agendar'];
  const corA = r.situacao === 'nao_pode' ? '#dc2626' : r.situacao === 'atencao' ? '#d97706' : '#16a34a';
  return (
    <>
      <div className="so-impressao"><b>Analiza RCC — {r.convenio.nome}</b> · impresso em {br(j.hoje)}</div>
      <div className={'faixa ' + faixa[0]} role="status">
        <Icone n={r.situacao === 'pode_agendar' ? 'ok' : r.situacao === 'atencao' ? 'pendencia' : 'x'} />
        <div className="txt">{faixa[1]}{r.motivos.length > 0 && <ul>{r.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul>}</div>
      </div>

      <div className="kpis">
        <Kpi cor="#3b82f6" rot="Agendar a partir de" txt val={j.agendarAPartirDe ? br(j.agendarAPartirDe) : '—'}
          det={j.agendarAPartirDe ? `${nomeDia(j.agendarAPartirDe)} · ${j.motivoAPartir}` : j.motivoAPartir} />
        <Kpi cor="#a855f7" rot="Pedido vale até" txt val={j.pedidoValeAte ? br(j.pedidoValeAte) : r.geral.pedidoSemPrazo ? 'Sem prazo' : '—'}
          det={j.pedidoValeAte ? (j.pedidoVencido ? 'VENCIDO' : `faltam ${j.diasRestantesPedido} dias`) : r.geral.pedidoSemPrazo ? '' : 'sem informação'} />
        <Kpi cor="#0ea5e9" rot="Autorização vale" txt val={j.autorizacaoValeDias ? `${j.autorizacaoValeDias} dias` : '—'}
          det={j.autorizacaoValeAte ? `até ${br(j.autorizacaoValeAte)}` : j.autorizacaoValeDias ? 'corridos, a partir da autorização' : 'sem informação'} />
        <Kpi cor={corA} rot="Onde autorizar" txt val={<span style={{ fontSize: 16 }}>{r.convenio.tem_regras ? (r.geral.responsavel ?? '—') : 'O próprio convênio'}</span>}
          det={r.geral.portal ? <a href={r.geral.portal.url} target="_blank" rel="noopener noreferrer">{r.geral.portal.rotulo}</a> : 'sem portal cadastrado'} />
      </div>

      <div className="grade2">
        <div className="pilha">
          <Bloco titulo="Como autorizar" extra={<span className="mut" style={{ fontSize: 12 }}>{r.convenio.nome}</span>}>
            <table className="tab">
              <thead><tr><th>Exame</th><th>Código</th><th>Cobertura</th><th>Regras</th></tr></thead>
              <tbody>
                {r.exames.map((e) => (
                  <tr key={e.autorizacao.exame.id}>
                    <td><b>{e.autorizacao.exame.nome}</b>{e.quantidade > 1 && <div className="mini">quantidade: {e.quantidade}</div>}
                      {e.autorizacao.exame.tuss && <div className="mini">TUSS {e.autorizacao.exame.tuss}</div>}</td>
                    <td>{e.autorizacao.codigos.length
                      ? e.autorizacao.codigos.map((c) => <div key={c.codigo}><span className="cod">{c.codigo}</span> <span className="mini">{c.tipo}{c.status !== 'ativo' ? ' · ' + c.status.replace('_', ' ') : ''}{c.quantidade ? ` · qtd ${c.quantidade}` : ''}</span></div>)
                      : <span className="mut">sem código cadastrado</span>}</td>
                    <td>{e.autorizacao.cobertura === 'sem_informacao' ? <span className="mut">{e.autorizacao.coberturaTexto}</span> : <span className={'tag ' + COB_TAG[e.autorizacao.cobertura]}>{e.autorizacao.coberturaTexto}</span>}</td>
                    <td><Regras itens={e.autorizacao.regras} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Bloco>

          {r.combinacao.length > 0 && (
            <Bloco titulo="Por causa da combinação de exames"><div className="pad"><Regras itens={r.combinacao} /></div></Bloco>
          )}

          <Bloco titulo="Quando e onde">
            <table className="tab">
              <thead><tr><th>Exame</th><th>Prazo</th><th>Máquina · horários</th><th>Médico (US)</th></tr></thead>
              <tbody>
                {r.exames.map((e) => {
                  const p = j.prazos.find((x) => x.exameId === e.autorizacao.exame.id);
                  return (
                    <tr key={e.autorizacao.exame.id}>
                      <td><b>{e.autorizacao.exame.nome}</b></td>
                      <td className="mut">{p?.motivo ?? '—'}</td>
                      <td>{e.agenda.maquinas.length ? e.agenda.maquinas.map((m, i) => (
                        <div key={i}>{m.maquina}: {m.exameNaMaquina}{m.horarios ? ` · ${m.horarios} horário(s) = ${m.minutos} min` : ' · tempo não cadastrado'}{m.contraste ? ' · contraste' : ''}{m.periodo ? ' · só ' + m.periodo : ''}</div>
                      )) : <span className="mut">{['RM', 'TC'].some((x) => e.autorizacao.exame.modalidade.includes(x === 'RM' ? 'RESSON' : 'TOMO')) ? 'nenhuma máquina cadastrada para este exame' : '—'}</span>}</td>
                      <td>{e.agenda.medicos.length ? e.agenda.medicos.map((m) => (
                        <div key={m.medico}>{m.medico}{!m.agendaTodoDia && <span className="mini"> · não tem agenda todo dia</span>}{m.restricoes.map((x) => <div key={x} className="mini">{x}</div>)}{m.agendas.map((x) => <div key={x} className="mini">{x}</div>)}</div>
                      )) : <span className="mut">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {r.exames.some((e) => e.agenda.maquinas.length || e.agenda.medicos.length) && <div className="pad mini">Máquina e médico sugeridos pelo nome do exame (a base ainda não liga esses nomes ao TUSS) — confira na agenda.</div>}
          </Bloco>
        </div>

        <div className="pilha">
          <Bloco titulo="O pedido médico precisa ter">
            <ul className="checks">
              {r.geral.checklist.map((c, i) => (
                <li key={i} className={c.forte ? 'forte' : ''}><span className="bx" /><span>{c.texto}{c.situacao !== 'confirmada' && <> <TagSituacao s={c.situacao} /></>}
                  {c.link && <> · <a href={'./' + c.link} target="_blank" rel="noopener noreferrer">abrir guia</a></>}</span></li>
              ))}
            </ul>
          </Bloco>
          <Bloco titulo="Fale para o paciente">
            <ul className="feed">
              {r.exames.map((e) => (
                <li key={e.autorizacao.exame.id}>
                  <span className="dot"><Icone n="medico" /></span>
                  <div><b>{e.autorizacao.exame.nome}</b>
                    {e.agenda.preparos.map((p) => <details key={p.id}><summary>{p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}
                    {e.agenda.avisos.map((a) => <div key={a.id} className="mini">• {a.texto}{a.situacao !== 'confirmada' && <> <TagSituacao s={a.situacao} /></>}</div>)}
                    {!e.agenda.preparos.length && !e.agenda.avisos.length && <div className="mini">Sem preparo cadastrado.</div>}
                  </div>
                </li>
              ))}
            </ul>
          </Bloco>
          {(r.pendentes.length > 0 || j.semInformacao.length > 0 || j.analise.length > 0) && (
            <Bloco titulo="Confirmar com o setor de autorização">
              <div className="pad">
                <ul className="lista-regras">
                  {j.analise.map((a) => <li key={a}><span className="tag t-in">Análise</span><div>{a}</div></li>)}
                  {j.semInformacao.map((a) => <li key={a}><TagSituacao s="sem_informacao" /><div>{a}</div></li>)}
                </ul>
                {r.pendentes.length > 0 && <div style={{ marginTop: 8 }}><Regras itens={r.pendentes} /></div>}
              </div>
            </Bloco>
          )}
        </div>
      </div>
    </>
  );
}
