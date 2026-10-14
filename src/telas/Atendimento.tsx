// Atendimento: Médicos, Unidades e máquinas, Ramais. Nada de lista despejada: médicos e ramais só aparecem depois da busca.
import { useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { norm } from '../regras/contexto';
import { palavras } from '../regras/busca';
import { br, hojeIso } from '../regras/calendario';

const casa = (texto: string, q: string) => { const h = norm(texto); return palavras(q).every((f) => f.some((x) => h.includes(x))); };

function Busca({ rot, q, setQ, ph }: { rot: string; q: string; setQ: (v: string) => void; ph: string }) {
  return <div className="barra"><label className="cp f" style={{ flex: '1 1 360px' }}><span>{rot}</span><Icone n="busca" /><input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} /></label></div>;
}

export function Medicos() {
  const b = useBase();
  const [q, setQ] = useState('');
  const hoje = hojeIso();
  const lista = q.trim().length < 2 ? [] : b.medicos.filter((m) => casa(m.nome + ' ' + b.medicoExames.filter((x) => x.medico_id === m.id).map((x) => x.exame_nome).join(' '), q));
  return (
    <>
      <TituloPagina titulo="Médicos" sub="Quem faz cada exame de ultrassom e doppler. Busque pelo exame ou pelo nome." />
      <Busca rot="Buscar" q={q} setQ={setQ} ph="ex.: doppler, transvaginal, Dra. Sofia" />
      {!q.trim() ? <div className="bloco"><Vazio>Digite o exame ou o nome do médico.</Vazio></div> : !lista.length ? <div className="bloco"><Vazio>Nenhum médico encontrado para “{q}”.</Vazio></div> : (
        <Bloco titulo={`${lista.length} médico${lista.length > 1 ? 's' : ''}`}>
          <table className="tab"><thead><tr><th>Médico</th><th>Faz</th><th>Agenda</th><th>Atenção</th></tr></thead>
            <tbody>{lista.map((m) => (
              <tr key={m.id}>
                <td><b>{m.nome}</b>{m.crm && <div className="mut" style={{ fontSize: 12 }}>CRM {m.crm}</div>}</td>
                <td>{b.medicoExames.filter((x) => x.medico_id === m.id).map((x) => x.exame_nome).join(' · ')}</td>
                <td>{m.agenda_todos_os_dias ? 'Todos os dias' : 'Não atende todos os dias'}
                  {b.medicoAgendas.filter((a) => a.medico_id === m.id && (a.tipo === 'recorrente' || (a.data ?? '') >= hoje)).map((a, i) => <div key={i} className="mut" style={{ fontSize: 12 }}>{a.tipo === 'recorrente' ? `${a.dia_semana} ${a.inicio}–${a.fim}` : `${br(a.data)} ${a.inicio}–${a.fim}`}</div>)}</td>
                <td>{b.medicoRestricoes.filter((r) => r.medico_id === m.id).map((r, i) => <div key={i}>{r.texto}</div>)}</td>
              </tr>
            ))}</tbody></table>
        </Bloco>
      )}
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
    </>
  );
}

export function Ramais() {
  const b = useBase();
  const [q, setQ] = useState('');
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
