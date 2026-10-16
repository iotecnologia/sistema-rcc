// Resultado da consulta (igual ao protótipo aprovado): situação e datas no topo; à esquerda como autorizar e quando/onde;
// à direita o que o pedido precisa ter e o que falar ao paciente. Sem código de regra, sem "fonte", sem etiqueta técnica.
import { useState, type ReactNode } from 'react';
import type { Resultado, ResultadoExame } from '../regras/resultado';
import type { AgendaExame } from '../regras/agenda';
import { br, nomeDia } from '../regras/calendario';
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

/** Um passo da linha de raciocínio: número + pergunta + resposta curta. */
function Passo({ n, titulo, sub, extra, children }: { n: number; titulo: string; sub?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="passo-bloco">
      <div className="passo-num">{n}</div>
      <div className="passo-corpo"><h3>{titulo}{(sub || extra) && <small>{sub}{extra}</small>}</h3>{children}</div>
    </section>
  );
}

/** Lista curta: mostra 3 linhas e o resto em "ver mais" (o passo 5 mostra tudo aberto). */
function Lista({ itens, marcador = 'ponto', vazio, limite = 3 }: { itens: ReactNode[]; marcador?: 'ponto' | 'check'; vazio?: string; limite?: number }) {
  const [tudo, setTudo] = useState(false);
  if (!itens.length) return vazio ? <p className="mut" style={{ margin: 0 }}>{vazio}</p> : null;
  const mostra = tudo ? itens : itens.slice(0, limite);
  return (
    <>
      <ul className={'passo-lista ' + marcador}>{mostra.map((x, k) => <li key={k}>{x}</li>)}</ul>
      {itens.length > limite && <button type="button" className="ver-mais" onClick={() => setTudo(!tudo)}>{tudo ? 'ver menos' : `ver mais (${itens.length - limite})`}</button>}
    </>
  );
}

export function ResultadoView({ r, dataPedido }: { r: Resultado; dataPedido?: string | null }) {
  const b = useBase();
  const j = r.janela;
  const resp = r.convenio.tem_regras ? (r.geral.responsavel ?? 'setor de autorização') : 'o próprio convênio';
  const prazoDe = (e: ResultadoExame) => {
    const so = calcularJanela(b, r.convenio.slug, [{ exame: e.autorizacao.exame, quantidade: e.quantidade }], dataPedido ?? null, j.hoje);
    return { aPartirDe: so.agendarAPartirDe, motivo: j.prazos.find((x) => x.exameId === e.autorizacao.exame.id)?.motivo ?? so.motivoAPartir };
  };
  return (
    <>
      <div className="passos-resultado">
        <Passo n={1} titulo="Posso agendar?">
          {/* orientação, não confirmação: o sistema não vê o papel do paciente, então diz em que condições pode agendar */}
          <p className={'resposta-1 ' + r.situacao}>{r.situacao === 'nao_pode' ? 'Não agende:' : r.situacao === 'atencao' ? 'Antes de agendar, atenção:' : 'Pode agendar se:'}</p>
          <ul className="passo-lista ponto">
            {r.motivos.map((m) => <li key={m}>{m}</li>)}
            {r.situacao === 'atencao' && r.convenio.tem_regras && <li className="mut" style={{ listStyle: 'none', marginLeft: -16 }}>E também se:</li>}
            {r.situacao !== 'nao_pode' && !r.convenio.tem_regras && <li>Pode marcar assim que o paciente trouxer a guia autorizada, <b>dentro da validade da senha</b> escrita nela.</li>}
            {r.situacao !== 'nao_pode' && r.convenio.tem_regras && <>
              <li>o pedido estiver {j.pedidoValeAte
                ? <>dentro da validade: marcar até <b>{nomeDia(j.pedidoValeAte)} {br(j.pedidoValeAte).slice(0, 5)}</b> <span className="mut">· vale {r.geral.validadePedidoDias} dias</span></>
                : r.geral.pedidoSemPrazo ? <>com os dados certos (este convênio não dá prazo de validade)</>
                  : r.geral.validadePedidoDias ? <>com até <b>{r.geral.validadePedidoDias} dias</b> da data do pedido <span className="mut">· informe a data lá em cima para ver o último dia</span></>
                    : <>dentro da validade <span className="mut">· sem informação, confirme com {resp}</span></>};</li>
              <li>o pedido tiver tudo o que está no <b>passo 2</b>;</li>
              <li>a autorização for pedida {r.geral.responsavel ? <>com <b>{r.geral.responsavel}</b></> : 'ao convênio'} <span className="mut">· passo 3</span>;</li>
              <li>a data marcada for {j.agendarAPartirDe
                ? <>a partir de <b>{nomeDia(j.agendarAPartirDe)} {br(j.agendarAPartirDe).slice(0, 5)}</b> <span className="mut">· {j.motivoAPartir}</span></>
                : <><b>depois que o convênio autorizar</b></>}.</li>
            </>}
          </ul>
        </Passo>
        <Passo n={2} titulo="O pedido está certo?" sub="Confira no papel do paciente">
          <Lista marcador="check" itens={[
            ...r.combinacao.map((x) => <span key={x.id}><b>{x.texto}</b></span>),
            ...r.exames.flatMap((e) => e.autorizacao.regras.filter((x) => x.molde === 'M18').map((x) => <span key={x.id}><b>{e.autorizacao.exame.nome}:</b> {x.texto}</span>)),
            ...r.geral.checklist.filter((c) => c.situacao === 'confirmada').map((c) => <span key={c.texto}>{c.texto}{c.link && <> · <a href={'./' + c.link} target="_blank" rel="noopener noreferrer">abrir guia</a></>}</span>),
          ]} vazio="Nada especial para conferir." />
        </Passo>
        <Passo n={3} titulo="Como peço a autorização?" sub={`${resp}${r.geral.portal ? ' · ' : ''}`} extra={r.geral.portal && <a href={r.geral.portal.url} target="_blank" rel="noopener noreferrer">{r.geral.portal.rotulo}</a>}>
          {r.exames.map((e) => {
            const a = e.autorizacao;
            const obs = [...(COBERTURA_OK.has(a.cobertura) ? [] : [a.coberturaTexto]), ...a.regras.filter((x) => x.molde !== 'M18').map((x) => x.texto)];
            return (
              <div key={a.exame.id} className="passo-exame">
                <div className="passo-exame-cab"><b>{a.exame.nome}</b>{e.quantidade > 1 && <span className="mut"> · {e.quantidade}x</span>}
                  {a.codigos.length ? <span className="cod">{unicos(a.codigos.map((c) => c.codigo)).join(' + ')}</span> : <span className="mut">sem código cadastrado</span>}</div>
                {obs.length > 0 && <Lista itens={obs.map((o) => <span key={o}>{o}</span>)} />}
              </div>
            );
          })}
        </Passo>
        <Passo n={4} titulo="Quando e onde marcar?">
          {r.exames.map((e) => {
            const p = prazoDe(e);
            const internos = e.agenda.avisos.filter((x) => x.molde !== 'M26');
            return (
              <div key={e.autorizacao.exame.id} className="passo-exame">
                <div className="passo-exame-cab"><b>{e.autorizacao.exame.nome}</b>
                  <span>a partir de <b>{p.aPartirDe ? `${nomeDia(p.aPartirDe)} ${br(p.aPartirDe).slice(0, 5)}` : '—'}</b> <span className="mut">({p.motivo})</span></span></div>
                <div className="passo-linha"><Icone n="maquina" />{ondeTexto(e)}</div>
                {internos.length > 0 && <Lista itens={internos.map((x) => <span key={x.id}>{x.texto}</span>)} />}
              </div>
            );
          })}
        </Passo>
        <Passo n={5} titulo="O que falo para o paciente?">
          {r.exames.map((e) => {
            const prep = e.agenda.avisos.filter((x) => x.molde === 'M26');
            const nada = !e.agenda.preparos.length && !prep.length && !e.agenda.avisosPaciente.length;
            return (
              <div key={e.autorizacao.exame.id} className="passo-exame">
                <div className="passo-exame-cab"><b>{e.autorizacao.exame.nome}</b></div>
                {nada ? <p className="mut" style={{ margin: 0 }}>Sem preparo.</p> : <Lista itens={[
                  ...e.agenda.preparos.map((pp) => <div key={pp.id}><b>{pp.titulo.replace(/^Preparo\s*[—-]\s*/i, 'Preparo: ')}</b><div className="preparo-txt">{pp.texto}</div></div>),
                  ...prep.map((x) => <span key={x.id}>{x.texto}</span>),
                  ...e.agenda.avisosPaciente.map((a) => <span key={a.id}><b>Pergunte:</b> {a.texto}</span>),
                ]} limite={99} />}
              </div>
            );
          })}
        </Passo>
      </div>
    </>
  );
}
