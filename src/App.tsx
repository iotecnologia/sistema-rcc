// Rotas. Sem login → tela de entrada. Cada página só abre se o cargo do usuário tiver permissão.
import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DadosProvider } from './componentes/Dados';
import { Shell } from './componentes/Shell';
import { Vazio } from './componentes/Comuns';
import { repoJson } from './repositorio/repo-json';
import { SessaoProvider, useSessao } from './acesso/Sessao';
import { PAGINAS } from './acesso/paginas';
import { Login } from './telas/Login';
import { PassoAPasso } from './telas/PassoAPasso';
import { RegrasConvenio } from './telas/RegrasConvenio';
import { Orcamento } from './telas/Orcamento';
import { Contatos, Maquinas, Medicos, Preparos } from './telas/Atendimento';
import { Consultar } from './telas/Consultar';
import { Convenios } from './telas/Convenios';
import { Exames } from './telas/Exames';
import { Pendencias } from './telas/Pendencias';
import { Usuarios } from './telas/Usuarios';

const TELAS: Record<string, ReactNode> = {
  agendar: <PassoAPasso />, convenio: <RegrasConvenio />, orcamento: <Orcamento />, preparos: <Preparos />, contatos: <Contatos />,
  consultar: <Consultar />, convenios: <Convenios />, exames: <Exames />,
  medicos: <Medicos />, maquinas: <Maquinas />, pendencias: <Pendencias />, usuarios: <Usuarios />,
};

function Rotas() {
  const s = useSessao();
  if (!s.usuario) return <Login />;
  const inicio = PAGINAS.find((p) => s.pode(p.id));
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={inicio ? <Navigate to={inicio.rota} replace /> : <Vazio>Seu cargo não tem nenhuma página liberada. Fale com o administrador.</Vazio>} />
        {PAGINAS.map((p) => (
          <Route key={p.id} path={p.rota.slice(1)} element={s.pode(p.id) ? TELAS[p.id] : <Vazio>Sem permissão para abrir “{p.nome}”. Fale com o administrador.</Vazio>} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <DadosProvider repo={repoJson}>
      <SessaoProvider>
        <HashRouter><Rotas /></HashRouter>
      </SessaoProvider>
    </DadosProvider>
  );
}
