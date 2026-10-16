// Estrutura da tela (igual ao sistema Prometals): menu lateral por grupo, topo com usuário e cargo, conteúdo.
// O menu mostra só as páginas que o cargo libera (Administração só para administradora).
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Icone } from './Icone';
import { local, iniciais } from '../util/formato';
import { useSessao } from '../acesso/Sessao';
import { EM_BREVE, GRUPOS, PAGINAS } from '../acesso/paginas';
import { useAvisos } from '../acesso/Avisos';
import { JanelaUrgente } from './AvisosEquipe';
import { BuscaGeral } from './BuscaGeral';
import { ConviteTour, Tour, abrirTour } from './Tour';

export function Shell() {
  const s = useSessao();
  const av = useAvisos();
  const nav = useNavigate();
  const [ajuda, setAjuda] = useState(false);
  const [claro, setClaro] = useState(() => local.ler('tema-claro', true));
  const loc = useLocation();
  const atual = PAGINAS.find((p) => p.rota === loc.pathname);
  const trocarTema = () => { setClaro(!claro); local.gravar('tema-claro', !claro); };
  return (
    <div className={'app' + (claro ? ' tema-claro' : '')}>
      <aside className="lateral">
        <div className="lat-topo"><img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" /><div><b>ANALIZA</b><small>Central de informações</small></div></div>
        <nav className="lat-nav" aria-label="Menu principal">
          {GRUPOS.map((g) => {
            const itens = PAGINAS.filter((p) => p.grupo === g && s.pode(p.id));
            if (!itens.length) return null;
            return (
              <div key={g || 'topo'}>
                {g && <div className="lat-sec">{g}</div>}
                {itens.map((p) => <NavLink key={p.id} to={p.rota} className={({ isActive }) => 'lat-item' + (isActive ? ' ativo' : '')}><Icone n={p.icone} /><span className="nm">{p.nome}</span></NavLink>)}
                {EM_BREVE.filter((x) => x.grupo === g).map((x) => <span key={x.nome} className="lat-item em-breve" title={x.dica} aria-disabled="true"><Icone n={x.icone} /><span className="nm">{x.nome}</span></span>)}
              </div>
            );
          })}
        </nav>
        <div className="lat-rodape">v1.1 · mock funcional</div>
      </aside>
      <header className="topo">
        <div className="migalha">Início{atual && <> &nbsp;/&nbsp; <b>{atual.nome}</b></>}</div>
        <BuscaGeral />
        <div className="topo-dir">
          <div className="ajuda-menu">
            <button type="button" className="icone-btn" onClick={() => setAjuda(!ajuda)} onBlur={() => setTimeout(() => setAjuda(false), 150)} title="Ajuda" aria-label="Ajuda" aria-expanded={ajuda}><span className="ajuda-q">?</span></button>
            {ajuda && <div className="ajuda-lista">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setAjuda(false); abrirTour('faz'); }}><b>Fazer o tour</b><small>eu faço junto, o guia mostra onde</small></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setAjuda(false); abrirTour('mostra'); }}><b>Me mostra sozinho</b><small>o sistema faz e eu assisto</small></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setAjuda(false); nav('/ajuda'); }}><b>Ler o passo a passo</b><small>página Como usar</small></button>
            </div>}
          </div>
          <button type="button" className="icone-btn sino" onClick={() => nav('/inicio')} title={av.naoLidos.length ? `${av.naoLidos.length} aviso(s) não lido(s)` : 'Avisos da equipe'} aria-label="Avisos da equipe"><Icone n="sino" />{av.naoLidos.length > 0 && <span className="bolinha">{av.naoLidos.length}</span>}</button>
          <button type="button" className="icone-btn" onClick={trocarTema} title="Tema claro/escuro" aria-label="Alternar tema claro ou escuro"><Icone n="tema" /></button>
          <div className="usuario"><div className="avatar">{iniciais(s.usuario?.nome ?? '')}</div><div><b>{s.usuario?.nome}</b><small>{s.cargo?.nome ?? 'sem cargo'}</small></div></div>
          <button type="button" className="icone-btn" onClick={s.sair} title="Sair" aria-label="Sair"><Icone n="sair" /></button>
        </div>
      </header>
      <main className="conteudo"><Outlet /></main>
      <JanelaUrgente />
      <Tour />
      <ConviteTour />
      <footer className="status"><span className="on">Conectado</span><span>Dados da base consolidada</span><span className="dir">Sessão: {s.usuario?.email} · {s.cargo?.nome}</span></footer>
    </div>
  );
}
