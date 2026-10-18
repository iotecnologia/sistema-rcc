// Consultar: 1) convênio  2) exames  3) data do pedido  → resultado. Sem convênio, nada aparece (trava).
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { ResultadoView } from '../componentes/ResultadoView';
import { relatorioAgendamento } from '../componentes/ResultadoSimples';
import { ComboConvenio } from '../componentes/ComboConvenio';
import { SeletorExames, ExamesEscolhidos, type Escolhido } from '../componentes/SeletorExames';
import { ComboRede } from '../componentes/ComboRede';
import { pedeRede } from '../regras/rede';
import { consultar, resumoTexto } from '../regras/resultado';
import { hojeIso } from '../regras/calendario';
import { local } from '../util/formato';

export function Consultar() {
  const b = useBase();
  const [params] = useSearchParams();
  const [conv, setConv] = useState(params.get('convenio') ?? '');
  const [exames, setExames] = useState<Escolhido[]>(() => {
    const lista = (params.get('exames') ?? params.get('exame') ?? '').split(',').filter(Boolean);
    const rot = params.get('rotulo') ?? undefined;
    return lista.map((x) => { const [id, q] = x.split('x'); return { exameId: Number(id), quantidade: Number(q) || 1, rotulo: lista.length === 1 ? rot : undefined }; }).filter((x) => b.exames.some((e) => e.id === x.exameId));
  });
  const [rede, setRede] = useState('');
  const [dataPedido, setDataPedido] = useState('');
  const comRede = pedeRede(conv);
  const mudarConv = (slug: string) => { setConv(slug); setRede(''); };
  const hoje = hojeIso();

  const resultado = useMemo(() => {
    if (!conv || !exames.length) return null;
    return consultar(b, { convenio: conv, exames, dataPedido: dataPedido || null, hoje, rede });
  }, [b, conv, exames, dataPedido, hoje, rede]);

  // guarda só o resumo da consulta (convênio + exames) para a Visão geral — nunca dado de paciente
  useEffect(() => {
    if (!resultado) return;
    const hist = local.ler<{ conv: string; ex: string; quando: string; dia?: string; slug?: string; ids?: string }[]>('historico', []);
    const item = { conv: resultado.convenio.nome, ex: resultado.exames.map((e) => e.autorizacao.exame.nome).join(' · '), quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), dia: hojeIso(), slug: resultado.convenio.slug, ids: exames.map((x) => `${x.exameId}x${x.quantidade}`).join(',') };
    if (!hist.length || hist[0].conv !== item.conv || hist[0].ex !== item.ex) local.gravar('historico', [item, ...hist].slice(0, 8));
  }, [resultado]);

  const guia = !conv ? 'Comece escolhendo o convênio do paciente.' : comRede && !rede ? 'Agora escolha a rede do paciente (está na carteirinha) e digite o exame.' : 'Agora digite o exame do jeito que o paciente falou.';
  const limpar = () => { setConv(''); setRede(''); setExames([]); setDataPedido(''); };

  return (
    <>
      <TituloPagina titulo="Consultar" sub="Escolha o convênio, depois os exames. O resultado vale só para esse convênio.">
        <button type="button" className="btn2 ic" onClick={limpar} title="Nova consulta" aria-label="Nova consulta"><Icone n="limpar" /></button>
        <BotoesSaida desativado={!resultado} texto={() => (resultado ? resumoTexto(resultado) : '')} relatorio={() => relatorioAgendamento(resultado!)} />
      </TituloPagina>

      <div className="barra-fixa"><div className={'barra' + (comRede ? ' com-rede' : '')}>
        <ComboConvenio valor={conv} mudar={mudarConv} passo={1} flex="1 1 260px" />
        {comRede && <ComboRede convenio={conv} valor={rede} mudar={setRede} passo={2} />}
        <SeletorExames convenio={conv} escolhidos={exames} mudar={setExames} desativado={!conv} passo={comRede ? 3 : 2} semChips />
        <label className="cp data" style={{ flex: '0 1 190px' }}>
          <span><span className="passo">{comRede ? 4 : 3}</span>Data do pedido <small style={{ fontWeight: 400, textTransform: 'none' }}>(se tiver)</small></span>
          <input type="date" value={dataPedido} max={hoje} onChange={(e) => setDataPedido(e.target.value)} disabled={!exames.length} />
        </label>
      </div></div>

      <ExamesEscolhidos escolhidos={exames} mudar={setExames} />
      {resultado ? <ResultadoView r={resultado} dataPedido={dataPedido || null} /> : <div className="bloco"><Vazio>{guia}</Vazio></div>}
    </>
  );
}
