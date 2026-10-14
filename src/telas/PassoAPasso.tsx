// Agendar (página de Atendimento), com TRAVAS: só avança quando a etapa está certa.
// 1 Convênio · 2 Plano · 3 Exames e paciente · 4 Pedido médico · 5 Resultado (igual ao protótipo aprovado)
import { useMemo, useState, type ReactNode } from 'react';
import { useBase } from '../componentes/Dados';
import { BotoesSaida, TituloPagina } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { relatorioAgendamento } from '../componentes/ResultadoSimples';
import { ResultadoView } from '../componentes/ResultadoView';
import { SeletorExames, type Escolhido } from '../componentes/SeletorExames';
import { consultar, resumoTexto } from '../regras/resultado';
import { br, hojeIso, somarDias } from '../regras/calendario';
import { modalidadeBase } from '../regras/contexto';

type SN = 'sim' | 'nao' | null;
const PASSOS = ['Convênio', 'Plano', 'Exames', 'Pedido médico', 'Resultado'];

function SimNao({ v, set }: { v: SN; set: (x: SN) => void }) {
  return (
    <div className="sn">
      <button type="button" className={v === 'sim' ? 'marcado-sim' : ''} onClick={() => set('sim')}>Sim</button>
      <button type="button" className={v === 'nao' ? 'marcado-nao' : ''} onClick={() => set('nao')}>Não</button>
    </div>
  );
}
const Trava = ({ children }: { children: ReactNode }) => <div className="trava"><Icone n="x" /><span>{children}</span></div>;
const Certo = ({ children }: { children: ReactNode }) => <div className="certo"><Icone n="ok" /><span>{children}</span></div>;

export function PassoAPasso() {
  const b = useBase();
  const hoje = hojeIso();
  const [passo, setPasso] = useState(0);
  const [conv, setConv] = useState('');
  const [jaAutorizado, setJaAutorizado] = useState<SN>(null);
  const [plano, setPlano] = useState('');
  const [dataPedido, setDataPedido] = useState('');
  const [conselho, setConselho] = useState('');
  const [resp, setResp] = useState<Record<string, SN>>({});
  const [exames, setExames] = useState<Escolhido[]>([]);
  const [peso, setPeso] = useState('');

  const c = b.convenios.find((x) => x.slug === conv);
  const cfg = c ? b.config.find((x) => x.convenio_id === c.id) : undefined;
  const planos = c ? b.planos.filter((p) => p.convenio_id === c.id) : [];
  const conselhos = c ? b.conselhos.filter((x) => x.convenio_id === c.id) : [];
  const R = (k: string) => resp[k] ?? null;
  const setR = (k: string) => (v: SN) => setResp({ ...resp, [k]: v });

  // ---------- travas de cada etapa
  const trava1 = !c ? 'Escolha o convênio' : !c.tem_regras && jaAutorizado !== 'sim' ? 'Convênio sem regras na RCC: só siga se o pedido JÁ veio autorizado pelo convênio' : null;
  const planoSel = planos.find((p) => p.nome === plano);
  const trava2 = planos.length && !plano ? 'Escolha o plano do paciente (está na carteirinha)' : planoSel && planoSel.atende === false ? `A RCC não atende o plano ${planoSel.nome}` : null;
  const pedidoVence = dataPedido && cfg?.validade_pedido_dias ? somarDias(dataPedido, cfg.validade_pedido_dias) : null;
  const consSel = conselhos.find((x) => x.conselho === conselho);
  const perguntas: { k: string; txt: string; precisa: 'sim' | 'nao' }[] = [];
  if (cfg?.exige_original || cfg?.aceita_copia === false) perguntas.push({ k: 'original', txt: 'O pedido é ORIGINAL (não é cópia)?', precisa: 'sim' });
  if (cfg?.exige_carimbo_assinatura) perguntas.push({ k: 'carimbo', txt: 'O pedido está carimbado e assinado pelo médico?', precisa: 'sim' });
  if (cfg?.exige_cid) perguntas.push({ k: 'cid', txt: 'Todos os exames têm CID ou indicação clínica?', precisa: 'sim' });
  if (cfg?.aceita_multipla_escolha === false) perguntas.push({ k: 'multipla', txt: 'O pedido é de múltipla escolha (exames marcados com X)?', precisa: 'nao' });
  if (cfg?.aceita_outro_estado === false) perguntas.push({ k: 'estado', txt: 'O médico é de OUTRO estado (CRM fora de SP)?', precisa: 'nao' });
  const trava3 = dataPedido && dataPedido > hoje ? 'A data do pedido está no futuro — confira'
    : dataPedido && pedidoVence && pedidoVence < hoje ? `Pedido VENCIDO em ${br(pedidoVence)} — o paciente precisa de um pedido novo`
    : conselhos.length && !conselho ? 'Escolha o conselho do médico que pediu (está no carimbo)'
    : consSel && !consSel.aceita ? `Este convênio NÃO aceita pedido de ${consSel.conselho}`
    : perguntas.find((p) => R(p.k) === null) ? 'Responda todas as perguntas'
    : perguntas.find((p) => R(p.k) !== p.precisa) ? 'O pedido não está de acordo com a regra do convênio (veja em vermelho)' : null;

  const resultado = useMemo(() => (c && exames.length ? consultar(b, { convenio: conv, exames, dataPedido: dataPedido || null, hoje }) : null),
    [b, c, conv, exames, dataPedido, hoje]);
  const pesoN = Number(peso) || 0;
  const limites = [...new Set(exames.map((x) => modalidadeBase(b.exames.find((e) => e.id === x.exameId)!)))]
    .map((m) => ({ m, kg: m === 'RM' ? 180 : m === 'TC' ? 170 : null })).filter((x) => x.kg);
  const passouPeso = limites.find((l) => pesoN > (l.kg as number));
  const trava4 = !exames.length ? 'Escolha pelo menos um exame'
    : resultado?.situacao === 'nao_pode' && !resultado.janela.pedidoVencido ? resultado.motivos.join(' · ')
    : passouPeso ? `Peso acima do limite da ${passouPeso.m} (${passouPeso.kg} kg)` : null;

  const travas = [trava1, trava2, trava4, trava3, null];
  const podeIr = (i: number) => travas.slice(0, i).every((t) => !t);

  return (
    <>
      <TituloPagina titulo="Agendar" sub="Siga as etapas. Só avança quando está tudo certo.">
        <button type="button" className="btn2 ic" title="Começar de novo" aria-label="Começar de novo"
          onClick={() => { setPasso(0); setConv(''); setJaAutorizado(null); setPlano(''); setDataPedido(''); setConselho(''); setResp({}); setExames([]); setPeso(''); }}><Icone n="limpar" /></button>
        <BotoesSaida desativado={passo !== 4 || !resultado} texto={() => (resultado ? resumoTexto(resultado) : '')} relatorio={() => relatorioAgendamento(resultado!)} />
      </TituloPagina>

      <div className="passos">
        {PASSOS.map((p, i) => (
          <button type="button" key={p} className={i === passo ? 'atual' : i < passo ? 'ok' : ''} disabled={!podeIr(i)} onClick={() => setPasso(i)}>
            <span className="n">{i < passo ? '✓' : i + 1}</span>{p}
          </button>
        ))}
      </div>

      <section className="etapa">
        {passo === 0 && <>
          <h2>Qual é o convênio do paciente?</h2>
          <p className="ajuda">Está escrito na carteirinha.</p>
          <div className="opcoes">
            {[...b.convenios].sort((a, x) => a.nome.localeCompare(x.nome)).map((x) => (
              <button type="button" key={x.slug} className={'opcao' + (conv === x.slug ? ' sel' : '')} onClick={() => { setConv(x.slug); setPlano(''); setConselho(''); setResp({}); setJaAutorizado(null); }}>
                <span className="sg" style={{ background: x.cor ?? '#64748b', color: '#fff' }}>{x.nome.slice(0, 2).toUpperCase()}</span>{x.nome}
              </button>
            ))}
          </div>
          {c && !c.tem_regras && <div className="pergunta"><span className="txt">{c.nome} não tem regras na RCC. O pedido já veio AUTORIZADO pelo convênio?</span><SimNao v={jaAutorizado} set={setJaAutorizado} /></div>}
          {trava1 && c ? <Trava>{trava1}</Trava> : c && <Certo>{c.nome} · autorização com {c.responsavel ?? 'o próprio convênio'}</Certo>}
        </>}

        {passo === 1 && <>
          <h2>Qual é o plano do paciente?</h2>
          {planos.length ? <>
            <p className="ajuda">Confira na carteirinha. {c?.portal_url && <a href={c.portal_url} target="_blank" rel="noopener noreferrer">Abrir portal</a>}</p>
            <select value={plano} onChange={(e) => setPlano(e.target.value)} style={{ maxWidth: 420 }}>
              <option value="">Escolha o plano…</option>
              {planos.map((p) => <option key={p.nome} value={p.nome}>{p.nome}{p.atende === false ? ' — NÃO atende' : ''}</option>)}
            </select>
          </> : <Certo>Este convênio não tem restrição de plano cadastrada.</Certo>}
          {trava2 && planos.length > 0 ? <Trava>{trava2}</Trava> : planoSel && <Certo>Plano {planoSel.nome}: atende</Certo>}
        </>}

        {passo === 3 && <>
          <h2>Confira o pedido médico</h2>
          <label className="campo" style={{ maxWidth: 360 }}>Data do pedido (se tiver)<input type="date" value={dataPedido} max={hoje} onChange={(e) => setDataPedido(e.target.value)} style={{ paddingLeft: 12 }} /></label>
          {pedidoVence && <p className="ajuda">Pedido vale até <b>{br(pedidoVence)}</b> ({cfg?.validade_pedido_dias} dias corridos).</p>}
          {!dataPedido && <p className="ajuda">Pedido sem data? Deixe em branco. Confirme com {c?.responsavel ?? 'o convênio'} se ele aceita pedido sem data.</p>}
          {conselhos.length > 0 && (
            <label className="campo" style={{ maxWidth: 420 }}>Conselho do médico que pediu
              <select value={conselho} onChange={(e) => setConselho(e.target.value)}>
                <option value="">Escolha…</option>
                {['CRM', 'CRO', 'CREFITO'].map((k) => { const x = conselhos.find((y) => y.conselho === k); return <option key={k} value={k}>{k}{x ? (x.aceita ? (x.restricao ? ` — aceita (${x.restricao})` : ' — aceita') : ' — NÃO aceita') : ' — sem informação'}</option>; })}
              </select>
            </label>
          )}
          {perguntas.map((p) => (
            <div className="pergunta" key={p.k}>
              <span className="txt">{p.txt}</span><SimNao v={R(p.k)} set={setR(p.k)} />
              {R(p.k) !== null && R(p.k) !== p.precisa && <Trava>Não pode: {p.k === 'original' ? 'só aceita pedido original' : p.k === 'carimbo' ? 'pedido precisa ser carimbado e assinado' : p.k === 'cid' ? 'precisa de CID ou indicação clínica em todos os exames' : p.k === 'multipla' ? 'não aceita pedido de múltipla escolha' : 'só aceita médico com CRM de São Paulo'}</Trava>}
            </div>
          ))}
          {trava3 ? <Trava>{trava3}</Trava> : <Certo>Pedido conferido.</Certo>}
        </>}

        {passo === 2 && <>
          <h2>Quais exames estão no pedido médico?</h2>
          <div className="barra" style={{ margin: 0 }}><SeletorExames convenio={conv} escolhidos={exames} mudar={setExames} /></div>
          <label className="campo" style={{ maxWidth: 220 }}>Peso do paciente (kg)<input type="number" min={0} value={peso} onChange={(e) => setPeso(e.target.value)} style={{ paddingLeft: 12 }} /></label>
          {resultado && resultado.exames.flatMap((e) => e.agenda.avisosPaciente).filter((a, i, arr) => arr.findIndex((y) => y.id === a.id) === i).map((a) => <div key={a.id} className="mini">• {a.texto}</div>)}
          {trava4 ? <Trava>{trava4}</Trava> : <Certo>Exames liberados para continuar.</Certo>}
        </>}

        {passo === 4 && resultado && <>
          <div className={'faixa ' + (resultado.situacao === 'nao_pode' ? 'no' : resultado.situacao === 'atencao' ? 'at' : 'ok')} style={{ marginBottom: 16 }}>
            <Icone n={resultado.situacao === 'nao_pode' ? 'x' : 'ok'} />
            <div className="txt"><b style={{ fontSize: 20 }}>{resultado.situacao === 'nao_pode' ? 'NÃO AGENDAR' : resultado.situacao === 'atencao' ? 'ATENÇÃO' : 'PODE AGENDAR'}</b>
              <span>{resultado.situacao === 'nao_pode' ? resultado.motivos.join(' · ') : 'Pedido conferido. Siga os códigos e as datas abaixo.'}</span></div>
          </div>
          <ResultadoView r={resultado} dataPedido={dataPedido || null} />
        </>}

        <div className="rodape-etapa">
          <button type="button" className="btn-grande" disabled={passo === 0} onClick={() => setPasso(passo - 1)}><Icone n="volta" />Voltar</button>
          {passo < 4 && <button type="button" className="btn-grande pri" disabled={!!travas[passo]} onClick={() => setPasso(passo + 1)}>Continuar<Icone n="seta" /></button>}
        </div>
      </section>
    </>
  );
}
