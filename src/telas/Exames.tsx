// Exames: catálogo (TUSS) e, para o exame escolhido, como ele fica em CADA convênio + máquina e preparo.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { autorizacaoDoExame } from '../regras/autorizacao';
import { agendaDoExame } from '../regras/agenda';
import { norm } from '../regras/contexto';

export function Exames() {
  const b = useBase();
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const mods = [...new Set(b.exames.map((e) => e.modalidade))].sort();
  const lista = useMemo(() => {
    const p = norm(q).split(/\s+/).filter(Boolean);
    return b.exames.filter((e) => (!mod || e.modalidade === mod) && p.every((x) => norm(`${e.nome} ${e.tuss ?? ''}`).includes(x))).slice(0, 200);
  }, [b, q, mod]);
  const e = sel ? b.exames.find((x) => x.id === sel) : null;
  const porConv = useMemo(() => (e ? b.convenios.filter((c) => c.tem_regras).map((c) => ({ c, a: autorizacaoDoExame(b, c.slug, e) })) : []), [b, e]);
  const ag = e ? agendaDoExame(b, e) : null;

  return (
    <>
      <TituloPagina titulo={e ? e.nome : 'Exames'} sub={e ? `TUSS ${e.tuss ?? '—'} · ${e.modalidade}` : `${b.exames.length} exames no catálogo (TUSS). Escolha um para ver como ele fica em cada convênio.`}>
        {e && <button type="button" className="btn2 ic" onClick={() => setSel(null)} title="Voltar para a lista" aria-label="Voltar para a lista"><Icone n="volta" /></button>}
      </TituloPagina>
      {!e && <>
        <div className="barra">
          <label className="cp f" style={{ flex: '2 1 320px' }}><span>Buscar</span><Icone n="busca" /><input type="search" value={q} onChange={(x) => setQ(x.target.value)} placeholder="Nome ou código TUSS…" /></label>
          <label className="cp" style={{ flex: '0 1 220px' }}><span>Modalidade</span><select value={mod} onChange={(x) => setMod(x.target.value)}><option value="">Todas</option>{mods.map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <Bloco titulo={`${lista.length}${lista.length === 200 ? '+' : ''} exames`}>
          <table className="tab"><thead><tr><th>TUSS</th><th>Exame</th><th>Modalidade</th></tr></thead>
            <tbody>{lista.map((x) => <tr key={x.id} className="clic" onClick={() => setSel(x.id)}><td className="cod">{x.tuss ?? '—'}</td><td>{x.nome}</td><td className="mut">{x.modalidade}</td></tr>)}</tbody></table>
        </Bloco>
      </>}
      {e && ag && <div className="grade2">
        <Bloco titulo="Em cada convênio">
          <table className="tab"><thead><tr><th>Convênio</th><th>Código</th><th>Cobertura</th><th>Regras</th></tr></thead>
            <tbody>{porConv.map(({ c, a }) => (
              <tr key={c.slug}><td><Link to={`/consultar?convenio=${c.slug}&exame=${e.id}`}>{c.nome}</Link></td>
                <td>{a.codigos.length ? a.codigos.map((x) => <div key={x.codigo} className="cod">{x.codigo}</div>) : <span className="mut">—</span>}</td>
                <td className={a.cobertura === 'sem_informacao' ? 'mut' : ''}>{a.coberturaTexto}</td><td>{a.regras.length ? a.regras.map((r) => <div key={r.id} className="mini">• {r.texto}</div>) : <span className="mut">—</span>}</td></tr>
            ))}</tbody></table>
        </Bloco>
        <div className="pilha">
          <Bloco titulo="Máquinas"><div className="pad">{ag.maquinas.length ? ag.maquinas.map((m, i) => <div key={i}>{m.maquina}: {m.exameNaMaquina}{m.horarios ? ` · ${m.horarios} horário(s)` : ''}</div>) : <span className="mut">Nenhuma máquina cadastrada.</span>}</div></Bloco>
          <Bloco titulo="Médicos (US)"><div className="pad">{ag.medicos.length ? ag.medicos.map((m) => <div key={m.medico}>{m.medico}</div>) : <span className="mut">—</span>}</div></Bloco>
          <Bloco titulo="Preparo">{ag.preparos.length ? <div className="pad">{ag.preparos.map((p) => <details key={p.id}><summary>{p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}</div> : <Vazio>Sem preparo cadastrado.</Vazio>}</Bloco>
        </div>
      </div>}
    </>
  );
}
