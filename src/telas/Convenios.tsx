// Convênios: cartões com a "logo" (iniciais na cor do convênio) e, ao escolher, todas as regras dele organizadas por molde.
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TagSituacao, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { frase } from '../regras/frase';
import { regrasDoConvenio, norm } from '../regras/contexto';
import { regrasGerais } from '../regras/pedido';

const ABAS = ['Pedido e prazos', 'Regras por tipo', 'Códigos', 'Planos'] as const;

export function Convenios() {
  const b = useBase();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const sel = params.get('c') ?? '';
  const [filtro, setFiltro] = useState('');
  const [aba, setAba] = useState<(typeof ABAS)[number]>('Pedido e prazos');
  const [qCod, setQCod] = useState('');
  const c = b.convenios.find((x) => x.slug === sel);
  const lista = b.convenios.filter((x) => norm(x.nome).includes(norm(filtro))).sort((a, x) => Number(x.tem_regras) - Number(a.tem_regras) || a.nome.localeCompare(x.nome));

  const dados = useMemo(() => {
    if (!c) return null;
    const g = regrasGerais(b, c.slug);
    const regras = regrasDoConvenio(b, c.slug);
    const porMolde = new Map<string, typeof regras>();
    for (const r of regras) { const k = r.molde_nome; porMolde.set(k, [...(porMolde.get(k) ?? []), r]); }
    return { g, regras, porMolde, prazos: b.prazos.filter((p) => p.convenio_id === c.id), codigos: b.codigos.filter((x) => x.convenio_id === c.id),
      planos: b.planos.filter((p) => p.convenio_id === c.id) };
  }, [b, c]);

  const texto = () => !c || !dados ? '' : [`*${c.nome}* — responsável: ${c.responsavel ?? 'o próprio convênio'}`, ...dados.g.checklist.map((x) => '- ' + x.texto),
    ...dados.regras.filter((r) => r.situacao !== 'substituida').map((r) => `- ${frase(b, r)}`)].join('\n');

  return (
    <>
      <TituloPagina titulo={c ? c.nome : 'Convênios'} sub={c ? `Responsável pela autorização: ${c.responsavel ?? 'o próprio convênio (pedido vem autorizado)'}` : 'Escolha um convênio para ver todas as regras dele.'}>
        {c && <button type="button" className="btn2 ic" onClick={() => setParams({})} title="Voltar para a lista" aria-label="Voltar para a lista"><Icone n="volta" /></button>}
        {c && <button type="button" className="btn2 ic" onClick={() => nav(`/consultar?convenio=${c.slug}`)} title="Consultar exame neste convênio" aria-label="Consultar exame neste convênio"><Icone n="busca" /></button>}
        <BotoesSaida desativado={!c} texto={texto} />
      </TituloPagina>

      {!c && <>
        <div className="barra"><label className="cp f" style={{ flex: '1 1 300px' }}><span>Buscar convênio</span><Icone n="busca" /><input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nome do convênio…" /></label></div>
        <div className="cards-conv">
          {lista.map((x) => {
            const cfg = b.config.find((y) => y.convenio_id === x.id);
            return (
              <button type="button" key={x.slug} className="card-conv" onClick={() => setParams({ c: x.slug })}>
                <div className="logo"><span style={{ background: x.cor ?? '#64748b', color: '#fff' }}>{x.nome.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').map((p) => p[0]).join('').slice(0, 3).toUpperCase()}</span></div>
                <div className="nome">{x.nome}</div>
                <div className="ln"><span>Autorização</span><b>{x.tem_regras ? x.responsavel : 'pelo convênio'}</b></div>
                <div className="ln"><span>Pedido vale</span><b>{cfg?.validade_pedido_dias ? `${cfg.validade_pedido_dias} dias` : x.tem_regras ? '—' : ''}</b></div>
              </button>
            );
          })}
        </div>
      </>}

      {c && dados && <>
        <div className="abas nao-imprimir">{ABAS.map((a) => <button type="button" key={a} className={aba === a ? 'on' : ''} onClick={() => setAba(a)}>{a}</button>)}</div>
        {!c.tem_regras && <div className="bloco"><Vazio>Este convênio não tem regras na RCC: o pedido precisa vir AUTORIZADO pelo próprio convênio.</Vazio></div>}

        {aba === 'Pedido e prazos' && c.tem_regras && <div className="grade2">
          <div className="pilha">
            <Bloco titulo="Prazos de agendamento">
              <table className="tab"><thead><tr><th>Grupo</th><th>Tipo</th><th>Dias</th><th>Observação</th></tr></thead>
                <tbody>{dados.prazos.map((p, i) => <tr key={i}><td>{p.grupo ?? 'padrão'}{p.qtd_minima ? ` (${p.qtd_minima}+)` : ''}</td><td>{p.tipo}</td><td>{p.dias ?? '—'} {p.dias ? (p.contagem === 'uteis' ? 'úteis' : 'corridos') : ''}</td><td className="mut">{p.observacao ?? ''}</td></tr>)}</tbody></table>
            </Bloco>
            <Bloco titulo="Canal de autorização">
              <div className="pad">
                {dados.g.portal ? <a className="btn2" href={dados.g.portal.url} target="_blank" rel="noopener noreferrer"><Icone n="link" />{dados.g.portal.rotulo}</a> : <span className="mut">Sem portal cadastrado.</span>}
                {dados.g.guiaPdf && <> <a className="btn2" href={'./' + dados.g.guiaPdf} target="_blank" rel="noopener noreferrer"><Icone n="arquivo" />Guia SP/SADT</a></>}
              </div>
            </Bloco>
          </div>
          <Bloco titulo="O pedido médico precisa ter">
            <ul className="checks">{dados.g.checklist.map((x, i) => <li key={i} className={x.forte ? 'forte' : ''}><span className="bx" /><span>{x.texto} {x.situacao !== 'confirmada' && <TagSituacao s={x.situacao} />}</span></li>)}</ul>
          </Bloco>
        </div>}

        {aba === 'Regras por tipo' && <div className="blocos">
          {[...dados.porMolde.entries()].map(([molde, rs]) => (
            <Bloco key={molde} titulo={molde} extra={<span className="mut" style={{ fontSize: 12 }}>{rs.length}</span>}>
              <table className="tab"><tbody>{rs.map((r) => (
                <tr key={r.id}><td style={{ width: 90 }} className="cod">{r.id}</td>
                  <td>{frase(b, r)}{r.segue_padrao && <span className="mini"> · segue o padrão {r.segue_padrao}</span>}<div className="orig">fonte: “{r.texto_original}”{r.resposta ? ` · resposta: ${r.resposta}` : ''}</div></td>
                  <td style={{ width: 130 }}><TagSituacao s={r.situacao} /></td></tr>
              ))}</tbody></table>
            </Bloco>
          ))}
        </div>}

        {aba === 'Códigos' && <Bloco titulo={`Tabela de códigos (${dados.codigos.length})`} extra={<input type="search" placeholder="Buscar código ou nome…" value={qCod} onChange={(e) => setQCod(e.target.value)} style={{ maxWidth: 280, height: 32 }} />}>
          {dados.codigos.length ? <table className="tab"><thead><tr><th>Código</th><th>Nome no convênio</th><th>Tipo</th><th>Situação</th><th>Exame do catálogo</th></tr></thead>
            <tbody>{dados.codigos.filter((x) => norm(x.codigo + ' ' + x.nome_no_convenio).includes(norm(qCod))).map((x) => {
              const e = x.exame_id ? b.exames.find((y) => y.id === x.exame_id) : null;
              return <tr key={x.id}><td className="cod">{x.codigo}</td><td>{x.nome_no_convenio}{x.observacao && <div className="orig">{x.observacao}</div>}</td><td>{x.tipo}</td>
                <td>{x.status === 'ativo' ? 'ativo' : <span className="tag t-no">{x.status.replace('_', ' ')}</span>}</td>
                <td>{e ? e.nome : <span className="mut">{x.motivo_sem_vinculo ?? '—'}</span>}</td></tr>;
            })}</tbody></table> : <Vazio>Sem tabela de códigos cadastrada para este convênio.</Vazio>}
        </Bloco>}

        {aba === 'Planos' && <Bloco titulo="Planos e redes">
          {dados.planos.length ? <table className="tab"><thead><tr><th>Plano / rede</th><th>Atende</th><th>Origem</th></tr></thead>
            <tbody>{dados.planos.map((p) => <tr key={p.nome}><td>{p.nome}</td><td>{p.atende === true ? 'Sim' : p.atende === false ? <span className="tag t-no">Não atende</span> : <TagSituacao s="a_confirmar" />}</td><td className="mut">{p.origem}</td></tr>)}</tbody></table>
            : <Vazio>Sem restrição de plano cadastrada.</Vazio>}
        </Bloco>}
      </>}
    </>
  );
}
