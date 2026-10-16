// Convênios (igual ao protótipo): cartões dos convênios com regras e, ao tocar, o resumo do convênio ao lado.
// Convênio sem regras não vira cartão: aparece numa linha só ("pedido vem autorizado").
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { regrasDoConvenio, norm } from '../regras/contexto';
import { regrasGerais } from '../regras/pedido';
import type { Convenio } from '../tipos/modelos';

const NOME_GRUPO: Record<string, string> = { cardiaco: 'Exames cardíacos', articulacao: 'Articulações' };
export const sigla = (n: string) => { const p = n.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').filter((x) => x.length > 2 || /^[A-Z]/.test(x)); return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] ?? n).slice(0, 2)).toUpperCase(); };
/** Convênio com alguma informação cadastrada (regra ou prazo). Sem nada, ele só aparece como "pedido vem autorizado". */
export const temInfo = (b: ReturnType<typeof useBase>, c: Convenio) => c.tem_regras && (regrasDoConvenio(b, c.slug).some((r) => r.molde !== 'INFO') || b.prazos.some((p) => p.convenio_id === c.id));
/** Logo do convênio: usa public/logos/<slug>.png quando o arquivo existe; senão, a sigla colorida. */
export function LogoConvenio({ c, tam = 44, comNome }: { c: Convenio; tam?: number; comNome?: boolean }) {
  const [falhou, setFalhou] = useState(false);
  if (!falhou) return <img src={`./logos/${c.slug}.png`} alt={c.nome} onError={() => setFalhou(true)} style={{ width: tam * 2.6, height: tam, objectFit: 'contain', flex: 'none' }} />;
  const sg = <span style={{ width: tam, height: tam, borderRadius: 10, background: c.cor ?? '#64748b', color: '#fff', display: 'inline-grid', placeItems: 'center', fontWeight: 800, fontSize: tam * 0.32, flex: 'none' }}>{sigla(c.nome)}</span>;
  return comNome ? <span className="logo-sigla-nome">{sg}<span>{c.nome}</span></span> : sg;
}

export function Convenios() {
  const b = useBase();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState('');
  const sel = b.convenios.find((x) => x.slug === params.get('c'));
  const todos = b.convenios.filter((c) => norm(c.nome).includes(norm(filtro))).sort((a, c) => Number(temInfo(b, c)) === Number(temInfo(b, a)) ? a.nome.localeCompare(c.nome) : Number(temInfo(b, c)) - Number(temInfo(b, a)));
  const prazos = (c: Convenio) => b.prazos.filter((p) => p.convenio_id === c.id);
  const agendarCom = (c: Convenio) => {
    const d = prazos(c).filter((p) => p.tipo === 'agendamento' && p.dias).map((p) => p.dias as number);
    if (!d.length) return '—';
    const [mi, ma] = [Math.min(...d), Math.max(...d)];
    return `${mi === ma ? mi : `${mi} a ${ma}`} dias úteis`;
  };
  const g = sel ? regrasGerais(b, sel.slug) : null;
  const cob = sel ? regrasDoConvenio(b, sel.slug).filter((r) => r.molde === 'M13' && r.situacao === 'confirmada') : [];
  const NEG = ['sem_cobertura', 'nao_autoriza', 'nao_aceito_no_contrato'];
  /** Nome do exame em linguagem de atendente (sem sigla técnica). */
  const nomeAlvo = (t: string) => (/^todos$/i.test(t.trim()) ? 'Qualquer exame' : t
    .replace(/\bAngio-TC\b/gi, 'Angiotomografia').replace(/\bAngio-RM\b/gi, 'Angiorressonância')
    .replace(/\bMMII\b/g, 'membros inferiores').replace(/\bMMSS\b/g, 'membros superiores').replace(/\bRM\b/g, 'Ressonância').replace(/\bTC\b/g, 'Tomografia')
    .replace(/\bDUT\b/g, 'diretriz da ANS (DUT)').replace(/\//g, ' / '));
  const naoCobre = [...new Set(cob.filter((r) => NEG.includes(String(r.campos.cobertura))).map((r) => nomeAlvo(r.alvo_original)))];
  const ACAO: Record<string, string> = { consultar_faturamento: 'consulte o faturamento', consultar_contrato: 'confira o contrato do paciente', so_contrato_amb: 'só se estiver no contrato (códigos AMB)' };
  const consultarAntes = cob.filter((r) => ACAO[String(r.campos.cobertura)]).map((r) => ({ exame: nomeAlvo(r.alvo_original), acao: ACAO[String(r.campos.cobertura)] }));
  const texto2 = () => [...(naoCobre.length ? [`NÃO cobre (oferecer particular): ${naoCobre.join(', ')}`] : []), ...consultarAntes.map((x) => `${x.exame}: ${x.acao}`)];
  const pedido = g ? g.checklist.filter((x) => x.situacao === 'confirmada').map((x) => x.texto) : [];
  const texto = () => !sel ? '' : [`*${sel.nome}*`, `Autorização: ${sel.responsavel ?? '—'} · agendar com ${agendarCom(sel)}`, ...pedido.map((x) => '- ' + x), ...texto2().map((x) => '- ' + x)].join('\n');

  return (
    <>
      <TituloPagina titulo={sel ? sel.nome : 'Convênios'} sub={sel ? (temInfo(b, sel) ? `Autorização: ${sel.responsavel ?? '—'}` : 'Atendemos · o pedido vem autorizado pelo convênio') : 'Digite ou toque no logo do convênio.'}>
        {sel && <button type="button" className="btn2 ic" onClick={() => setParams({})} title="Trocar convênio" aria-label="Trocar convênio"><Icone n="volta" /></button>}
        <BotoesSaida desativado={!sel || !temInfo(b, sel)} texto={texto} />
      </TituloPagina>

      {!sel && <>
        <div className="busca-conv"><Icone n="busca" /><input type="search" autoFocus value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nome do convênio…" /></div>
        {[
          { tit: 'Com regras', sub: 'a RCC confere o pedido e pede a autorização', lista: todos.filter((c) => temInfo(b, c)) },
          { tit: 'Sem regras', sub: 'o pedido já vem autorizado pelo convênio', lista: todos.filter((c) => !temInfo(b, c)) },
        ].filter((gr) => gr.lista.length).map((gr) => (
          <section key={gr.tit} className="grupo-conv">
            <h3>{gr.tit} <span className="mut">· {gr.sub}</span></h3>
            <div className="logos-conv">
              {gr.lista.map((c) => (
                <button type="button" key={c.slug} className="logo-conv" onClick={() => setParams({ c: c.slug })} title={c.nome} aria-label={c.nome}>
                  <LogoConvenio c={c} tam={46} comNome />
                </button>
              ))}
            </div>
          </section>
        ))}
        {!todos.length && <Vazio>Nenhum convênio com “{filtro}”.</Vazio>}
      </>}

      {sel && !temInfo(b, sel) && <div className="bloco"><Vazio>A RCC atende {sel.nome}. O pedido precisa vir JÁ AUTORIZADO pelo próprio convênio.</Vazio></div>}

      {sel && g && temInfo(b, sel) && (
        <div className="conv-detalhe">
          <div className="conv-cab bloco"><LogoConvenio c={sel} tam={56} /><div><b>{sel.nome}</b><span className="mut">Autorização: {sel.responsavel ?? '—'} · agendar com {agendarCom(sel)}</span></div>
            <button type="button" className="btn-grande pri" onClick={() => nav(`/consultar?convenio=${sel.slug}`)}><Icone n="busca" />Consultar exames deste convênio</button></div>
          <div className="grade2">
            <Bloco titulo="Prazos">
              <table className="tab"><tbody>
                {prazos(sel).filter((p) => p.tipo === 'agendamento').map((p, k) => <tr key={k}><td>{p.grupo ? (NOME_GRUPO[p.grupo] ?? p.grupo) + (p.qtd_minima ? ` (${p.qtd_minima} ou mais)` : '') : 'Demais exames'}</td><td style={{ textAlign: 'right' }}><b>{p.dias ? `${p.dias} dias ${p.contagem === 'uteis' ? 'úteis' : 'corridos'}` : '—'}</b></td></tr>)}
                <tr><td>Pedido médico vale</td><td style={{ textAlign: 'right' }}><b>{g.validadePedidoDias ? `${g.validadePedidoDias} dias corridos` : g.pedidoSemPrazo ? 'sem prazo' : '—'}</b></td></tr>
                <tr><td>Autorização vale</td><td style={{ textAlign: 'right' }}><b>{g.validadeAutorizacaoDias ? `${g.validadeAutorizacaoDias} dias corridos` : '—'}</b></td></tr>
              </tbody></table>
            </Bloco>
            <Bloco titulo="O pedido médico precisa ter">
              <ul className="checks">{pedido.map((x) => {
                // médico solicitante: "Aceita" e "Não aceita" cada um na sua linha
                const m = x.match(/^Médico solicitante:\s*(.*)$/);
                if (!m) return <li key={x}><span className="bx" /><span>{x}</span></li>;
                const partes = m[1].split(' · ');
                const sim = partes.find((p) => /^aceita/i.test(p))?.replace(/^aceita\s*/i, '');
                const nao = partes.find((p) => /^n[ãa]o aceita/i.test(p))?.replace(/^n[ãa]o aceita\s*/i, '');
                return <li key={x}><span className="bx" /><span>Médico solicitante{sim && <><br />Aceita: {sim}</>}{nao && <><br />Não aceita: {nao}</>}</span></li>;
              })}</ul>
              {(g.portal || g.guiaPdf) && <div className="pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {g.portal && <a className="btn2" href={g.portal.url} target="_blank" rel="noopener noreferrer"><Icone n="link" />{g.portal.rotulo}</a>}
                {g.guiaPdf && <a className="btn2" href={'./' + g.guiaPdf} target="_blank" rel="noopener noreferrer"><Icone n="arquivo" />Guia SP/SADT</a>}</div>}
            </Bloco>
          </div>
          {(naoCobre.length > 0 || consultarAntes.length > 0) && <div className="grade2">
            {naoCobre.length > 0 && <Bloco titulo={`Exames que ${sel.nome} NÃO cobre`} extra={<span className="mut" style={{ fontSize: 13 }}>ofereça particular</span>}>
              <ul className="lista-simples nao">{naoCobre.map((x) => <li key={x}>{x}</li>)}</ul></Bloco>}
            {consultarAntes.length > 0 && <Bloco titulo="Antes de agendar, confira">
              <ul className="lista-simples">{consultarAntes.map((x) => <li key={x.exame + x.acao}><b>{x.exame}</b>: {x.acao}</li>)}</ul></Bloco>}
          </div>}
        </div>
      )}
    </>
  );
}
