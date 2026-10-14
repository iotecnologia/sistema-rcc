// Janela de agendamento: convênio + exames (+ data do pedido, se tiver) → calendário de quando até quando dá para agendar.
import { useMemo, useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, Kpi, TituloPagina, Vazio } from '../componentes/Comuns';
import { SeletorExames, type Escolhido } from '../componentes/SeletorExames';
import { relatorioAgendamento } from '../componentes/ResultadoSimples';
import { consultar, resumoTexto } from '../regras/resultado';
import { br, diaSemana, ehFeriado, hojeIso, nomeDia, paraIso, rccAtende, somarDias } from '../regras/calendario';
import { modalidadeBase } from '../regras/contexto';
import { temInfo } from './Convenios';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function Janela() {
  const b = useBase();
  const hoje = hojeIso();
  const [conv, setConv] = useState('');
  const [exames, setExames] = useState<Escolhido[]>([]);
  const [dataPedido, setDataPedido] = useState('');
  const r = useMemo(() => (conv && exames.length ? consultar(b, { convenio: conv, exames, dataPedido: dataPedido || null, hoje }) : null), [b, conv, exames, dataPedido, hoje]);
  const mods = r ? r.exames.map((e) => modalidadeBase(e.autorizacao.exame)) : [];
  const ini = r?.janela.agendarAPartirDe ?? null;
  const fim = r?.janela.pedidoValeAte ?? null;
  const diasNaJanela = useMemo(() => {
    if (!ini || !fim || fim < ini) return 0;
    let n = 0; for (let d = ini; d <= fim; d = somarDias(d, 1)) if (mods.every((m) => rccAtende(d, m))) n++;
    return n;
  }, [ini, fim, mods]);

  const mes = (ano: number, m: number) => {
    const primeiro = paraIso(new Date(Date.UTC(ano, m, 1)));
    const desloc = (diaSemana(primeiro) + 6) % 7; // semana começa na segunda
    const total = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
    const celulas = [...Array(desloc).fill(null), ...Array.from({ length: total }, (_, i) => paraIso(new Date(Date.UTC(ano, m, i + 1))))];
    return (
      <div className="cal-mes" key={`${ano}-${m}`}>
        <div className="cal-tit">{MESES[m]} {ano}</div>
        <div className="cal-grade">
          {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => <div key={d} className="cal-sem">{d}</div>)}
          {celulas.map((d, i) => {
            if (!d) return <div key={i} />;
            const fer = ehFeriado(b.feriados, d);
            const fecha = mods.some((md) => !rccAtende(d, md));
            const dentro = ini && d >= ini && (fim ? d <= fim : true) && !fecha;
            const cls = ['cal-dia', d === hoje && 'hoje', d === dataPedido && 'pedido', dentro && (fim ? 'ok' : 'ok-aberto'), d === ini && 'ini', d === fim && 'fim', fer && 'feriado', fecha && 'fechado'].filter(Boolean).join(' ');
            return <div key={i} className={cls} title={fer ? fer.nome : fecha ? 'RCC não atende este exame neste dia' : ''}>{Number(d.slice(8))}</div>;
          })}
        </div>
      </div>
    );
  };
  const [a, m] = hoje.split('-').map(Number);

  return (
    <>
      <TituloPagina titulo="Janela de agendamento" sub="Convênio + exames + data do pedido: o calendário mostra de quando até quando dá para agendar.">
        <BotoesSaida desativado={!r} texto={() => (r ? resumoTexto(r) : '')} relatorio={() => relatorioAgendamento(r!)} />
      </TituloPagina>
      <div className="barra">
        <label className="cp" style={{ flex: '0 1 260px' }}><span><span className="passo">1</span>Convênio</span>
          <select value={conv} onChange={(e) => setConv(e.target.value)}><option value="">Escolha o convênio…</option>
            {[...b.convenios].filter((c) => temInfo(b, c)).sort((x, y) => x.nome.localeCompare(y.nome)).map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
        <SeletorExames convenio={conv} escolhidos={exames} mudar={setExames} desativado={!conv} />
        <label className="cp" style={{ flex: '0 1 200px' }}><span><span className="passo">3</span>Data do pedido <small style={{ fontWeight: 400, textTransform: 'none' }}>(se tiver)</small></span>
          <input type="date" value={dataPedido} max={hoje} onChange={(e) => setDataPedido(e.target.value)} /></label>
      </div>
      {!r ? <div className="bloco"><Vazio>Escolha o convênio e o exame para ver o calendário.</Vazio></div> : <>
        <div className="kpis">
          <Kpi cor="#16a34a" rot="Agendar a partir de" txt val={ini ? `${nomeDia(ini)} ${br(ini).slice(0, 5)}` : '—'} det={r.janela.motivoAPartir} />
          <Kpi cor="#7c3aed" rot="Agendar até" txt val={fim ? `${nomeDia(fim)} ${br(fim).slice(0, 5)}` : '—'} det={fim ? `pedido vale ${r.geral.validadePedidoDias} dias corridos` : 'informe a data do pedido para calcular'} />
          <Kpi cor="#3b82f6" rot="Dias para agendar" val={fim ? diasNaJanela : '—'} det="dias com atendimento na janela" />
          <Kpi cor="#f59e0b" rot="Atenção" txt val={<span style={{ fontSize: 16 }}>{r.exames.flatMap((e) => e.agenda.avisos)[0]?.texto ?? 'nenhuma'}</span>} det={r.situacao === 'nao_pode' ? r.motivos[0] : ''} />
        </div>
        <Bloco titulo="Calendário">
          <div className="cal">{mes(a, m - 1)}{mes(m === 12 ? a + 1 : a, m % 12)}</div>
          <div className="cal-leg">
            <span><i className="pedido" /> data do pedido</span><span><i className="hoje" /> hoje</span><span><i className="ok" /> pode agendar</span>
            <span><i className="fim" /> pedido vence</span><span><i className="feriado" /> feriado (não conta no prazo)</span><span><i className="fechado" /> RCC não atende este exame</span>
          </div>
        </Bloco>
      </>}
    </>
  );
}
