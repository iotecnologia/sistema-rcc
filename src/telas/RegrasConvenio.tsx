// Regras do convênio para quem atende: escolhe o convênio e lê em linguagem simples. Sem códigos de regra, sem termo técnico.
import { useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { regrasGerais } from '../regras/pedido';

export function RegrasConvenio() {
  const b = useBase();
  const [slug, setSlug] = useState('');
  const c = b.convenios.find((x) => x.slug === slug);
  const g = c ? regrasGerais(b, c.slug) : null;
  const resp = c?.responsavel ?? 'o próprio convênio';
  const pedido = g ? g.checklist.filter((x) => x.situacao === 'confirmada').map((x) => x.texto) : [];
  const confirmar = g ? g.checklist.filter((x) => x.situacao !== 'confirmada').map((x) => x.texto) : [];
  const regras = g ? g.itens.filter((x) => x.situacao === 'confirmada').map((x) => x.texto).filter((x) => !pedido.includes(x)) : [];
  const planos = c ? b.planos.filter((p) => p.convenio_id === c.id) : [];
  const naoAtende = planos.filter((p) => p.atende === false).map((p) => p.nome);
  const texto = () => !c ? '' : [`*${c.nome}*`, `Autorização: ${resp}`, ...pedido.map((x) => '- ' + x), ...regras.map((x) => '- ' + x),
    ...(naoAtende.length ? ['Não atende: ' + naoAtende.join(', ')] : [])].join('\n');
  const relatorio = () => ({ titulo: `Regras do convênio ${c!.nome}`, secoes: [
    { linhas: [['Autorização', resp]] as [string, string][] },
    ...(pedido.length ? [{ titulo: 'O pedido médico precisa ter', linhas: pedido.map((x) => [x] as [string]) }] : []),
    ...(regras.length ? [{ titulo: 'Regras', linhas: regras.map((x) => [x] as [string]) }] : []),
    ...(naoAtende.length ? [{ titulo: 'Planos que a RCC NÃO atende', linhas: naoAtende.map((x) => [x] as [string]) }] : []),
  ] });

  return (
    <>
      <TituloPagina titulo={c ? c.nome : 'Regras do convênio'} sub={c ? `Autorização: ${resp}` : 'Escolha o convênio do paciente.'}>
        {c && <button type="button" className="btn2" onClick={() => setSlug('')}>Trocar convênio</button>}
        <BotoesSaida desativado={!c} texto={texto} relatorio={relatorio} />
      </TituloPagina>
      {!c && <div className="opcoes">
        {[...b.convenios].sort((a, x) => a.nome.localeCompare(x.nome)).map((x) => (
          <button type="button" key={x.slug} className="opcao" onClick={() => setSlug(x.slug)}>
            <span className="sg" style={{ background: x.cor ?? '#64748b', color: '#fff' }}>{x.nome.slice(0, 2).toUpperCase()}</span>{x.nome}
          </button>
        ))}
      </div>}
      {c && !c.tem_regras && <Bloco titulo="Atenção"><Vazio>A RCC não tem regras deste convênio: o pedido precisa vir JÁ AUTORIZADO pelo convênio.</Vazio></Bloco>}
      {c && c.tem_regras && g && <div className="blocos">
        {confirmar.length > 0 && <div className="res-bloco"><h3>Confirme com {resp}</h3><ul>{confirmar.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <div className="res-bloco"><h3>O pedido médico precisa ter</h3>{pedido.length ? <ul>{pedido.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="mini">Nada cadastrado.</p>}
          {(g.portal || g.guiaPdf) && <div className="res-links">
            {g.portal && <a className="btn2" href={g.portal.url} target="_blank" rel="noopener noreferrer">{g.portal.rotulo}</a>}
            {g.guiaPdf && <a className="btn2" href={'./' + g.guiaPdf} target="_blank" rel="noopener noreferrer">Guia SP/SADT</a>}
          </div>}
        </div>
        {regras.length > 0 && <div className="res-bloco"><h3>Regras</h3><ul>{regras.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        {planos.length > 0 && <div className="res-bloco"><h3>Planos</h3>
          {naoAtende.length ? <p>A RCC <b>NÃO</b> atende: {naoAtende.join(', ')}.</p> : <p>A RCC atende todos os planos cadastrados.</p>}</div>}
      </div>}
    </>
  );
}
