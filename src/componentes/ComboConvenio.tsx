// Campo de convênio: lista suspensa + busca por digitação (com logo). Teclado: ↑ ↓ para escolher, Enter confirma, Esc fecha.
import { Fragment, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useBase } from './Dados';
import { Icone } from './Icone';
import { norm } from '../regras/contexto';
import { LogoConvenio, temInfo } from '../telas/Convenios';

export function ComboConvenio({ valor, mudar, rotulo = 'Convênio', passo, flex = '1 1 260px', soComRegras }: {
  valor: string; mudar: (slug: string) => void; rotulo?: string; passo?: number; flex?: string; soComRegras?: boolean;
}) {
  const b = useBase();
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const sel = b.convenios.find((c) => c.slug === valor);
  // dois grupos: convênios com regras primeiro; depois os que o pedido já vem autorizado
  const [comRegras, autorizados] = useMemo(() => {
    const todos = [...b.convenios].filter((c) => norm(c.nome).includes(norm(q))).sort((a, c) => a.nome.localeCompare(c.nome));
    return [todos.filter((c) => temInfo(b, c)), soComRegras ? [] : todos.filter((c) => !temInfo(b, c))];
  }, [b, q, soComRegras]);
  const lista = useMemo(() => [...comRegras, ...autorizados], [comRegras, autorizados]);
  const escolher = (slug: string) => { mudar(slug); setAberto(false); setQ(''); ref.current?.blur(); };
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setI(Math.min(i + 1, lista.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && aberto && lista[i]) { e.preventDefault(); escolher(lista[i].slug); }
    else if (e.key === 'Escape') { setAberto(false); setQ(''); }
  };
  return (
    <label className="cp combo" style={{ flex }}>
      <span>{passo && <span className="passo">{passo}</span>}{rotulo}</span>
      <div className="combo-campo">
        {sel && !aberto && <span className="combo-logo"><LogoConvenio c={sel} tam={22} /></span>}
        <input ref={ref} value={aberto ? q : sel?.nome ?? ''} placeholder="Digite ou escolha o convênio…" autoComplete="off"
          className={sel && !aberto ? 'com-logo' : ''}
          onFocus={() => { setAberto(true); setI(0); }} onBlur={() => setTimeout(() => { setAberto(false); setQ(''); }, 150)}
          onChange={(e) => { setQ(e.target.value); setI(0); setAberto(true); }} onKeyDown={tecla} />
        <button type="button" className="combo-seta" tabIndex={-1} aria-label="Abrir lista de convênios" onMouseDown={(e) => { e.preventDefault(); if (aberto) { ref.current?.blur(); } else ref.current?.focus(); }}><Icone n="seta" /></button>
      </div>
      {aberto && (
        <div className="combo-lista" role="listbox">
          {lista.length ? lista.map((c, k) => (
            <Fragment key={c.slug}>
              {k === 0 && comRegras.length > 0 && <div className="combo-grupo">Convênios com regras</div>}
              {k === comRegras.length && <div className="combo-grupo">Pedido já vem autorizado</div>}
              <button type="button" role="option" aria-selected={c.slug === valor} className={(k === i ? 'foco ' : '') + (c.slug === valor ? 'sel' : '')}
                onMouseDown={(e) => { e.preventDefault(); escolher(c.slug); }} onMouseEnter={() => setI(k)}>
                <LogoConvenio c={c} tam={24} /><span>{c.nome}</span>
              </button>
            </Fragment>
          )) : <div className="combo-vazio">Nenhum convênio com “{q}”.</div>}
        </div>
      )}
    </label>
  );
}
