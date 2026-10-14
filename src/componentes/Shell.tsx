// Estrutura da tela (igual ao sistema Prometals): menu lateral, topo, conteúdo e barra de status.
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Icone } from './Icone';
import { local } from '../util/formato';

const MENU: { sec?: string; itens: { para: string; nome: string; ic: string }[] }[] = [
  { itens: [{ para: '/', nome: 'Visão geral', ic: 'inicio' }, { para: '/consultar', nome: 'Consultar', ic: 'busca' }] },
  { sec: 'Autorização', itens: [
    { para: '/passo-a-passo', nome: 'Agendar passo a passo', ic: 'passos' },
    { para: '/convenios', nome: 'Convênios', ic: 'convenio' },
    { para: '/exames', nome: 'Exames', ic: 'exame' },
  ] },
  { sec: 'Atendimento', itens: [
    { para: '/orcamento', nome: 'Orçamento', ic: 'orcamento' },
    { para: '/medicos', nome: 'Médicos', ic: 'medico' },
    { para: '/unidades', nome: 'Unidades e máquinas', ic: 'maquina' },
    { para: '/ramais', nome: 'Ramais', ic: 'ramal' },
  ] },
  { sec: 'Administração', itens: [{ para: '/pendencias', nome: 'Regras a confirmar', ic: 'pendencia' }] },
];

export const TITULOS: Record<string, string> = Object.fromEntries(MENU.flatMap((s) => s.itens.map((i) => [i.para, i.nome])));

export function Shell() {
  const [claro, setClaro] = useState(() => local.ler('tema-claro', true));
  const loc = useLocation();
  const atual = TITULOS[loc.pathname] ?? 'Analiza';
  const trocarTema = () => { setClaro(!claro); local.gravar('tema-claro', !claro); };
  return (
    <div className={'app' + (claro ? ' tema-claro' : '')}>
      <aside className="lateral">
        <div className="lat-topo"><img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" /><div><b>ANALIZA</b><small>Central de informações</small></div></div>
        <nav className="lat-nav" aria-label="Menu principal">
          {MENU.map((s, i) => (
            <div key={i}>
              {s.sec && <div className="lat-sec">{s.sec}</div>}
              {s.itens.map((it) => (
                <NavLink key={it.para} to={it.para} end className={({ isActive }) => 'lat-item' + (isActive ? ' ativo' : '')}>
                  <Icone n={it.ic} /><span className="nm">{it.nome}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="lat-rodape">mock funcional · v0.1.0</div>
      </aside>
      <header className="topo">
        <div className="migalha">Início{loc.pathname !== '/' && <> &nbsp;/&nbsp; <b>{atual}</b></>}</div>
        <div className="topo-dir">
          <button type="button" className="icone-btn" onClick={trocarTema} title="Tema claro/escuro" aria-label="Alternar tema claro ou escuro"><Icone n="tema" /></button>
          <div className="usuario"><div className="avatar">IZ</div><div><b>Izabel</b><small>Administradora</small></div></div>
          <button type="button" className="icone-btn" title="Sair (no mock não há login)" aria-label="Sair"><Icone n="sair" /></button>
        </div>
      </header>
      <main className="conteudo"><Outlet /></main>
      <footer className="status"><span className="on">Dados da base consolidada (arquivos JSON)</span><span className="dir">Sessão: izabel · Administradora</span></footer>
    </div>
  );
}
