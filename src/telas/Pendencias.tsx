// Administração: regras que ainda não estão confirmadas + pendências da base.
import { useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, Kpi, TagSituacao, TituloPagina } from '../componentes/Comuns';
import { frase } from '../regras/frase';
import { nomeConvenio } from '../regras/contexto';

export function Pendencias() {
  const b = useBase();
  const [sit, setSit] = useState('');
  const [conv, setConv] = useState('');
  const regras = b.regras.regras.filter((r) => !['confirmada', 'substituida'].includes(r.situacao));
  const lista = regras.filter((r) => (!sit || r.situacao === sit) && (!conv || (r.convenio ?? 'rcc') === conv));
  const conta = (s: string) => regras.filter((r) => r.situacao === s).length;
  const abertas = b.pendencias.filter((p) => !p.resolvido);
  return (
    <>
      <TituloPagina titulo="Regras a confirmar" sub="O que a equipe ainda precisa responder. Cada linha mostra o texto original de onde a regra veio." />
      <div className="kpis">
        <Kpi cor="#dc2626" rot="Conflito" val={conta('conflito')} det="duas informações que não batem" />
        <Kpi cor="#d97706" rot="A confirmar" val={conta('a_confirmar')} det="texto ambíguo" />
        <Kpi cor="#3b82f6" rot="Sem informação" val={conta('sem_informacao')} det="campo nunca preenchido" />
        <Kpi cor="#64748b" rot="Pendências da base" val={abertas.length} det={`${b.pendencias.length - abertas.length} já resolvidas`} />
      </div>
      <div className="barra">
        <label className="cp" style={{ flex: '0 1 220px' }}><span>Situação</span><select value={sit} onChange={(e) => setSit(e.target.value)}><option value="">Todas</option><option value="conflito">Conflito</option><option value="a_confirmar">A confirmar</option><option value="sem_informacao">Sem informação</option><option value="vencida">Vencida</option></select></label>
        <label className="cp" style={{ flex: '0 1 260px' }}><span>Convênio</span><select value={conv} onChange={(e) => setConv(e.target.value)}><option value="">Todos</option><option value="rcc">Regras gerais da RCC</option>{b.convenios.filter((c) => c.tem_regras).map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
      </div>
      <div className="blocos">
        <Bloco titulo={`${lista.length} regras`}>
          <table className="tab"><thead><tr><th>Regra</th><th>Convênio</th><th>Como ficou</th><th>Situação</th></tr></thead>
            <tbody>{lista.map((r) => (
              <tr key={r.id}><td className="cod">{r.id}</td><td>{r.convenio ? nomeConvenio(b, r.convenio) : 'RCC'}</td>
                <td>{frase(b, r)}<div className="orig">fonte: “{r.texto_original}” · {r.molde_nome}</div></td><td><TagSituacao s={r.situacao} /></td></tr>
            ))}</tbody></table>
        </Bloco>
        <Bloco titulo={`Pendências da base (${abertas.length} abertas)`}>
          <table className="tab"><thead><tr><th>#</th><th>Tipo</th><th>Onde</th><th>Problema</th><th>Ação</th></tr></thead>
            <tbody>{b.pendencias.map((p) => (
              <tr key={p.id}><td>{p.id}</td><td>{p.tipo}</td><td className="mut">{p.onde}</td><td>{p.problema}{p.resposta && <div className="orig">resposta: {p.resposta}</div>}</td>
                <td>{p.resolvido ? <span className="tag t-ok">Resolvida</span> : p.acao_sugerida}</td></tr>
            ))}</tbody></table>
        </Bloco>
      </div>
    </>
  );
}
