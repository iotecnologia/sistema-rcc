// Consultar: 1) convênio  2) exames  3) data do pedido  → resultado. Sem convênio, nada aparece (trava).
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { ResultadoView } from '../componentes/ResultadoView';
import { relatorioAgendamento } from '../componentes/ResultadoSimples';
import { SeletorExames, type Escolhido } from '../componentes/SeletorExames';
import { consultar, resumoTexto } from '../regras/resultado';
import { hojeIso } from '../regras/calendario';
import { local } from '../util/formato';

export function Consultar() {
  const b = useBase();
  const [params] = useSearchParams();
  const [conv, setConv] = useState(params.get('convenio') ?? '');
  const [exames, setExames] = useState<Escolhido[]>(params.get('exame') ? [{ exameId: Number(params.get('exame')), quantidade: 1 }] : []);
  const [dataPedido, setDataPedido] = useState('');
  const hoje = hojeIso();
  const convenios = [...b.convenios].sort((a, c) => Number(c.tem_regras) - Number(a.tem_regras) || a.nome.localeCompare(c.nome));

  const resultado = useMemo(() => {
    if (!conv || !exames.length) return null;
    return consultar(b, { convenio: conv, exames, dataPedido: dataPedido || null, hoje });
  }, [b, conv, exames, dataPedido, hoje]);

  // guarda só o resumo da consulta (convênio + exames) para a Visão geral — nunca dado de paciente
  useEffect(() => {
    if (!resultado) return;
    const hist = local.ler<{ conv: string; ex: string; quando: string; sit?: string; slug?: string }[]>('historico', []);
    const item = { conv: resultado.convenio.nome, ex: resultado.exames.map((e) => e.autorizacao.exame.nome).join(' · '), quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), sit: resultado.situacao, slug: resultado.convenio.slug };
    if (!hist.length || hist[0].conv !== item.conv || hist[0].ex !== item.ex) local.gravar('historico', [item, ...hist].slice(0, 8));
  }, [resultado]);

  const guia = !conv ? 'Comece escolhendo o convênio do paciente.' : 'Agora digite o exame do jeito que o paciente falou.';
  const limpar = () => { setConv(''); setExames([]); setDataPedido(''); };

  return (
    <>
      <TituloPagina titulo="Consultar" sub="Escolha o convênio, depois os exames. O resultado vale só para esse convênio.">
        <button type="button" className="btn2 ic" onClick={limpar} title="Nova consulta" aria-label="Nova consulta"><Icone n="limpar" /></button>
        <BotoesSaida desativado={!resultado} texto={() => (resultado ? resumoTexto(resultado) : '')} relatorio={() => relatorioAgendamento(resultado!)} />
      </TituloPagina>

      <div className="barra">
        <label className="cp" style={{ flex: '1 1 240px' }}>
          <span><span className="passo">1</span>Convênio</span>
          <select value={conv} onChange={(e) => { setConv(e.target.value); }}>
            <option value="">Escolha o convênio…</option>
            {convenios.map((c) => <option key={c.slug} value={c.slug}>{c.nome}{c.tem_regras ? '' : ' (pedido vem autorizado)'}</option>)}
          </select>
        </label>
        <SeletorExames convenio={conv} escolhidos={exames} mudar={setExames} desativado={!conv} />
        <label className="cp" style={{ flex: '0 1 190px' }}>
          <span><span className="passo">3</span>Data do pedido <small style={{ fontWeight: 400, textTransform: 'none' }}>(se tiver)</small></span>
          <input type="date" value={dataPedido} max={hoje} onChange={(e) => setDataPedido(e.target.value)} disabled={!exames.length} />
        </label>
      </div>

      {resultado ? <ResultadoView r={resultado} dataPedido={dataPedido || null} /> : <div className="bloco"><Vazio>{guia}</Vazio></div>}
    </>
  );
}
