// Busca geral do cabeçalho: um campo só, em todas as telas. Acha exame (nome falado), convênio, médico, ramal,
// unidade/máquina e página. Mostra só o que o cargo libera. ↑ ↓ escolhe, Enter abre, Esc fecha.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBase } from './Dados';
import { Icone } from './Icone';
import { useSessao } from '../acesso/Sessao';
import { PAGINAS } from '../acesso/paginas';
import { norm } from '../regras/contexto';
import { buscarExames, palavras } from '../regras/busca';

interface Item { grupo: string; titulo: string; sub?: string; ir: string }

// casa pelo começo das palavras: "rm" acha "RM 2", mas não acha "Intermedici"
const casa = (texto: string, q: string) => { const ws = norm(texto).split(/[^A-Z0-9]+/); return palavras(q).every((f) => f.some((x) => ws.some((w) => w.startsWith(x)))); };

export function BuscaGeral() {
  const b = useBase();
  const s = useSessao();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);


  const itens = useMemo<Item[]>(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    const r: Item[] = [];
    if (s.pode('exames')) buscarExames(b, t, 5).forEach((a) => r.push({ grupo: 'Exames', titulo: a.rotulo, sub: a.rotulo !== a.exame.nome ? a.exame.nome : undefined, ir: `/exames?id=${a.exame.id}&rotulo=${encodeURIComponent(a.rotulo)}` }));
    if (s.pode('convenios')) b.convenios.filter((c) => casa(c.nome, t)).slice(0, 5).forEach((c) => r.push({ grupo: 'Convênios', titulo: c.nome, ir: `/convenios?c=${c.slug}` }));
    if (s.pode('medicos')) b.medicos.filter((m) => casa(m.nome, t)).slice(0, 4).forEach((m) => r.push({ grupo: 'Médicos', titulo: m.nome, ir: `/medicos?q=${encodeURIComponent(m.nome)}` }));
    if (s.pode('ramais')) b.ramais.filter((x) => casa(`${x.setor ?? ''} ${x.local} ${(x.numeros ?? []).join(' ')}`, t)).slice(0, 4)
      .forEach((x) => r.push({ grupo: 'Ramais', titulo: `${x.local}${x.numeros?.length ? ' · ' + x.numeros.join(' / ') : ''}`, sub: x.setor ?? undefined, ir: `/ramais?q=${encodeURIComponent(t)}` }));
    if (s.pode('unidades')) b.unidades.filter((u) => casa(u.nome, t)).slice(0, 3).forEach((u) => r.push({ grupo: 'Unidades', titulo: u.nome, sub: u.endereco, ir: '/unidades' }));
    if (s.pode('maquinas')) b.equipamentos.filter((e) => casa(e.nome, t)).slice(0, 4).forEach((e) => r.push({ grupo: 'Máquinas', titulo: e.nome, sub: b.unidades.find((u) => u.id === e.unidade_id)?.nome, ir: `/maquinas?eq=${e.id}` }));
    PAGINAS.filter((p) => s.pode(p.id) && casa(p.nome, t)).forEach((p) => r.push({ grupo: 'Páginas', titulo: p.nome, ir: p.rota }));
    return r;
  }, [b, s, q]);

  const abrir = (it: Item) => { nav(it.ir); setQ(''); setAberto(false); ref.current?.blur(); };
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setI(Math.min(i + 1, itens.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && itens[i]) { e.preventDefault(); abrir(itens[i]); }
    else if (e.key === 'Escape') { setAberto(false); ref.current?.blur(); }
  };

  return (
    <div className="busca-geral">
      <Icone n="busca" />
      <input ref={ref} type="search" value={q} placeholder="Buscar exame, convênio, médico, ramal…" autoComplete="off" aria-label="Busca geral"
        onChange={(e) => { setQ(e.target.value); setI(0); setAberto(true); }} onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)} onKeyDown={tecla} />
      {aberto && q.trim().length >= 2 && (
        <div className="busca-geral-lista" role="listbox">
          {itens.length ? itens.map((it, k) => (
            <div key={k}>
              {(k === 0 || itens[k - 1].grupo !== it.grupo) && <div className="combo-grupo">{it.grupo}</div>}
              <button type="button" role="option" aria-selected={k === i} className={k === i ? 'foco' : ''}
                onMouseDown={(e) => { e.preventDefault(); abrir(it); }} onMouseEnter={() => setI(k)}>
                <span>{it.titulo}</span>{it.sub && <small>{it.sub}</small>}
              </button>
            </div>
          )) : <div className="combo-vazio">Nada encontrado para “{q}”.</div>}
        </div>
      )}
    </div>
  );
}
