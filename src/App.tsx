// Rotas do sistema. O repositório escolhido aqui decide de onde vêm os dados (hoje: JSON; Fase 3: API).
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DadosProvider } from './componentes/Dados';
import { Shell } from './componentes/Shell';
import { repoJson } from './repositorio/repo-json';
import { VisaoGeral } from './telas/VisaoGeral';
import { Consultar } from './telas/Consultar';
import { PassoAPasso } from './telas/PassoAPasso';
import { Convenios } from './telas/Convenios';
import { Exames } from './telas/Exames';
import { Medicos, Ramais, Unidades } from './telas/Atendimento';
import { Orcamento } from './telas/Orcamento';
import { Pendencias } from './telas/Pendencias';

export default function App() {
  return (
    <DadosProvider repo={repoJson}>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<VisaoGeral />} />
            <Route path="consultar" element={<Consultar />} />
            <Route path="passo-a-passo" element={<PassoAPasso />} />
            <Route path="convenios" element={<Convenios />} />
            <Route path="exames" element={<Exames />} />
            <Route path="orcamento" element={<Orcamento />} />
            <Route path="medicos" element={<Medicos />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="ramais" element={<Ramais />} />
            <Route path="pendencias" element={<Pendencias />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DadosProvider>
  );
}
