// Tour guiado do Consultar, em cima da tela de verdade.
//  - "Eu faço junto": a tela escurece, só o campo da vez fica aceso; o balão explica e ESPERA a pessoa fazer.
//  - "Me mostra sozinho": o próprio sistema digita e clica, devagar, e a pessoa só assiste.
// Abre pelo botão "?" do topo, pela página Como usar e no convite do primeiro acesso.
import { isValidElement, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icone } from './Icone';
import { local } from '../util/formato';

export type ModoTour = 'faz' | 'mostra';
/** Chame de qualquer lugar para abrir o tour. */
export const abrirTour = (modo: ModoTour) => window.dispatchEvent(new CustomEvent('analiza:tour', { detail: modo }));
export const TOUR_VISTO = 'tour-visto';

const q = (s: string) => document.querySelector<HTMLElement>(s);
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Escreve num campo controlado pelo React (como se fosse a pessoa digitando). */
function valor(el: HTMLInputElement, v: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
async function digitar(sel: string, texto: string) {
  const el = q(sel) as HTMLInputElement | null; if (!el) return;
  el.focus(); await espera(200);
  for (let i = 1; i <= texto.length; i++) { valor(el, texto.slice(0, i)); await espera(80); }
}
async function clicar(sel: string, mouseDown = false) {
  for (let t = 0; t < 20 && !q(sel); t++) await espera(150);
  const el = q(sel); if (!el) return;
  if (mouseDown) el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); else el.click();
}

/** Texto puro de um balão (para medir quanto tempo a pessoa precisa para ler). */
const textoPuro = (n: ReactNode): string => {
  if (typeof n === 'string' || typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(textoPuro).join('');
  if (isValidElement<{ children?: ReactNode }>(n)) return textoPuro(n.props.children);
  return '';
};
/** Tempo de leitura no modo "Me mostra sozinho": 0,35 s por palavra + 1,5 s, nunca menos de 4 s. */
const tempoLeitura = (p: { titulo: string; texto: ReactNode }) => {
  const palavras = `${p.titulo} ${textoPuro(p.texto)}`.split(/\s+/).filter(Boolean).length;
  return Math.max(4000, palavras * 350 + 1500);
};

interface Passo {
  alvo?: string; titulo: string; texto: ReactNode;
  pronto?: () => boolean;            // o tour espera isso acontecer para seguir
  opcional?: boolean;                // pode seguir sem fazer
  auto?: () => Promise<void>;        // o que o sistema faz sozinho no modo "mostra"
}

const PASSOS: Passo[] = [
  { titulo: 'Vamos aprender a consultar', texto: 'Em 1 minuto você vai ver como achar tudo o que precisa para agendar um exame.' },
  { alvo: '.barra-fixa .combo-campo input', titulo: 'Escolha o convênio', texto: <>Digite o nome do convênio do paciente e clique nele na lista. <b>Tente: Amil</b></>,
    pronto: () => !!q('.barra-fixa .combo-logo'),
    auto: async () => { await digitar('.barra-fixa .combo-campo input', 'Amil'); await espera(350); await clicar('.combo-lista button', true); } },
  { alvo: '.barra-fixa input[type=search]', titulo: 'Digite o exame', texto: <>Escreva do jeito que o paciente falou. <b>Tente: resso joelho</b></>,
    pronto: () => !!q('.barra-fixa .sugestoes button'),
    auto: () => digitar('.barra-fixa input[type=search]', 'resso joelho') },
  { alvo: '.barra-fixa .sugestoes button', titulo: 'Escolha o exame certo', texto: 'Clique no exame que o paciente vai fazer. Se forem vários, repita.',
    pronto: () => !!q('.exames-sel .exame-linha'),
    auto: () => clicar('.barra-fixa .sugestoes button') },
  { alvo: '.barra-fixa .cp.data input', titulo: 'Data do pedido', texto: 'Coloque a data que o médico escreveu no pedido. Com ela o sistema mostra até quando dá para marcar.',
    opcional: true, pronto: () => !!(q('.barra-fixa .cp.data input') as HTMLInputElement | null)?.value,
    auto: async () => { const d = new Date(); d.setDate(d.getDate() - 5); const el = q('.barra-fixa .cp.data input') as HTMLInputElement | null; if (el) valor(el, d.toISOString().slice(0, 10)); } },
  { alvo: '.passos-resultado > .passo-bloco:nth-of-type(1)', titulo: 'Passo 1 · Posso agendar?', texto: 'Aqui ficam as orientações e a partir de quando pode marcar.' },
  { alvo: '.passos-resultado > .passo-bloco:nth-of-type(2)', titulo: 'Passo 2 · O pedido está certo?', texto: <>Confira no papel do paciente. <b style={{ color: '#16a34a' }}>Verde</b> aceita, <b style={{ color: '#dc2626' }}>vermelho</b> não aceita, <b style={{ color: '#d97706' }}>amarelo</b> só com a condição escrita.</> },
  { alvo: '.cod-copiar button', titulo: 'Passo 3 · Autorização', texto: 'Peça a autorização com a pessoa indicada. Este botão copia o código para você colar no site do convênio.' },
  { alvo: '.passos-resultado > .passo-bloco:nth-of-type(4)', titulo: 'Passo 4 · Quando e onde marcar', texto: 'A partir de quando pode marcar e em qual máquina ou médico.' },
  { alvo: '.passos-resultado > .passo-bloco:nth-of-type(5)', titulo: 'Passo 5 · O que falar para o paciente', texto: 'O preparo do exame e o que perguntar ao paciente antes de marcar.' },
  { titulo: 'Pronto!', texto: 'Você já sabe consultar. Quando tiver dúvida, clique no ? lá em cima.' },
];

export function Tour() {
  const nav = useNavigate();
  const [modo, setModo] = useState<ModoTour | null>(null);
  const [i, setI] = useState(0);
  const [caixa, setCaixa] = useState<DOMRect | null>(null);
  const [feito, setFeito] = useState(false);
  const rodando = useRef(0);
  const p = PASSOS[i];
  const fim = i === PASSOS.length - 1;

  const sair = useCallback(() => { rodando.current++; setModo(null); setI(0); setCaixa(null); local.gravar(TOUR_VISTO, true); }, []);
  const proximo = useCallback(() => setI((x) => Math.min(x + 1, PASSOS.length - 1)), []);

  // abre pelo evento
  useEffect(() => {
    const f = async (e: Event) => {
      const m = (e as CustomEvent<ModoTour>).detail;
      nav('/consultar'); await espera(350); q('button[aria-label="Nova consulta"]')?.click(); await espera(150);
      setI(0); setFeito(false); setModo(m);
    };
    window.addEventListener('analiza:tour', f);
    return () => window.removeEventListener('analiza:tour', f);
  }, [nav]);

  // acompanha o alvo (posição muda com rolagem e com a tela crescendo)
  useEffect(() => {
    if (!modo || !p.alvo) { setCaixa(null); return; }
    let rolou = false;
    const t = setInterval(() => {
      const el = q(p.alvo!);
      if (!el) return;
      if (!rolou) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); rolou = true; }
      setCaixa(el.getBoundingClientRect());
    }, 120);
    return () => clearInterval(t);
  }, [modo, i, p.alvo]);

  // espera a pessoa fazer (modo "faz") ou faz sozinho (modo "mostra")
  useEffect(() => {
    if (!modo) return;
    const id = ++rodando.current;
    setFeito(false);
    if (modo === 'mostra') {
      (async () => {
        await espera(tempoLeitura(p));   // primeiro a pessoa lê a instrução
        if (id !== rodando.current) return;
        if (p.auto) { await p.auto(); if (id !== rodando.current) return; setFeito(true); await espera(1600); }   // depois vê o resultado
        if (id === rodando.current && !fim) proximo();
      })();
      return;
    }
    if (!p.pronto) return;
    const t = setInterval(() => {
      if (id !== rodando.current) return clearInterval(t);
      if (p.pronto!()) { clearInterval(t); setFeito(true); setTimeout(() => { if (id === rodando.current) proximo(); }, 900); }
    }, 250);
    return () => clearInterval(t);
  }, [modo, i]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!modo) return null;

  // balão: embaixo do alvo, ou em cima se não couber; sem alvo, no meio da tela
  const W = 340, vw = window.innerWidth, vh = window.innerHeight;
  let estilo: CSSProperties = { left: (vw - W) / 2, top: vh * 0.3 };
  let seta: 'cima' | 'baixo' | null = null;
  if (caixa) {
    const left = Math.min(Math.max(12, caixa.left + caixa.width / 2 - W / 2), vw - W - 12);
    const embaixo = caixa.bottom + 210 < vh;
    estilo = embaixo ? { left, top: caixa.bottom + 16 } : { left, top: Math.max(12, caixa.top - 16), transform: 'translateY(-100%)' };
    seta = embaixo ? 'cima' : 'baixo';
  }
  const esperando = modo === 'faz' && !!p.pronto && !feito;

  return (
    <div className="tour" role="dialog" aria-label="Tour guiado">
      {caixa ? <div className="tour-luz" style={{ left: caixa.left - 6, top: caixa.top - 6, width: caixa.width + 12, height: caixa.height + 12 }} />
        : <div className="tour-escuro" />}
      {caixa && esperando && <div className="tour-mao" style={{ left: caixa.left + Math.min(caixa.width / 2, 120), top: caixa.top + caixa.height / 2 - 6 }}>👆</div>}
      <div className={'tour-balao' + (seta ? ' seta-' + seta : '')} style={{ ...estilo, width: W }} key={i}>
        <div className="tour-topo"><span className="tour-prog">{i + 1} de {PASSOS.length}</span>
          <button type="button" className="tour-x" onClick={sair} aria-label="Sair do tour"><Icone n="x" /></button></div>
        <h4>{feito ? <><span className="tour-ok"><Icone n="ok" /></span>Isso!</> : p.titulo}</h4>
        <p>{p.texto}</p>
        <div className="tour-barra"><span style={{ width: `${((i + 1) / PASSOS.length) * 100}%` }} /></div>
        <div className="tour-botoes">
          {i > 0 && !fim && <button type="button" className="btn2" onClick={() => setI(i - 1)}>Voltar</button>}
          <span style={{ flex: 1 }} />
          {modo === 'mostra' && !fim && <span className="mut" style={{ fontSize: 12 }}>mostrando…</span>}
          {modo === 'faz' && !fim && (esperando && !p.opcional
            ? <span className="mut" style={{ fontSize: 12 }}>faça na tela para continuar · <button type="button" className="tour-link" onClick={proximo}>pular</button></span>
            : <button type="button" className="btn2 pri" onClick={proximo}>{i === 0 ? 'Começar' : 'Próximo'}</button>)}
          {fim && <button type="button" className="btn2 pri" onClick={sair}>Concluir</button>}
        </div>
      </div>
    </div>
  );
}

/** Convite do primeiro acesso: aparece uma vez só. */
export function ConviteTour() {
  const [ver, setVer] = useState(() => !local.ler(TOUR_VISTO, false));
  if (!ver) return null;
  const ir = (m: ModoTour | null) => { local.gravar(TOUR_VISTO, true); setVer(false); if (m) abrirTour(m); };
  return (
    <div className="urgente-fundo" role="dialog" aria-label="Convite para o tour">
      <div className="urgente-caixa convite">
        <div className="convite-ic">👋</div>
        <h2>Quer aprender a usar em 1 minuto?</h2>
        <p>Um guia rápido mostra, na tela de verdade, como consultar um convênio e um exame.</p>
        <div className="convite-bts">
          <button type="button" className="btn-grande pri" onClick={() => ir('faz')}>Eu faço junto</button>
          <button type="button" className="btn-grande" onClick={() => ir('mostra')}>Me mostra sozinho</button>
        </div>
        <button type="button" className="tour-link" onClick={() => ir(null)}>Agora não</button>
      </div>
    </div>
  );
}
