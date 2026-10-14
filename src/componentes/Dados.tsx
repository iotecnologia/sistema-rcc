// Contexto com a base carregada pelo repositório. Qualquer tela usa: const b = useBase();
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BaseDados, Repositorio } from '../repositorio/repositorio';

const Ctx = createContext<BaseDados | null>(null);

export function DadosProvider({ repo, children }: { repo: Repositorio; children: ReactNode }) {
  const [base, setBase] = useState<BaseDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => { repo.carregar().then(setBase).catch((e) => setErro(String(e))); }, [repo]);
  if (erro) return <div className="vazio">Não foi possível carregar os dados: {erro}</div>;
  if (!base) return <div className="vazio">Carregando…</div>;
  return <Ctx.Provider value={base}>{children}</Ctx.Provider>;
}

export function useBase(): BaseDados {
  const b = useContext(Ctx);
  if (!b) throw new Error('useBase fora do DadosProvider');
  return b;
}
