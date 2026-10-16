// Exames: só aparece algo depois da busca (pelo nome falado). Escolhido o exame: código em cada convênio, onde fazer, preço e preparo.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { buscarExames, precoDoExame, type Achado } from '../regras/busca';
import { agendaDoExame } from '../regras/agenda';
import { ondeTexto } from '../componentes/ResultadoView';
import { brl, tussTexto } from '../util/formato';
import { parcelas } from './Orcamento';
import { LogoConvenio } from './Convenios';
import { Copiar } from '../componentes/Copiar';

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
  // igual à página Convênios: ao digitar já abre o primeiro exame achado; os outros ficam como opção logo acima
  const atual = sel ?? achados[0] ?? null;
  const e = atual?.exame;
  const ag = e ? agendaDoExame(b, e) : null;
  const part = e ? precoDoExame(b, e, 1, atual?.rotulo) : null;
  const remido = e ? precoDoExame(b, e, 2, atual?.rotulo) : null;
  // códigos ativos agrupados por convênio (um convênio pode ter mais de um código)
  const porConvenio = e ? b.convenios.map((cv) => ({ cv, cods: b.codigos.filter((c) => c.exame_id === e.id && c.convenio_id === cv.id && c.status === 'ativo') }))
    .filter((x) => x.cods.length).sort((x, y) => x.cv.nome.localeCompare(y.cv.nome)) : [];

  return (
    <>
      <TituloPagina titulo="Exames" sub="Digite o exame do jeito que o paciente falou." />
      <div className="busca-conv"><Icone n="busca" /><input type="search" autoFocus value={q} onChange={(x) => { setQ(x.target.value); setSel(null); }} placeholder="Nome do exame… (ex.: resso joelho)" /></div>
      {!q.trim() ? <div className="bloco"><Vazio>Digite o exame. Ex.: “resso joelho”.</Vazio></div> : !achados.length || !e || !ag ? <div className="bloco"><Vazio>Nenhum exame encontrado para “{q}”.</Vazio></div> : (
        <div className="conv-detalhe">
          {achados.length > 1 && <div className="outros-exames"><span className="mut">Também encontrado:</span>
            {achados.map((a) => <button type="button" key={a.exame.id} className={'pilula' + (a.exame.id === e.id ? ' on' : '')} onClick={() => setSel(a)}>{a.rotulo}</button>)}</div>}
          <div className="conv-cab bloco exame-cab"><div><b>{atual!.rotulo}</b><span className="mut">{atual!.rotulo !== e.nome ? e.nome + ' · ' : ''}{tussTexto(e)}</span></div></div>
          <div className="grade2">
            <div className="coluna">
              <Bloco titulo="Código para autorizar em cada convênio" extra={<span className="mut" style={{ fontSize: 12 }}>{porConvenio.length} convênio{porConvenio.length === 1 ? '' : 's'}</span>}>
                {porConvenio.length ? <div className="pad-l">{porConvenio.map(({ cv, cods }) => (
                  <div key={cv.id} className="cod-conv">
                    <Link to={`/consultar?convenio=${cv.slug}&exame=${e.id}`} className="cod-conv-nome" title="Abrir a consulta deste convênio"><LogoConvenio c={cv} tam={22} /><span>{cv.nome}</span></Link>
                    <span className="codigos">{cods.map((c) => <span key={c.id} className="cod-item"><Copiar codigo={c.codigo} />{c.tipo === 'PACOTE' ? <small className="mut">pacote</small> : c.tipo === 'AMB' ? <small className="mut">AMB</small> : null}</span>)}</span>
                  </div>
                ))}</div> : <Vazio>Nenhum convênio tem código próprio cadastrado: autorizar pelo {tussTexto(e).toLowerCase()}.</Vazio>}
              </Bloco>
            </div>
            <div className="coluna">
              <Bloco titulo="Onde e quanto tempo"><div className="pad">{ondeTexto({ agenda: ag })}{ag.maquinas[0] && <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Peso máximo {ag.maquinas[0].pesoMaxKg} kg</div>}</div></Bloco>
              <Bloco titulo="Particular"><div className="pad">{part ? <><b style={{ fontSize: 20 }}>{brl(part.valor)}</b> · até {parcelas(part.valor)}x
                <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>PIX ou dinheiro: {brl(part.valor * 0.95)}{remido ? ` · Sócio Remido: ${brl(remido.valor)}` : ''}</div></> : <span className="mut">Sem preço particular cadastrado para este exame.</span>}</div></Bloco>
              <Bloco titulo="Preparo">{ag.preparos.length ? <div className="pad">{ag.preparos.map((p) => <div key={p.id} style={{ marginBottom: 8 }}><b>{p.titulo.replace(/^Preparo\s*[—-]\s*/i, '')}</b><div className="preparo-txt">{p.texto}</div></div>)}</div> : <Vazio>Sem preparo.</Vazio>}</Bloco>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
