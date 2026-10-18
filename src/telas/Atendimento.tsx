// Atendimento: Médicos, Unidades e máquinas, Ramais. Nada de lista despejada: médicos e ramais só aparecem depois da busca.
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { norm } from '../regras/contexto';
import { palavras } from '../regras/busca';
import { br, hojeIso } from '../regras/calendario';

/** Busca que veio do cabeçalho (?q=) já entra preenchida. */
function useQ(): [string, (v: string) => void] {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  useEffect(() => { const v = params.get('q'); if (v !== null) setQ(v); }, [params]);
  return [q, setQ];
}

const casa = (texto: string, q: string) => { const h = norm(texto); return palavras(q).every((f) => f.some((x) => h.includes(x))); };

function Busca({ rot, q, setQ, ph }: { rot: string; q: string; setQ: (v: string) => void; ph: string }) {
  return <div className="barra"><label className="cp f" style={{ flex: '1 1 360px' }}><span>{rot}</span><Icone n="busca" /><input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} /></label></div>;
}

/** Nome do exame do médico no padrão "SIGLA - Nome" (só na tela; os dados e as regras de agenda continuam como estão). */
const NOME_EXAME: Record<string, string> = {
  'ABDOME TOTAL': 'US - Abdome total', 'ABDOME TOTAL+ SUPERIOR+ INFERIOR': 'US - Abdome total, superior e inferior', 'ABDOMEM TOTAL E INFERIOR': 'US - Abdome total e inferior',
  'APARELHO URINARIO': 'US - Aparelho urinário', 'BOLSA ESCROTAL / SEM E COM DOPPLER': 'US - Bolsa escrotal, sem e com doppler',
  'DOPPLER DE MEMBROS INFERIORES (NAO AVALIA VARIZES)': 'US - Doppler de membros inferiores (não avalia varizes)',
  'ECO MAMARIA COM DOPPLER': 'US - Mamas com doppler', 'MAMA': 'US - Mamas', 'TIREOIDE': 'US - Tireoide', 'PARATIREOIDE': 'US - Paratireoide',
  'TIREOIDE/ TIREOIDE COM DOPPLER': 'US - Tireoide, com ou sem doppler', 'ANGIO TOMO DE CORONARIAS': 'TC - Angiotomografia coronariana', 'RM CORACAO': 'RM - Coração',
};
function nomeExame(n: string): string {
  const k = norm(n);
  if (NOME_EXAME[k]) return NOME_EXAME[k];
  const t = n.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
  return 'US - ' + t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
const MODALIDADE: Record<string, string> = { US: 'Ultrassom', TC: 'Tomografia', RM: 'Ressonância' };
const iniciais = (nome: string) => { const p = nome.replace(/^Dra?\.\s*/, '').split(' ').filter(Boolean); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };

const Linha = ({ rot, children, aviso, um }: { rot?: string; children: ReactNode; aviso?: boolean; um?: boolean }) =>
  <div className={'p1-linha' + (aviso ? ' aviso' : '') + (um ? ' um' : '')}>{rot !== undefined && <span className="p1-rot">{rot}</span>}<span>{children}</span></div>;

type Sel = { t: 'medico'; id: number } | { t: 'exame'; nome: string } | null;
type Item = { t: 'exame'; nome: string; rot: string; hint?: string } | { t: 'medico'; id: number; rot: string; hint?: string };

export function Medicos() {
  const b = useBase();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Sel>(null);
  const [aberto, setAberto] = useState(false);
  const [i, setI] = useState(0);
  const hoje = hojeIso();
  const examesDe = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const x of b.medicoExames) m.set(x.medico_id, [...new Set([...(m.get(x.medico_id) ?? []), nomeExame(x.exame_nome)])]);
    return m;
  }, [b]);
  const todosExames = useMemo(() => [...new Set(b.medicoExames.map((x) => nomeExame(x.exame_nome)))].sort((x, y) => x.localeCompare(y)), [b]);

  // veio da busca do cabeçalho (?q=): se for um médico ou um exame exato, já abre
  useEffect(() => {
    const v = params.get('q'); if (v === null) return;
    const n = norm(v); setQ(v);
    const m = b.medicos.find((x) => norm(x.nome) === n);
    const e = todosExames.find((x) => norm(x) === n);
    if (m) setSel({ t: 'medico', id: m.id }); else if (e) setSel({ t: 'exame', nome: e }); else { setSel(null); setAberto(true); }
  }, [params, b, todosExames]);

  const itens: Item[] = useMemo(() => {
    if (q.trim().length < 2) return [];
    const ex: Item[] = todosExames.filter((n) => casa(n, q)).slice(0, 8).map((n) => ({ t: 'exame', nome: n, rot: n }));
    const md: Item[] = b.medicos.filter((m) => casa(m.nome, q) || (examesDe.get(m.id) ?? []).some((n) => casa(n, q))).slice(0, 6)
      .map((m) => ({ t: 'medico', id: m.id, rot: m.nome, hint: casa(m.nome, q) ? undefined : `faz ${((examesDe.get(m.id) ?? []).find((n) => casa(n, q)) ?? '').replace(/^\w+ - /, '')}` }));
    return [...ex, ...md];
  }, [b, q, todosExames, examesDe]);

  const escolher = (it: Item) => { setSel(it.t === 'medico' ? { t: 'medico', id: it.id } : { t: 'exame', nome: it.nome }); setQ(it.rot); setAberto(false); };
  const tecla = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setAberto(true); setI(Math.min(i + 1, itens.length - 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (ev.key === 'Enter' && itens[i]) { ev.preventDefault(); escolher(itens[i]); }
    else if (ev.key === 'Escape') setAberto(false);
  };
  const abrirMedico = (id: number, nome: string) => { setSel({ t: 'medico', id }); setQ(nome); };

  const agendaDe = (id: number) => b.medicoAgendas.filter((a) => a.medico_id === id && (a.tipo === 'recorrente' || (a.data ?? '') >= hoje));
  const restricoesDe = (id: number) => b.medicoRestricoes.filter((r) => r.medico_id === id);
  const med = sel?.t === 'medico' ? b.medicos.find((x) => x.id === sel.id) : undefined;
  const quemFaz = sel?.t === 'exame' ? b.medicos.filter((m) => (examesDe.get(m.id) ?? []).includes(sel.nome)) : [];

  return (
    <>
      <TituloPagina titulo="Médicos" sub="Digite o exame ou o nome do médico e escolha na lista." />
      <div className="busca-conv">
        <Icone n="busca" />
        <input type="search" autoFocus value={q} autoComplete="off" placeholder="Exame ou médico… (ex.: doppler, Dra. Sofia)"
          onChange={(x) => { setQ(x.target.value); setSel(null); setI(0); setAberto(true); }} onFocus={() => q.trim() && setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)} onKeyDown={tecla} />
        {aberto && q.trim().length > 0 && (
          <div className="combo-lista" role="listbox">
            {itens.length ? itens.map((it, k) => (
              <div key={it.t + (it.t === 'medico' ? it.id : it.nome)}>
                {(k === 0 || itens[k - 1].t !== it.t) && <div className="combo-grupo">{it.t === 'exame' ? 'Exames' : 'Médicos'}</div>}
                <button type="button" role="option" aria-selected={k === i} className={k === i ? 'foco' : ''}
                  onMouseDown={(ev) => { ev.preventDefault(); escolher(it); }} onMouseEnter={() => setI(k)}>
                  <span>{it.rot}</span>{it.hint && <small>{it.hint}</small>}
                </button>
              </div>
            )) : <div className="combo-vazio">{q.trim().length < 2 ? 'Digite pelo menos 2 letras.' : <>Nada encontrado para “{q}”.</>}</div>}
          </div>
        )}
      </div>

      {!med && sel?.t !== 'exame' ? <div className="bloco"><Vazio>{q.trim() ? 'Escolha na lista.' : 'Digite o exame ou o nome do médico.'}</Vazio></div> : null}

      {med && (() => {
        const exs = examesDe.get(med.id) ?? [];
        const mods = [...new Set(exs.map((n) => MODALIDADE[n.split(' - ')[0]]).filter(Boolean))];
        const ag = agendaDe(med.id), rs = restricoesDe(med.id);
        return (
          <div className="conv-detalhe">
            <div className="conv-cab bloco"><div className="med-av">{iniciais(med.nome)}</div>
              <div><b>{med.nome}</b><span className="mut">{[mods.join(' · '), med.crm ? `CRM ${med.crm}` : ''].filter(Boolean).join(' · ')}</span></div></div>
            <div className="grade2">
              <div className="coluna">
                <Bloco titulo="Faz" extra={<span className="mut" style={{ fontSize: 13 }}>{exs.length} exame{exs.length === 1 ? '' : 's'}</span>}>
                  <div className="pad-l">{exs.map((n) => <Linha key={n} um>{n}</Linha>)}</div>
                </Bloco>
              </div>
              <div className="coluna">
                <Bloco titulo="Agenda"><div className="pad-l">
                  <Linha rot="Atende">{med.agenda_todos_os_dias ? 'Todos os dias' : 'Não atende todos os dias'}</Linha>
                  {ag.map((a, k) => <Linha key={k} rot={a.tipo === 'recorrente' ? `Toda ${a.dia_semana}` : br(a.data!)}>{a.inicio}–{a.fim}</Linha>)}
                </div></Bloco>
                {rs.length > 0 && <Bloco titulo="Atenção"><div className="pad-l">{rs.map((r, k) => <Linha key={k} aviso um>{r.texto}</Linha>)}</div></Bloco>}
              </div>
            </div>
          </div>
        );
      })()}

      {sel?.t === 'exame' && (
        <div className="conv-detalhe">
          <div className="conv-cab bloco"><div><b>Quem faz: {sel.nome}</b></div></div>
          <Bloco titulo="Médicos" extra={<span className="mut" style={{ fontSize: 13 }}>{quemFaz.length} médico{quemFaz.length === 1 ? '' : 's'}</span>}>
            <div className="pad-l">{quemFaz.map((m) => {
              const ag = agendaDe(m.id);
              return (
                <div key={m.id}>
                  <Linha rot={m.nome}>{m.agenda_todos_os_dias ? 'Todos os dias' : 'Não atende todos os dias'}{ag.length > 0 && <span className="mut"> · {ag.map((a) => `${a.tipo === 'recorrente' ? a.dia_semana : br(a.data!)} ${a.inicio}–${a.fim}`).join(' · ')}</span>}
                    {' '}<button type="button" className="tour-link" onClick={() => abrirMedico(m.id, m.nome)}>ver médico</button></Linha>
                  {restricoesDe(m.id).map((r, k) => <Linha key={k} rot="Atenção" aviso>{r.texto}</Linha>)}
                </div>
              );
            })}</div>
          </Bloco>
        </div>
      )}
    </>
  );
}

export function Unidades() {
  const b = useBase();
  const [params] = useSearchParams();
  const [eq, setEq] = useState(Number(params.get('eq')) || (b.equipamentos[0]?.id ?? 0));
  useEffect(() => { const v = Number(params.get('eq')); if (v) setEq(v); }, [params]);
  const itens = b.equipamentoExames.filter((x) => x.equipamento_id === eq);
  const q = b.equipamentos.find((x) => x.id === eq);
  return (
    <>
      <TituloPagina titulo="Unidades e máquinas" sub="Endereço, telefone e horário de cada unidade. Escolha a máquina para ver quanto tempo cada exame ocupa." />
      <div className="grade-cards" style={{ marginBottom: 14 }}>
        {b.unidades.map((u) => (
          <Bloco key={u.id} titulo={u.nome}>
            <div className="pad" style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
              <span>{u.endereco} · CEP {u.cep}</span><span>{u.telefones}</span>{u.whatsapp && <span>WhatsApp: {u.whatsapp}</span>}<span className="mut">{u.horario_atendimento}</span>
            </div>
          </Bloco>
        ))}
      </div>
      <div className="abas">{b.equipamentos.map((x) => <button type="button" key={x.id} className={eq === x.id ? 'on' : ''} onClick={() => setEq(x.id)}>{x.nome}</button>)}</div>
      <Bloco titulo={`${q?.nome} · peso máximo ${q?.peso_max_kg} kg`} extra={<span className="mut" style={{ fontSize: 12 }}>{b.unidades.find((u) => u.id === q?.unidade_id)?.nome}</span>}>
        <table className="tab"><thead><tr><th>Exame</th><th>Horários</th><th>Tempo</th><th>Observação</th></tr></thead>
          <tbody>{itens.map((x, i) => <tr key={i}><td>{x.exame_nome}</td><td>{x.horarios ?? '—'}</td><td>{x.minutos ? `${x.minutos} min` : '—'}</td>
            <td className="mut">{[x.contraste && 'contraste: ' + x.contraste, x.condicao_paciente, x.periodo && 'só ' + x.periodo].filter(Boolean).join(' · ') || '—'}</td></tr>)}</tbody></table>
      </Bloco>
      {b.avisos.length > 0 && <div style={{ marginTop: 14 }}><Bloco titulo="Avisos das máquinas"><ul className="feed">{b.avisos.map((a) => <li key={a.id}><span className="dot"><Icone n="info" /></span><div className="preparo-txt">{a.texto}</div></li>)}</ul></Bloco></div>}
    </>
  );
}

export function Ramais() {
  const b = useBase();
  const [q, setQ] = useQ();
  const lista = q.trim().length < 2 ? [] : b.ramais.filter((r) => casa(`${r.setor ?? ''} ${r.local} ${(r.numeros ?? []).join(' ')}`, q));
  const grupo = (r: (typeof lista)[number]) => `${r.setor ?? 'Geral'}`;
  const grupos = [...new Set(lista.map(grupo))];
  return (
    <>
      <TituloPagina titulo="Ramais" sub="Digite o setor ou o número." />
      <Busca rot="Buscar ramal" q={q} setQ={setQ} ph="ex.: recepção, doppler, autorização, 5767" />
      {!q.trim() ? <div className="bloco"><Vazio>Digite o setor ou o número. {b.ramais.length} ramais cadastrados.</Vazio></div> : !lista.length ? <div className="bloco"><Vazio>Nenhum ramal para “{q}”.</Vazio></div> : (
        <div className="grade-cards">{grupos.map((g) => (
          <Bloco key={g} titulo={g}>
            <table className="tab"><tbody>{lista.filter((r) => grupo(r) === g).map((r) => (
              <tr key={r.id}><td>{r.local}</td><td className="cod" style={{ textAlign: 'right' }}>{r.numeros?.join(' / ') ?? <span className="mut">sem número</span>}</td></tr>
            ))}</tbody></table>
          </Bloco>
        ))}</div>
      )}
    </>
  );
}
