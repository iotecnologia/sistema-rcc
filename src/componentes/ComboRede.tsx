// Campo da rede (Bradesco) ou do plano (SulAmérica) do paciente: digitar e escolher na lista suspensa. Não trava a consulta.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useBase } from './Dados';
import { norm } from '../regras/contexto';
import { redesDoConvenio, rotuloRede } from '../regras/rede';

export function ComboRede({ convenio, valor, mudar, passo }: { convenio: string; valor: string; mudar: (nome: string) => void; passo?: number }) {
  const b = useBase();
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const redes = useMemo(() => redesDoConvenio(b, convenio), [b, convenio]);
  const rot = rotuloRede(convenio);
  const poucas = redes.length <= 10;   // lista curta (ex.: planos da SulAmérica): mostra tudo ao clicar, sem precisar digitar
  const lista = useMemo(() => (q.trim() ? redes.filter((r) => norm(r.nome).includes(norm(q.trim()))).slice(0, 30) : poucas ? redes : []), [redes, q, poucas]);
  const escolher = (nome: string) => { mudar(nome); setAberto(false); setQ(''); ref.current?.blur(); };
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setI(Math.min(i + 1, lista.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && aberto && lista[i]) { e.preventDefault(); escolher(lista[i].nome); }
    else if (e.key === 'Escape') { setAberto(false); setQ(''); }
  };
  return (
    <label className="cp combo rede">
      <span>{passo && <span className="passo">{passo}</span>}{rot} <small style={{ fontWeight: 400, textTransform: 'none' }}>(na carteirinha)</small></span>
      <div className="combo-campo">
        <input ref={ref} value={aberto ? q : valor} placeholder={poucas ? `Escolha o ${rot.toLowerCase()}…` : `Digite a ${rot.toLowerCase()}…`} autoComplete="off"
          onFocus={() => { setAberto(true); setI(0); }} onBlur={() => setTimeout(() => { setAberto(false); setQ(''); }, 150)}
          onChange={(e) => { setQ(e.target.value); setI(0); setAberto(true); if (valor) mudar(''); }} onKeyDown={tecla} />
      </div>
      {aberto && (q.trim() !== '' || poucas) && (
        <div className="combo-lista" role="listbox">
          {lista.length ? lista.map((r, k) => (
            <button type="button" key={r.nome} role="option" aria-selected={r.nome === valor} className={(k === i ? 'foco ' : '') + (r.nome === valor ? 'sel' : '')}
              onMouseDown={(e) => { e.preventDefault(); escolher(r.nome); }} onMouseEnter={() => setI(k)}>
              <span>{r.nome}</span>
            </button>
          )) : <div className="combo-vazio">{rot} “{q}” não cadastrad{rot === 'Plano' ? 'o' : 'a'}. Confirme com a supervisão.</div>}
        </div>
      )}
    </label>
  );
}
