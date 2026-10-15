// Exames: só aparece algo depois da busca (pelo nome falado). Escolhido o exame: código em cada convênio, onde fazer, preço e preparo.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { buscarExames, precoDoExame, type Achado } from '../regras/busca';
import { agendaDoExame } from '../regras/agenda';
import { ondeTexto } from '../componentes/ResultadoView';
import { brl } from '../util/formato';
import { parcelas } from './Orcamento';

export function Exames() {
  const b = useBase();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Achado | null>(null);
  const [params] = useSearchParams();
  // veio da busca geral do cabeçalho: já abre o exame escolhido
  useEffect(() => {
    const ex = b.exames.find((x) => x.id === Number(params.get('id')));
    if (!ex) return;
    const rot = params.get('rotulo') ?? ex.nome;
    setQ(rot); setSel({ exame: ex, rotulo: rot });
  }, [b, params]);
  const achados = useMemo(() => buscarExames(b, q, 12), [b, q]);
  const e = sel?.exame;
  const codigos = e ? b.codigos.filter((c) => c.exame_id === e.id) : [];
  const ag = e ? agendaDoExame(b, e) : null;
  const part = e ? precoDoExame(b, e, 1, sel?.rotulo) : null;
  const remido = e ? precoDoExame(b, e, 2, sel?.rotulo) : null;
  const conv = (id: number) => b.convenios.find((c) => c.id === id);

  return (
    <>
      <TituloPagina titulo="Exames" sub="Busque o exame do jeito que o paciente falou. Nada aparece antes da busca." />
      <div className="barra"><label className="cp f" style={{ flex: '1 1 360px' }}><span>Buscar exame</span><Icone n="busca" />
        <input type="search" autoFocus value={q} onChange={(x) => { setQ(x.target.value); setSel(null); }} placeholder="ex.: resso joelho, tomo de tórax, ultrassom abdome" /></label></div>
      {!q.trim() ? <div className="bloco"><Vazio>Digite o exame. Ex.: “resso joelho”.</Vazio></div> : !achados.length ? <div className="bloco"><Vazio>Nenhum exame encontrado para “{q}”.</Vazio></div> : (
        <div className="grade2">
          <div className="pilha">
            <Bloco titulo="Encontrado" extra={<span className="mut" style={{ fontSize: 12 }}>{achados.length} exame{achados.length > 1 ? 's' : ''}</span>}>
              <table className="tab"><tbody>{achados.map((a) => (
                <tr key={a.exame.id} className="clic" onClick={() => setSel(a)} style={sel?.exame.id === a.exame.id ? { background: 'var(--hover)' } : undefined}>
                  <td><b>{a.rotulo}</b><div className="mut" style={{ fontSize: 12 }}>{a.rotulo !== a.exame.nome ? a.exame.nome + ' · ' : ''}TUSS {a.exame.tuss ?? '—'}</div></td>
                </tr>
              ))}</tbody></table>
            </Bloco>
            {e && <Bloco titulo="Código em cada convênio">
              {codigos.length ? <table className="tab"><thead><tr><th>Convênio</th><th>Código para autorizar</th></tr></thead>
                <tbody>{codigos.map((c) => { const cv = conv(c.convenio_id); return (
                  <tr key={c.id}><td><Link to={`/consultar?convenio=${cv?.slug}&exame=${e.id}`}>{cv?.nome}</Link></td><td><span className="cod">{c.codigo}</span>{c.tipo === 'PACOTE' ? <span className="mut"> · pacote</span> : c.tipo === 'AMB' ? <span className="mut"> · AMB</span> : null}</td></tr>
                ); })}</tbody></table> : <Vazio>Nenhum convênio tem código próprio cadastrado: autorizar pelo TUSS {e.tuss ?? ''}.</Vazio>}
            </Bloco>}
          </div>
          {e && ag ? <div className="pilha">
            <Bloco titulo="Onde e quanto tempo"><div className="pad">{ondeTexto({ agenda: ag })}{ag.maquinas[0] && <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Peso máximo {ag.maquinas[0].pesoMaxKg} kg</div>}</div></Bloco>
            <Bloco titulo="Particular"><div className="pad">{part ? <><b style={{ fontSize: 20 }}>{brl(part.valor)}</b> · até {parcelas(part.valor)}x
              <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>PIX ou dinheiro: {brl(part.valor * 0.95)}{remido ? ` · Sócio Remido: ${brl(remido.valor)}` : ''}</div></> : <span className="mut">Sem preço particular cadastrado para este exame.</span>}</div></Bloco>
            <Bloco titulo="Preparo">{ag.preparos.length ? <div className="pad">{ag.preparos.map((p) => <details key={p.id}><summary>{p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}</div> : <Vazio>Sem preparo.</Vazio>}</Bloco>
          </div> : <div className="bloco"><Vazio>Clique no exame para ver o código em cada convênio, onde fazer, o preço e o preparo.</Vazio></div>}
        </div>
      )}
    </>
  );
}
