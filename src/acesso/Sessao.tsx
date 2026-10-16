// Login por e-mail + cargo. Mock: a senha não é conferida (repositório público); a senha de verdade entra com o servidor (Fase 3).
// Sessão some ao fechar o navegador (sessionStorage). Cadastro de cargos/usuários fica no navegador até existir o servidor.
import { createContext, useContext, useState, type ReactNode } from 'react';
import base from '../dados/acesso.json';

export interface Cargo { id: string; nome: string; paginas: string[]; descontoMax?: number }
/** Desconto extra máximo (%) que o cargo pode dar no orçamento. Administrador: sem limite (100). */
export const descontoMaximo = (c: Cargo | null) => (!c ? 0 : c.paginas.includes('*') ? 100 : c.descontoMax ?? 0);
export interface Usuario { email: string; nome: string; cargo: string }
interface Acesso { cargos: Cargo[]; usuarios: Usuario[] }

interface Sessao extends Acesso {
  usuario: Usuario | null; cargo: Cargo | null;
  entrar(email: string): boolean; sair(): void; pode(pagina: string): boolean; salvar(a: Acesso): void;
}

const CHAVE_CAD = 'analiza:acesso-v2';
const CHAVE_SES = 'analiza:sessao';
const ler = <T,>(s: Storage, k: string, p: T): T => { try { const v = s.getItem(k); return v ? (JSON.parse(v) as T) : p; } catch { return p; } };
const gravar = (s: Storage, k: string, v: unknown) => { try { if (v === null) s.removeItem(k); else s.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };

const Ctx = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [cad, setCad] = useState<Acesso>(() => ler(localStorage, CHAVE_CAD, base as Acesso));
  const [email, setEmail] = useState<string | null>(() => ler(sessionStorage, CHAVE_SES, null));
  const usuario = cad.usuarios.find((u) => u.email === email) ?? null;
  const cargo = usuario ? cad.cargos.find((c) => c.id === usuario.cargo) ?? null : null;
  const valor: Sessao = {
    ...cad, usuario, cargo,
    entrar(e) {
      const u = cad.usuarios.find((x) => x.email.toLowerCase() === e.trim().toLowerCase());
      if (!u) return false;
      setEmail(u.email); gravar(sessionStorage, CHAVE_SES, u.email); return true;
    },
    sair() { setEmail(null); gravar(sessionStorage, CHAVE_SES, null); },
    pode: (p) => !!cargo && (p === 'ajuda' || cargo.paginas.includes('*') || cargo.paginas.includes(p)),   // 'Como usar' é liberado para todos
    salvar(a) { setCad(a); gravar(localStorage, CHAVE_CAD, a); },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSessao fora do SessaoProvider');
  return s;
}
