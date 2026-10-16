// Peças dos avisos da equipe: quadro da Visão geral e janela de aviso urgente (aparece ao entrar).
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

/** Quadro da Visão geral: só os avisos ainda não lidos. Lidos aparecem só quando a pessoa pede (botão "Avisos lidos"). */
export function QuadroAvisos({ mostrarLidos = false }: { mostrarLidos?: boolean }) {
  const v = useAvisos();
  const abertos = v.visiveis.filter((a) => !v.leu(a.id));
  const lidos = v.visiveis.filter((a) => v.leu(a.id));
  return (
    <>
      {abertos.length > 0 && <section className="bloco quadro-avisos">
        <div className="bloco-cab"><h3>Avisos da equipe</h3><span className="tag t-no">{abertos.length} não lido{abertos.length > 1 ? 's' : ''}</span></div>
        <ul className="lista-avisos">{abertos.map((a) => <Cartao key={a.id} a={a} lido={false} marcar={() => v.lido(a.id)} />)}</ul>
      </section>}
      {mostrarLidos && <section className="bloco quadro-avisos">
        <div className="bloco-cab"><h3>Avisos lidos</h3></div>
        {lidos.length ? <ul className="lista-avisos">{lidos.map((a) => <Cartao key={a.id} a={a} lido marcar={() => undefined} />)}</ul>
          : <div className="mut" style={{ padding: '12px 16px', fontSize: 13 }}>Nenhum aviso lido em vigor.</div>}
      </section>}
    </>
  );
}

/** Avisos já lidos, compactos e sempre abertos: o mais novo em cima; mostra os 5 mais recentes (o mais antigo vai saindo). */
export function AvisosLidosResumo() {
  const v = useAvisos();
  const lidos = v.visiveis.filter((a) => v.leu(a.id)).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm)).slice(0, 5);
  if (!lidos.length) return null;
  return (
    <section className="bloco">
      <div className="bloco-cab"><h3>Avisos lidos</h3></div>
      <ul className="lidos-resumo">
        {lidos.map((a) => (
          <li key={a.id} className={a.tipo}>
            <div className="lidos-cab"><b>{a.titulo}</b><small>{quando(a.criadoEm).slice(0, 5)}</small></div>
            <div className="lidos-texto">{a.texto}</div>
          </li>
        ))}
      </ul>
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
