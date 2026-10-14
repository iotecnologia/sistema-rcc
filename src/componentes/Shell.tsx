// Estrutura da tela (igual ao sistema Prometals): menu lateral por grupo, topo com usuário e cargo, conteúdo.
// O menu mostra todas as páginas; as que o cargo não libera aparecem com cadeado.
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Icone } from './Icone';
import { local, iniciais } from '../util/formato';
import { useSessao } from '../acesso/Sessao';
import { GRUPOS, PAGINAS } from '../acesso/paginas';

const Cadeado = () => <svg className="i cadeado" viewBox="0 0 24 24" aria-hidden><path d="M6 11h12v10H6z" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;

export function Shell() {
  const s = useSessao();
  const [claro, setClaro] = useState(() => local.ler('tema-claro', true));
  const loc = useLocation();
  const atual = PAGINAS.find((p) => p.rota === loc.pathname);
  const trocarTema = () => { setClaro(!claro); local.gravar('tema-claro', !claro); };
  return (
    <div className={'app' + (claro ? ' tema-claro' : '')}>
      <aside className="lateral">
        <div className="lat-topo"><img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" /><div><b>ANALIZA</b><small>Central de informações</small></div></div>
        <nav className="lat-nav" aria-label="Menu principal">
          {GRUPOS.map((g) => (
            <div key={g}>
              <div className="lat-sec">{g}</div>
              {PAGINAS.filter((p) => p.grupo === g).map((p) => s.pode(p.id)
                ? <NavLink key={p.id} to={p.rota} className={({ isActive }) => 'lat-item' + (isActive ? ' ativo' : '')}><Icone n={p.icone} /><span className="nm">{p.nome}</span></NavLink>
                : <span key={p.id} className="lat-item bloqueado" title="Sem permissão para o seu cargo"><Icone n={p.icone} /><span className="nm">{p.nome}</span><Cadeado /></span>)}
            </div>
          ))}
        </nav>
        <div className="lat-rodape">mock funcional · v0.2.0</div>
      </aside>
      <header className="topo">
        <div className="migalha">{atual ? <>{atual.grupo} &nbsp;/&nbsp; <b>{atual.nome}</b></> : 'Analiza'}</div>
        <div className="topo-dir">
          <button type="button" className="icone-btn" onClick={trocarTema} title="Tema claro/escuro" aria-label="Alternar tema claro ou escuro"><Icone n="tema" /></button>
          <div className="usuario"><div className="avatar">{iniciais(s.usuario?.nome ?? '')}</div><div><b>{s.usuario?.nome}</b><small>{s.cargo?.nome ?? 'sem cargo'}</small></div></div>
          <button type="button" className="icone-btn" onClick={s.sair} title="Sair" aria-label="Sair"><Icone n="sair" /></button>
        </div>
      </header>
      <main className="conteudo"><Outlet /></main>
      <footer className="status"><span className="on">Dados da base consolidada (arquivos JSON)</span><span className="dir">{s.usuario?.email} · {s.cargo?.nome}</span></footer>
    </div>
  );
}
