// Avisos da equipe: a líder publica (cargo com a página "Avisos"); todos leem e confirmam "Li e entendi".
// Mock: fica salvo neste navegador. No sistema final, fica no banco e chega para todos.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useSessao } from './Sessao';
import { hojeIso } from '../regras/calendario';

export type TipoAviso = 'urgente' | 'importante' | 'informativo';
export interface Aviso {
  id: string; titulo: string; texto: string; tipo: TipoAviso; validoAte: string; para: string; // 'todos' ou id do cargo
  autor: string; criadoEm: string; ativo: boolean;
}
interface Leitura { email: string; quando: string }
interface Estado { avisos: Aviso[]; leituras: Record<string, Leitura[]> }
interface AvisosCtx extends Estado {
  visiveis: Aviso[]; naoLidos: Aviso[];
  publicar(a: Omit<Aviso, 'id' | 'autor' | 'criadoEm' | 'ativo'>): void; encerrar(id: string): void; lido(id: string): void; leu(id: string, email?: string): boolean;
}

const CHAVE = 'analiza:avisos-equipe';
const ler = (): Estado => { try { const v = localStorage.getItem(CHAVE); return v ? (JSON.parse(v) as Estado) : { avisos: [], leituras: {} }; } catch { return { avisos: [], leituras: {} }; } };
const gravar = (e: Estado) => { try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* sem armazenamento */ } };
const ORDEM: Record<TipoAviso, number> = { urgente: 0, importante: 1, informativo: 2 };

const Ctx = createContext<AvisosCtx | null>(null);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const s = useSessao();
  const [e, setE] = useState<Estado>(ler);
  const salvar = (n: Estado) => { setE(n); gravar(n); };
  const hoje = hojeIso();
  const email = s.usuario?.email ?? '';
  const leu = (id: string, quem = email) => (e.leituras[id] ?? []).some((l) => l.email === quem);
  const visiveis = e.avisos.filter((a) => a.ativo && a.validoAte >= hoje && (a.para === 'todos' || a.para === s.usuario?.cargo))
    .sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo] || b.criadoEm.localeCompare(a.criadoEm));
  const valor: AvisosCtx = {
    ...e, visiveis, naoLidos: visiveis.filter((a) => !leu(a.id)), leu,
    publicar(a) { salvar({ ...e, avisos: [{ ...a, id: 'av' + Date.now(), autor: s.usuario?.nome ?? '', criadoEm: new Date().toISOString(), ativo: true }, ...e.avisos] }); },
    encerrar(id) { salvar({ ...e, avisos: e.avisos.map((a) => (a.id === id ? { ...a, ativo: false } : a)) }); },
    lido(id) { if (!email || leu(id)) return; salvar({ ...e, leituras: { ...e.leituras, [id]: [...(e.leituras[id] ?? []), { email, quando: new Date().toISOString() }] } }); },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAvisos(): AvisosCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAvisos fora do AvisosProvider');
  return c;
}

export const ROTULO_TIPO: Record<TipoAviso, string> = { urgente: 'Urgente', importante: 'Importante', informativo: 'Informativo' };
