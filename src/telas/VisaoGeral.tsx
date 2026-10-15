// Visão geral: saudação, avisos da equipe, consulta rápida, últimas consultas e agenda dos próximos dias.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { QuadroAvisos } from '../componentes/AvisosEquipe';
import { useAvisos } from '../acesso/Avisos';
import { ondeTexto } from '../componentes/ResultadoView';
import { consultar } from '../regras/resultado';
import { ComboConvenio } from '../componentes/ComboConvenio';
import { useSessao } from '../acesso/Sessao';
import { buscarExames } from '../regras/busca';
import { br, hojeIso, nomeDia, somarDias } from '../regras/calendario';
import { local, saudacao } from '../util/formato';

const TAG: Record<string, [string, string]> = { pode_agendar: ['t-ok', 'Pode agendar'], atencao: ['t-at', 'Atenção'], nao_pode: ['t-no', 'Não agendar'] };
interface Hist { conv: string; ex: string; quando: string; sit?: string; slug?: string; ids?: string }

export function VisaoGeral() {
  const b = useBase();
  const s = useSessao();
  const nav = useNavigate();
  const hoje = hojeIso();
  const [conv, setConv] = useState('');
  const [q, setQ] = useState('');
  const [escolhido, setEscolhido] = useState<{ id: number; rotulo: string } | null>(null);
  const [verLidos, setVerLidos] = useState(false);
  const av = useAvisos();
  const temLidos = av.visiveis.some((a) => av.leu(a.id));
  const achados = useMemo(() => (conv && !escolhido ? buscarExames(b, q, 8) : []), [b, conv, q, escolhido]);
  // prévia: o mesmo cálculo do Consultar, para 1 exame, sem data do pedido
  const previa = useMemo(() => (conv && escolhido ? consultar(b, { convenio: conv, exames: [{ exameId: escolhido.id, quantidade: 1 }], dataPedido: null, hoje }) : null), [b, conv, escolhido, hoje]);
  const hist = local.ler<Hist[]>('historico', []);
  const limite = somarDias(hoje, 30);
  const nomeMed = (id: number) => b.medicos.find((m) => m.id === id)?.nome ?? '';
  const agenda = [
    ...b.feriados.filter((f) => f.data >= hoje && f.data <= limite).map((f) => ({ data: f.data, ic: 'calendario', txt: <><b>{f.nome}</b> · a RCC atende; os convênios não contam esse dia no prazo.</> })),
    ...b.medicoAgendas.filter((a) => a.tipo === 'eventual' && a.data && a.data >= hoje && a.data <= limite).map((a) => ({ data: a.data!, ic: 'medico', txt: <><b>{nomeMed(a.medico_id)}</b> atende das {a.inicio} às {a.fim} (agenda eventual).</> })),
  ].sort((x, y) => x.data.localeCompare(y.data));
  const recorrentes = b.medicoAgendas.filter((a) => a.tipo === 'recorrente');
  const dataLonga = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <TituloPagina titulo={`${saudacao()}, ${s.usuario?.nome.split(' ')[0]}`} sub={dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}>
        {temLidos && <button type="button" className={'btn2' + (verLidos ? ' ativo' : '')} aria-pressed={verLidos} onClick={() => setVerLidos(!verLidos)}>Avisos lidos</button>}
        <Link className="btn2 pri" to="/consultar">Nova consulta</Link>
      </TituloPagina>
      <QuadroAvisos mostrarLidos={verLidos && temLidos} />

      <section className="bloco consulta-rapida" style={{ overflow: 'visible', position: 'relative', zIndex: 5 }}>
        <div className="bloco-cab"><h3>Consulta rápida</h3><span className="mut" style={{ fontSize: 12 }}>escolha o convênio e digite o exame como o paciente falou</span></div>
        <div className="barra" style={{ margin: 0, padding: '12px 16px' }}>
          <ComboConvenio valor={conv} mudar={setConv} flex="0 1 300px" />
          <label className="cp f" style={{ flex: '1 1 320px' }}><span>Exame</span><Icone n="busca" />
            <input type="search" value={q} disabled={!conv} onChange={(e) => { setQ(e.target.value); setEscolhido(null); }} placeholder={conv ? 'ex.: resso joelho, tomo de tórax' : 'Escolha o convênio primeiro'} /></label>
        </div>
        {achados.length > 0 && <div className="sugestoes" style={{ margin: '0 16px 14px' }}>{achados.map((a) => (
          <button type="button" key={a.exame.id} onClick={() => { setEscolhido({ id: a.exame.id, rotulo: a.rotulo }); setQ(a.rotulo); }}>
            <Icone n="seta" />{a.rotulo}<small>{a.rotulo !== a.exame.nome ? a.exame.nome + ' · ' : ''}TUSS {a.exame.tuss ?? '—'}</small></button>
        ))}</div>}
        {previa && escolhido && <Previa r={previa} rotulo={escolhido.rotulo}
          abrir={() => nav(`/consultar?convenio=${conv}&exame=${escolhido.id}&rotulo=${encodeURIComponent(escolhido.rotulo)}`)}
          limpar={() => { setEscolhido(null); setQ(''); }} />}
      </section>

      <div className="grade2">
        <Bloco titulo="Suas últimas consultas">
          {hist.length ? (
            <table className="tab"><thead><tr><th>Hora</th><th>Convênio</th><th>Exames</th><th>Resultado</th><th /></tr></thead>
              <tbody>{hist.map((h, i) => (
                <tr key={i}><td className="mut">{h.quando}</td><td><b>{h.conv}</b></td><td>{h.ex}</td>
                  <td>{h.sit && TAG[h.sit] ? <span className={'tag ' + TAG[h.sit][0]}>{TAG[h.sit][1]}</span> : ''}</td>
                  <td style={{ width: 44 }}>{h.slug && h.ids && <button type="button" className="btn2 ic" onClick={() => nav(`/consultar?convenio=${h.slug}&exames=${h.ids}`)} title="Abrir de novo" aria-label="Abrir de novo"><Icone n="seta" /></button>}</td></tr>
              ))}</tbody></table>
          ) : <Vazio>As consultas que você fizer aparecem aqui (só convênio e exames, nunca dado de paciente).</Vazio>}
        </Bloco>
        <Bloco titulo="Agenda dos próximos dias">
          {agenda.length || recorrentes.length ? (
            <ul className="feed">
              {agenda.map((x, i) => <li key={i}><span className="dot"><Icone n={x.ic} /></span><div><span className="mut" style={{ fontSize: 12 }}>{nomeDia(x.data)} {br(x.data).slice(0, 5)}</span><div>{x.txt}</div></div></li>)}
              {recorrentes.map((a, i) => <li key={'r' + i}><span className="dot"><Icone n="medico" /></span><div><span className="mut" style={{ fontSize: 12 }}>toda {a.dia_semana}</span><div><b>{nomeMed(a.medico_id)}</b> atende das {a.inicio} às {a.fim}.</div></div></li>)}
            </ul>
          ) : <Vazio>Nada de diferente nos próximos 30 dias.</Vazio>}
        </Bloco>
      </div>
    </>
  );
}

/** Resumo compacto da consulta rápida: situação, datas, onde fazer e código. O detalhe completo fica no Consultar. */
function Previa({ r, rotulo, abrir, limpar }: { r: ReturnType<typeof consultar>; rotulo: string; abrir: () => void; limpar: () => void }) {
  const e = r.exames[0];
  const j = r.janela;
  const cods = e.autorizacao.codigos.filter((c) => c.status === 'ativo');
  const codigo = cods.length ? cods.map((c) => c.codigo).join(cods.some((c) => c.composicao) ? ' + ' : ' ou ') : e.autorizacao.exame.tuss ?? '—';
  const resp = r.convenio.tem_regras ? (r.geral.responsavel ?? 'setor de autorização') : 'o próprio convênio';
  const validade = r.geral.validadePedidoDias ? `${r.geral.validadePedidoDias} dias` : r.geral.pedidoSemPrazo ? 'sem prazo' : '—';
  const preparo = e.agenda.preparos.map((p) => p.titulo.replace(/^Preparo\s*[—-]\s*/i, '')).join(' · ');
  return (
    <div className="previa">
      <div className="previa-cab"><b>{rotulo}</b><span className="mut">· {r.convenio.nome}</span>{TAG[r.situacao] && <span className={'tag ' + TAG[r.situacao][0]}>{TAG[r.situacao][1]}</span>}</div>
      {r.motivos[0] && <div className="previa-motivo">{r.motivos[0]}</div>}
      <div className="previa-grade">
        <div style={{ ['--c' as string]: '#3b82f6' }}><div className="rot">Agendar a partir de</div><div className="val">{j.agendarAPartirDe ? `${nomeDia(j.agendarAPartirDe)} ${br(j.agendarAPartirDe).slice(0, 5)}` : '—'}</div></div>
        <div style={{ ['--c' as string]: '#a855f7' }}><div className="rot">Pedido vale</div><div className="val">{validade}</div><div className="det">a partir da data do pedido</div></div>
        <div style={{ ['--c' as string]: '#16a34a' }}><div className="rot">Onde fazer</div><div className="val">{ondeTexto(e)}</div></div>
        <div style={{ ['--c' as string]: '#64748b' }}><div className="rot">Código para autorizar</div><div className="val"><span className="cod">{codigo}</span></div><div className="det">{r.geral.portal ? r.geral.portal.rotulo : resp}</div></div>
      </div>
      <div className="previa-rod">
        <span className="mut">{preparo ? <>Preparo: <b>{preparo}</b></> : 'Sem preparo cadastrado.'}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn2" onClick={limpar}>Trocar exame</button>
          <button type="button" className="btn2 pri" onClick={abrir}>Abrir consulta completa</button>
        </span>
      </div>
    </div>
  );
}
