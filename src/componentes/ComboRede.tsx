// Campo da rede do paciente (só aparece no Bradesco): digitar e escolher na lista suspensa. Não trava a consulta.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useBase } from './Dados';
import { norm } from '../regras/contexto';
import { redesDoConvenio } from '../regras/rede';

export function ComboRede({ convenio, valor, mudar, passo }: { convenio: string; valor: string; mudar: (nome: string) => void; passo?: number }) {
  const b = useBase();
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const redes = useMemo(() => redesDoConvenio(b, convenio), [b, convenio]);
  const lista = useMemo(() => (q.trim() ? redes.filter((r) => norm(r.nome).includes(norm(q.trim()))).slice(0, 30) : []), [redes, q]);
  const escolher = (nome: string) => { mudar(nome); setAberto(false); setQ(''); ref.current?.blur(); };
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setI(Math.min(i + 1, lista.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && aberto && lista[i]) { e.preventDefault(); escolher(lista[i].nome); }
    else if (e.key === 'Escape') { setAberto(false); setQ(''); }
  };
  return (
    <label className="cp combo rede">
      <span>{passo && <span className="passo">{passo}</span>}Rede <small style={{ fontWeight: 400, textTransform: 'none' }}>(na carteirinha)</small></span>
      <div className="combo-campo">
        <input ref={ref} value={aberto ? q : valor} placeholder="Digite a rede…" autoComplete="off"
          onFocus={() => { setAberto(true); setI(0); }} onBlur={() => setTimeout(() => { setAberto(false); setQ(''); }, 150)}
          onChange={(e) => { setQ(e.target.value); setI(0); setAberto(true); if (valor) mudar(''); }} onKeyDown={tecla} />
      </div>
      {aberto && q.trim() !== '' && (
        <div className="combo-lista" role="listbox">
          {lista.length ? lista.map((r, k) => (
            <button type="button" key={r.nome} role="option" aria-selected={r.nome === valor} className={(k === i ? 'foco ' : '') + (r.nome === valor ? 'sel' : '')}
              onMouseDown={(e) => { e.preventDefault(); escolher(r.nome); }} onMouseEnter={() => setI(k)}>
              <span>{r.nome}</span>
            </button>
          )) : <div className="combo-vazio">Rede “{q}” não cadastrada. Confirme com a supervisão.</div>}
        </div>
      )}
    </label>
  );
}
