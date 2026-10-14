// Telas de apoio ao atendimento: Médicos, Unidades e máquinas, Ramais.
import { useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { norm } from '../regras/contexto';
import { br } from '../regras/calendario';

export function Medicos() {
  const b = useBase();
  const [q, setQ] = useState('');
  const hoje = new Date().toISOString().slice(0, 10);
  const lista = b.medicos.filter((m) => norm(m.nome + ' ' + b.medicoExames.filter((x) => x.medico_id === m.id).map((x) => x.exame_nome).join(' ')).includes(norm(q)));
  return (
    <>
      <TituloPagina titulo="Médicos" sub="Quem faz cada exame de ultrassom e doppler, restrições e agendas especiais." />
      <div className="barra"><label className="cp f" style={{ flex: '1 1 320px' }}><span>Buscar médico ou exame</span><Icone n="busca" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: transvaginal, Dra. Sofia, doppler" /></label></div>
      <Bloco titulo={`${lista.length} médicos`}>
        <table className="tab"><thead><tr><th>Médico</th><th>Exames</th><th>Agenda</th><th>Restrições</th></tr></thead>
          <tbody>{lista.map((m) => (
            <tr key={m.id}>
              <td><b>{m.nome}</b>{m.crm && <div className="mini">CRM {m.crm}</div>}</td>
              <td>{b.medicoExames.filter((x) => x.medico_id === m.id).map((x) => x.exame_nome).join(' · ') || <span className="mut">—</span>}</td>
              <td>{m.agenda_todos_os_dias ? 'Todos os dias' : 'Não tem agenda todos os dias'}
                {b.medicoAgendas.filter((a) => a.medico_id === m.id && (a.tipo === 'recorrente' || (a.data ?? '') >= hoje)).map((a, i) => <div key={i} className="mini">{a.tipo === 'recorrente' ? `${a.dia_semana} ${a.inicio}–${a.fim}` : `${br(a.data)} ${a.inicio}–${a.fim} (eventual)`}</div>)}</td>
              <td>{b.medicoRestricoes.filter((r) => r.medico_id === m.id).map((r, i) => <div key={i}>{r.texto}</div>)}</td>
            </tr>
          ))}</tbody></table>
      </Bloco>
    </>
  );
}

export function Unidades() {
  const b = useBase();
  const [eq, setEq] = useState(b.equipamentos[0]?.id ?? 0);
  const itens = b.equipamentoExames.filter((x) => x.equipamento_id === eq);
  const q = b.equipamentos.find((x) => x.id === eq);
  return (
    <>
      <TituloPagina titulo="Unidades e máquinas" sub="Endereços, horários, máquinas e quantos horários (1 horário = 10 min) cada exame ocupa." />
      <div className="grade-cards" style={{ marginBottom: 14 }}>
        {b.unidades.map((u) => (
          <Bloco key={u.id} titulo={u.nome}>
            <div className="pad mini" style={{ display: 'grid', gap: 4 }}>
              <span>{u.endereco} · CEP {u.cep} · {u.cidade}</span><span>{u.telefones}</span>{u.whatsapp && <span>WhatsApp: {u.whatsapp}</span>}<span>{u.horario_atendimento}</span>
            </div>
          </Bloco>
        ))}
      </div>
      <div className="abas">{b.equipamentos.map((x) => <button type="button" key={x.id} className={eq === x.id ? 'on' : ''} onClick={() => setEq(x.id)}>{x.nome}</button>)}</div>
      <div className="grade2">
        <Bloco titulo={`${q?.nome} · peso máximo ${q?.peso_max_kg} kg`} extra={<span className="mut" style={{ fontSize: 12 }}>{b.unidades.find((u) => u.id === q?.unidade_id)?.apelido}</span>}>
          <table className="tab"><thead><tr><th>Exame</th><th>Horários</th><th>Minutos</th><th>Contraste</th><th>Condição</th></tr></thead>
            <tbody>{itens.map((x, i) => <tr key={i}><td>{x.exame_nome}</td><td>{x.horarios ?? <span className="mut">não cadastrado</span>}</td><td>{x.minutos ?? '—'}</td><td>{x.contraste ?? '—'}</td><td>{[x.condicao_paciente, x.periodo && 'só ' + x.periodo].filter(Boolean).join(' · ') || '—'}</td></tr>)}</tbody></table>
        </Bloco>
        <div className="pilha">
          <Bloco titulo="Avisos das máquinas"><ul className="feed">{b.avisos.map((a) => <li key={a.id}><span className="dot"><Icone n="info" /></span><div>{a.texto}{a.referencia && <small>{a.referencia}</small>}</div></li>)}</ul></Bloco>
          <Bloco titulo="Preparos"><div className="pad">{b.preparos.map((p) => <details key={p.id}><summary>{p.titulo}</summary><div className="preparo-txt">{p.texto}</div></details>)}</div></Bloco>
        </div>
      </div>
    </>
  );
}

export function Ramais() {
  const b = useBase();
  const [q, setQ] = useState('');
  const lista = b.ramais.filter((r) => norm(`${r.setor} ${r.local} ${(r.numeros ?? []).join(' ')}`).includes(norm(q)));
  const grupos = [...new Set(lista.map((r) => `${b.unidades.find((u) => u.id === r.unidade_id)?.apelido ?? 'Outros'} · ${r.setor ?? 'Geral'}`))];
  return (
    <>
      <TituloPagina titulo="Ramais" sub="Ramais internos por unidade e setor." />
      <div className="barra"><label className="cp f" style={{ flex: '1 1 320px' }}><span>Buscar</span><Icone n="busca" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: recepção, doppler, autorização" /></label></div>
      <div className="grade-cards">
        {grupos.map((g) => (
          <Bloco key={g} titulo={g}>
            <table className="tab"><tbody>{lista.filter((r) => `${b.unidades.find((u) => u.id === r.unidade_id)?.apelido ?? 'Outros'} · ${r.setor ?? 'Geral'}` === g).map((r) => (
              <tr key={r.id}><td>{r.local}</td><td className="cod">{r.numeros?.join(' / ') ?? <span className="mut">sem número</span>}</td></tr>
            ))}</tbody></table>
          </Bloco>
        ))}
      </div>
    </>
  );
}
