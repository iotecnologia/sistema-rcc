// Convênios (igual ao protótipo): cartões dos convênios com regras e, ao tocar, o resumo do convênio ao lado.
// Convênio sem regras não vira cartão: aparece numa linha só ("pedido vem autorizado").
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { regrasDoConvenio, norm } from '../regras/contexto';
import { regrasGerais } from '../regras/pedido';
import { frase } from '../regras/frase';
import type { Convenio } from '../tipos/modelos';

const NOME_GRUPO: Record<string, string> = { cardiaco: 'Exames cardíacos', articulacao: 'Articulações' };
export const sigla = (n: string) => { const p = n.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').filter((x) => x.length > 2 || /^[A-Z]/.test(x)); return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] ?? n).slice(0, 2)).toUpperCase(); };
/** Convênio com alguma informação cadastrada (regra ou prazo). Sem nada, ele só aparece como "pedido vem autorizado". */
export const temInfo = (b: ReturnType<typeof useBase>, c: Convenio) => c.tem_regras && (regrasDoConvenio(b, c.slug).length > 0 || b.prazos.some((p) => p.convenio_id === c.id));
export function LogoConvenio({ c, tam = 44 }: { c: Convenio; tam?: number }) {
  return <span style={{ width: tam, height: tam, borderRadius: 10, background: c.cor ?? '#64748b', color: '#fff', display: 'inline-grid', placeItems: 'center', fontWeight: 800, fontSize: tam * 0.32, flex: 'none' }}>{sigla(c.nome)}</span>;
}

export function Convenios() {
  const b = useBase();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState('');
  const sel = b.convenios.find((x) => x.slug === params.get('c'));
  const comRegras = b.convenios.filter((c) => temInfo(b, c) && norm(c.nome).includes(norm(filtro))).sort((a, c) => a.nome.localeCompare(c.nome));
  const semRegras = b.convenios.filter((c) => !temInfo(b, c)).map((c) => c.nome).sort((a, c) => a.localeCompare(c));
  const prazos = (c: Convenio) => b.prazos.filter((p) => p.convenio_id === c.id);
  const cfg = (c: Convenio) => b.config.find((x) => x.convenio_id === c.id);
  const agendarCom = (c: Convenio) => {
    const d = prazos(c).filter((p) => p.tipo === 'agendamento' && p.dias).map((p) => p.dias as number);
    if (!d.length) return '—';
    const [mi, ma] = [Math.min(...d), Math.max(...d)];
    return `${mi === ma ? mi : `${mi} a ${ma}`} dias úteis`;
  };
  const g = sel ? regrasGerais(b, sel.slug) : null;
  const naoCobre = sel ? regrasDoConvenio(b, sel.slug).filter((r) => r.molde === 'M13' && r.situacao === 'confirmada').map((r) => frase(b, r)) : [];
  const pedido = g ? g.checklist.filter((x) => x.situacao === 'confirmada').map((x) => x.texto) : [];
  const texto = () => !sel ? '' : [`*${sel.nome}*`, `Autorização: ${sel.responsavel ?? '—'} · agendar com ${agendarCom(sel)}`, ...pedido.map((x) => '- ' + x), ...naoCobre.map((x) => '- Não cobre: ' + x)].join('\n');

  return (
    <>
      <TituloPagina titulo="Convênios" sub="Toque no convênio para ver as regras gerais">
        <BotoesSaida desativado={!sel} texto={texto} />
      </TituloPagina>
      <div className="barra">
        <label className="cp f" style={{ flex: '1 1 320px' }}><span>Buscar</span><Icone n="busca" /><input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nome do convênio" /></label>
        <span className="mut" style={{ fontSize: 12, paddingBottom: 10 }}>{comRegras.length} convênios com regras</span>
      </div>
      <div className="bloco pad" style={{ marginBottom: 14, fontSize: 14 }}><b>Também atendemos — o pedido precisa vir JÁ AUTORIZADO pelo convênio:</b> {semRegras.join(' · ')}</div>
      <div className="grade2">
        <div className="cards-conv">
          {comRegras.map((c) => (
            <button type="button" key={c.slug} className={'card-conv' + (sel?.slug === c.slug ? ' sel' : '')} onClick={() => setParams({ c: c.slug })}>
              <span className="logo"><LogoConvenio c={c} /></span>
              <span className="nome">{c.nome}</span>
              <span className="ln"><span>Agendar com</span><b>{agendarCom(c)}</b></span>
              <span className="ln"><span>Pedido vale</span><b>{cfg(c)?.validade_pedido_dias ? `${cfg(c)!.validade_pedido_dias} dias` : '—'}</b></span>
              <span className="ln"><span>Autorização</span><b>{c.responsavel ?? '—'}</b></span>
            </button>
          ))}
        </div>
        {sel && g ? (
          <div className="pilha">
            <Bloco titulo={sel.nome} extra={<LogoConvenio c={sel} tam={30} />}>
              <table className="tab"><thead><tr><th colSpan={2}>Prazos</th></tr></thead><tbody>
                {prazos(sel).filter((p) => p.tipo === 'agendamento').map((p, i) => <tr key={i}><td>{p.grupo ? (NOME_GRUPO[p.grupo] ?? p.grupo) + (p.qtd_minima ? ` (${p.qtd_minima} ou mais)` : '') : 'Demais exames'}</td><td style={{ textAlign: 'right' }}><b>{p.dias ? `${p.dias} dias ${p.contagem === 'uteis' ? 'úteis' : 'corridos'}` : '—'}</b></td></tr>)}
                <tr><td>Pedido médico vale</td><td style={{ textAlign: 'right' }}><b>{g.validadePedidoDias ? `${g.validadePedidoDias} dias corridos` : g.pedidoSemPrazo ? 'sem prazo' : '—'}</b></td></tr>
                <tr><td>Autorização vale</td><td style={{ textAlign: 'right' }}><b>{g.validadeAutorizacaoDias ? `${g.validadeAutorizacaoDias} dias corridos` : '—'}</b></td></tr>
              </tbody></table>
            </Bloco>
            <Bloco titulo="O pedido médico precisa ter">
              <ul className="checks">{pedido.map((x) => <li key={x}><span className="bx" /><span>{x}</span></li>)}</ul>
              {(g.portal || g.guiaPdf) && <div className="pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {g.portal && <a className="btn2" href={g.portal.url} target="_blank" rel="noopener noreferrer"><Icone n="link" />{g.portal.rotulo}</a>}
                {g.guiaPdf && <a className="btn2" href={'./' + g.guiaPdf} target="_blank" rel="noopener noreferrer"><Icone n="arquivo" />Guia SP/SADT</a>}</div>}
            </Bloco>
            {naoCobre.length > 0 && <Bloco titulo="Não cobre"><ul className="feed">{naoCobre.map((x) => <li key={x}><span className="tag t-no">não</span><div>{x}</div></li>)}</ul></Bloco>}
            <button type="button" className="btn-grande pri" onClick={() => nav(`/consultar?convenio=${sel.slug}`)}><Icone n="busca" />Consultar exames deste convênio</button>
          </div>
        ) : <div className="bloco"><Vazio>Toque num convênio para ver os prazos, o que o pedido precisa ter e o que ele não cobre.</Vazio></div>}
      </div>
    </>
  );
}
