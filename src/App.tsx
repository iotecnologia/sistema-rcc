// Rotas. Sem login → tela de entrada. Cada página só abre se o cargo do usuário tiver permissão.
import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DadosProvider } from './componentes/Dados';
import { Shell } from './componentes/Shell';
import { Vazio } from './componentes/Comuns';
import { repoJson } from './repositorio/repo-json';
import { SessaoProvider, useSessao } from './acesso/Sessao';
import { AvisosProvider } from './acesso/Avisos';
import { Avisos } from './telas/Avisos';
import { PAGINAS } from './acesso/paginas';
import { Login } from './telas/Login';
import { VisaoGeral } from './telas/VisaoGeral';
import { VisaoGeralAnterior } from './telas/VisaoGeralAnterior';
import { Consultar } from './telas/Consultar';
import { Convenios } from './telas/Convenios';
import { PassoAPasso } from './telas/PassoAPasso';
import { Exames } from './telas/Exames';
import { Janela } from './telas/Janela';
import { Orcamento } from './telas/Orcamento';
import { Maquinas, Medicos, Ramais, Unidades } from './telas/Atendimento';
import { Cadastros } from './telas/Cadastros';
import { Usuarios } from './telas/Usuarios';
import { ComoUsar } from './telas/ComoUsar';

const TELAS: Record<string, ReactNode> = {
  inicio: <VisaoGeral />, consultar: <Consultar />, convenios: <Convenios />, agendar: <PassoAPasso />, exames: <Exames />, janela: <Janela />,
  orcamento: <Orcamento />, medicos: <Medicos />, maquinas: <Maquinas />, unidades: <Unidades />, ramais: <Ramais />, avisos: <Avisos />, cadastros: <Cadastros />, usuarios: <Usuarios />, ajuda: <ComoUsar />,
};

function Rotas() {
  const s = useSessao();
  if (!s.usuario) return <Login />;
  const inicio = PAGINAS.find((p) => s.pode(p.id));
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={inicio ? <Navigate to={inicio.rota} replace /> : <Vazio>Seu cargo não tem nenhuma página liberada. Fale com a administração.</Vazio>} />
        {PAGINAS.map((p) => (
          <Route key={p.id} path={p.rota.slice(1)} element={s.pode(p.id) ? TELAS[p.id] : <Vazio>Sem permissão para abrir “{p.nome}”. Fale com a administração.</Vazio>} />
        ))}
        {/* comparação: versão anterior da Visão geral (decisão pendente) */}
        <Route path="inicio-anterior" element={s.pode('inicio') ? <VisaoGeralAnterior /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <DadosProvider repo={repoJson}>
      <SessaoProvider>
        <AvisosProvider><HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Rotas /></HashRouter></AvisosProvider>
      </SessaoProvider>
    </DadosProvider>
  );
}
