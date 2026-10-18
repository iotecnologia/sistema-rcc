// Atendimento: Médicos, Unidades e máquinas, Ramais. Nada de lista despejada: médicos e ramais só aparecem depois da busca.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { Copiar } from '../componentes/Copiar';
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

const Linha = ({ rot, children, aviso, um }: { rot?: string; children: ReactNode; aviso?: boolean; um?: boolean }) =>
  <div className={'p1-linha' + (aviso ? ' aviso' : '') + (um ? ' um' : '')}>{rot !== undefined && <span className="p1-rot">{rot}</span>}<span>{children}</span></div>;

const dias = (m: { agenda_todos_os_dias: boolean }) => (m.agenda_todos_os_dias ? 'Todos os dias' : 'Dias específicos');

/** Médicos em catálogo (mesmo estilo dos Convênios): toda a equipe à vista, a busca filtra por nome ou exame; o card abre o médico. */
export function Medicos() {
  const b = useBase();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState('');
  const hoje = hojeIso();
  const examesDe = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const x of b.medicoExames) m.set(x.medico_id, [...new Set([...(m.get(x.medico_id) ?? []), nomeExame(x.exame_nome)])]);
    return m;
  }, [b]);
  const med = b.medicos.find((x) => String(x.id) === params.get('m'));

  // veio da busca do cabeçalho (?q=): médico exato abre direto; senão entra como filtro
  useEffect(() => {
    const v = params.get('q'); if (v === null) return;
    const m = b.medicos.find((x) => norm(x.nome) === norm(v));
    if (m) setParams({ m: String(m.id) }, { replace: true }); else setFiltro(v);
  }, [params, b, setParams]);

  const lista = useMemo(() => b.medicos.filter((m) => !filtro.trim() || casa(m.nome, filtro) || (examesDe.get(m.id) ?? []).some((n) => casa(n, filtro))), [b, filtro, examesDe]);
  const ehUS = (id: number) => (examesDe.get(id) ?? []).some((n) => n.startsWith('US'));
  const grupos = [
    { tit: 'Ultrassom', lista: lista.filter((m) => ehUS(m.id)) },
    { tit: 'Tomografia e ressonância', lista: lista.filter((m) => !ehUS(m.id)) },
  ].filter((g) => g.lista.length);

  const agendaDe = (id: number) => b.medicoAgendas.filter((a) => a.medico_id === id && (a.tipo === 'recorrente' || (a.data ?? '') >= hoje));
  const restricoesDe = (id: number) => b.medicoRestricoes.filter((r) => r.medico_id === id);
  const exs = med ? examesDe.get(med.id) ?? [] : [];
  const mods = [...new Set(exs.map((n) => MODALIDADE[n.split(' - ')[0]]).filter(Boolean))];

  return (
    <>
      <TituloPagina titulo={med ? med.nome : 'Médicos'} sub={med ? [mods.join(' · '), med.crm ? `CRM ${med.crm}` : ''].filter(Boolean).join(' · ') : 'Digite ou toque no médico. Também dá para buscar pelo exame.'}>
        {med && <button type="button" className="btn2 ic" onClick={() => setParams({})} title="Voltar aos médicos" aria-label="Voltar aos médicos"><Icone n="volta" /></button>}
      </TituloPagina>

      {!med && <>
        <div className="busca-conv"><Icone n="busca" /><input type="search" autoFocus value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nome do médico ou do exame…" /></div>
        {grupos.map((g) => (
          <section key={g.tit} className="grupo-conv">
            <h3>{g.tit} <span className="mut">· {g.lista.length} médico{g.lista.length === 1 ? '' : 's'}</span></h3>
            <div className="cards-med">
              {g.lista.map((m) => {
                const feitos = examesDe.get(m.id) ?? [];
                const faz = filtro.trim() && !casa(m.nome, filtro) ? feitos.find((n) => casa(n, filtro)) : undefined;
                return (
                  <button type="button" key={m.id} className="med-card" onClick={() => setParams({ m: String(m.id) })}>
                    <span className="med-av"><Icone n="estetoscopio" /></span>
                    <span className="med-inf"><b>{m.nome}</b><span className="mut">{feitos.length} exame{feitos.length === 1 ? '' : 's'}</span>{faz && <span className="med-faz">faz {faz.replace(/^\w+ - /, '')}</span>}</span>
                    <span className={'med-tag' + (m.agenda_todos_os_dias ? '' : ' esp')}>{dias(m)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {!lista.length && <Vazio>Nenhum médico ou exame com “{filtro}”.</Vazio>}
      </>}

      {med && (() => {
        const ag = agendaDe(med.id), rs = restricoesDe(med.id);
        return (
          <div className="conv-detalhe">
            <div className="grade2">
              <div className="coluna">
                <Bloco titulo="Faz" extra={<span className="mut" style={{ fontSize: 13 }}>{exs.length} exame{exs.length === 1 ? '' : 's'}</span>}>
                  <div className="pad-l">{exs.map((n) => <Linha key={n} um>{n}</Linha>)}</div>
                </Bloco>
              </div>
              <div className="coluna">
                <Bloco titulo="Agenda"><div className="pad-l">
                  <Linha rot="Atende">{dias(med)}</Linha>
                  {ag.map((a, k) => <Linha key={k} rot={a.tipo === 'recorrente' ? `Toda ${a.dia_semana}` : br(a.data!)}>{a.inicio}–{a.fim}</Linha>)}
                </div></Bloco>
                {rs.length > 0 && <Bloco titulo="Atenção"><div className="pad-l">{rs.map((r, k) => <Linha key={k} aviso um>{r.texto}</Linha>)}</div></Bloco>}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

/** "(19) 3736-3481 Radiologia · (19) 3739-3333 RM e TC" → um telefone por linha, com o número separado do nome. */
const contatos = (texto: string | null | undefined) => (texto ?? '').split(' · ').map((x) => x.trim()).filter(Boolean).map((x) => {
  const m = x.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/);
  return { num: m?.[0] ?? '', rot: x.replace(m?.[0] ?? '', '').trim() };
}).filter((c) => c.num);

/** Unidades: um quadro por unidade (endereço, telefones com copiar, horário e as máquinas dela). */
export function Unidades() {
  const b = useBase();
  return (
    <>
      <TituloPagina titulo="Unidades" sub="Endereço, telefones e horário de cada unidade da RCC." />
      <div className="unidade-grid">
        {b.unidades.map((u) => {
          const fones = contatos(u.telefones), zaps = contatos(u.whatsapp);
          const maqs = b.equipamentos.filter((e) => e.unidade_id === u.id);
          return (
            <Bloco key={u.id} titulo={u.nome}>
              <div className="pad-l">
                <Linha rot="Endereço">{u.endereco}{u.cidade ? ` · ${u.cidade}` : ''}</Linha>
                <Linha rot="CEP">{u.cep}</Linha>
                {fones.map((c) => <Linha key={c.num} rot={c.rot ? `Telefone (${c.rot})` : 'Telefone'}><Copiar codigo={c.num} rotulo="telefone" /></Linha>)}
                {zaps.map((c) => <Linha key={c.num} rot={c.rot ? `WhatsApp (${c.rot})` : 'WhatsApp'}><Copiar codigo={c.num} rotulo="telefone" /></Linha>)}
                {u.horario_atendimento && <Linha rot="Horário">{u.horario_atendimento}</Linha>}
                {maqs.length > 0 && <Linha rot="Máquinas">{maqs.map((e, k) => <span key={e.id}>{k > 0 && ' · '}<Link className="link-suave" to={`/maquinas?eq=${e.id}`}>{e.nome}</Link></span>)}</Linha>}
              </div>
            </Bloco>
          );
        })}
      </div>
    </>
  );
}

/** Máquinas em catálogo (por unidade); o card abre os exames da máquina com o tempo de cada um. */
export function Maquinas() {
  const b = useBase();
  const [params, setParams] = useSearchParams();
  const q = b.equipamentos.find((x) => String(x.id) === params.get('eq'));
  const unidade = (id: number) => b.unidades.find((u) => u.id === id)?.nome ?? '';
  const grupos = b.unidades.map((u) => ({ u, lista: b.equipamentos.filter((e) => e.unidade_id === u.id) })).filter((g) => g.lista.length);
  const itens = q ? b.equipamentoExames.filter((x) => x.equipamento_id === q.id) : [];
  const avisos = q ? b.avisos.filter((a) => a.escopo === 'equipamento' && (!a.referencia || norm(a.referencia) === norm(q.nome)))
    .sort((x, y) => Number(!!y.referencia) - Number(!!x.referencia)) : [];
  return (
    <>
      <TituloPagina titulo={q ? q.nome : 'Máquinas'} sub={q ? `${unidade(q.unidade_id)} · peso máximo ${q.peso_max_kg} kg` : 'Toque na máquina para ver os exames, o tempo de cada um e o peso máximo.'}>
        {q && <button type="button" className="btn2 ic" onClick={() => setParams({})} title="Voltar às máquinas" aria-label="Voltar às máquinas"><Icone n="volta" /></button>}
      </TituloPagina>

      {!q && grupos.map((g) => (
        <section key={g.u.id} className="grupo-conv">
          <h3>{g.u.nome} <span className="mut">· {g.lista.length} máquina{g.lista.length === 1 ? '' : 's'}</span></h3>
          <div className="cards-med">
            {g.lista.map((e) => (
              <button type="button" key={e.id} className="med-card" onClick={() => setParams({ eq: String(e.id) })}>
                <span className="med-av"><Icone n="maquina" /></span>
                <span className="med-inf"><b>{e.nome}</b><span className="mut">Peso máximo {e.peso_max_kg} kg</span></span>
                <span className="med-tag neutro">{e.tipo}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {q && (
        <div className="conv-detalhe">
          <Bloco titulo="Exames desta máquina" extra={<span className="mut" style={{ fontSize: 13 }}>{itens.length} exame{itens.length === 1 ? '' : 's'}</span>}>
            <table className="tab"><thead><tr><th>Exame</th><th>Tempo</th><th>Observação</th></tr></thead>
              <tbody>{itens.map((x, i) => {
                const min = x.minutos ?? (x.horarios ? x.horarios * 10 : null);
                return <tr key={i}><td>{x.exame_nome}</td><td>{min ? `${min} min` : <span className="mut">não cadastrado</span>}</td>
                  <td className="mut">{[x.contraste && 'contraste: ' + x.contraste, x.condicao_paciente, x.periodo && 'só ' + x.periodo].filter(Boolean).join(' · ') || '—'}</td></tr>;
              })}</tbody></table>
          </Bloco>
          {avisos.length > 0 && <Bloco titulo="Avisos da máquina"><ul className="feed">{avisos.map((a) => <li key={a.id}><span className="dot"><Icone n="info" /></span><div className="preparo-txt">{a.texto}</div></li>)}</ul></Bloco>}
        </div>
      )}
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
