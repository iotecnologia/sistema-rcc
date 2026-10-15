// Peças dos avisos da equipe: quadro da Visão geral e janela de aviso urgente (aparece ao entrar).
import { useState } from 'react';
import { useAvisos, ROTULO_TIPO, type Aviso } from '../acesso/Avisos';
import { Icone } from './Icone';

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const ate = (d: string) => d.split('-').reverse().slice(0, 2).join('/');

function Cartao({ a, lido, marcar }: { a: Aviso; lido: boolean; marcar: () => void }) {
  return (
    <li className={'aviso-eq ' + a.tipo + (lido ? ' lido' : '')}>
      <div className="aviso-eq-cab"><span className={'tag-aviso ' + a.tipo}>{ROTULO_TIPO[a.tipo]}</span><b>{a.titulo}</b></div>
      <div className="aviso-eq-txt">{a.texto}</div>
      <div className="aviso-eq-rod"><span>{a.autor} · {quando(a.criadoEm)} · vale até {ate(a.validoAte)}</span>
        {lido ? <span className="ok-lido"><Icone n="ok" />Lido</span> : <button type="button" className="btn2" onClick={marcar}>Li e entendi</button>}</div>
    </li>
  );
}

export function QuadroAvisos() {
  const v = useAvisos();
  const [verLidos, setVerLidos] = useState(false);
  if (!v.visiveis.length) return null;
  // não lidos aparecem abertos; depois do "Li e entendi" o aviso minimiza numa linha só
  const abertos = v.visiveis.filter((a) => !v.leu(a.id));
  const lidos = v.visiveis.filter((a) => v.leu(a.id));
  return (
    <section className="bloco quadro-avisos">
      <div className="bloco-cab"><h3>Avisos da equipe</h3>
        {abertos.length > 0
          ? <span className="tag t-no">{abertos.length} não lido{abertos.length > 1 ? 's' : ''}</span>
          : <button type="button" className="ver-mais" style={{ margin: 0 }} onClick={() => setVerLidos(!verLidos)}>{verLidos ? 'esconder' : `ver avisos lidos (${lidos.length})`}</button>}
      </div>
      {abertos.length > 0 && <ul className="lista-avisos">{abertos.map((a) => <Cartao key={a.id} a={a} lido={false} marcar={() => v.lido(a.id)} />)}</ul>}
      {abertos.length > 0 && lidos.length > 0 && <div style={{ padding: '0 16px 12px' }}><button type="button" className="ver-mais" style={{ margin: 0 }} onClick={() => setVerLidos(!verLidos)}>{verLidos ? 'esconder lidos' : `ver avisos lidos (${lidos.length})`}</button></div>}
      {verLidos && lidos.length > 0 && <ul className="lista-avisos">{lidos.map((a) => <Cartao key={a.id} a={a} lido marcar={() => undefined} />)}</ul>}
    </section>
  );
}

/** Aviso urgente não lido: aparece na frente de tudo até a pessoa confirmar. */
export function JanelaUrgente() {
  const v = useAvisos();
  const a = v.naoLidos.find((x) => x.tipo === 'urgente');
  if (!a) return null;
  return (
    <div className="urgente-fundo" role="alertdialog" aria-modal="true" aria-labelledby="urg-tit">
      <div className="urgente-caixa">
        <div className="urgente-topo"><Icone n="pendencia" /><span>AVISO URGENTE</span></div>
        <h2 id="urg-tit">{a.titulo}</h2>
        <p>{a.texto}</p>
        <div className="mut" style={{ fontSize: 12 }}>{a.autor} · {quando(a.criadoEm)}</div>
        <button type="button" className="btn-grande pri" onClick={() => v.lido(a.id)}><Icone n="ok" />Li e entendi</button>
      </div>
    </div>
  );
}
