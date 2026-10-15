// Visão geral (informativa): saudação, avisos da equipe, últimas consultas e agenda dos próximos dias. A busca fica no cabeçalho.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { QuadroAvisos } from '../componentes/AvisosEquipe';
import { useAvisos } from '../acesso/Avisos';
import { useSessao } from '../acesso/Sessao';
import { br, hojeIso, nomeDia, somarDias } from '../regras/calendario';
import { local, saudacao } from '../util/formato';

const TAG: Record<string, [string, string]> = { pode_agendar: ['t-ok', 'Pode agendar'], atencao: ['t-at', 'Atenção'], nao_pode: ['t-no', 'Não agendar'] };
interface Hist { conv: string; ex: string; quando: string; sit?: string; slug?: string; ids?: string }

export function VisaoGeral() {
  const b = useBase();
  const s = useSessao();
  const nav = useNavigate();
  const hoje = hojeIso();
  const [verLidos, setVerLidos] = useState(false);
  const av = useAvisos();
  const temLidos = av.visiveis.some((a) => av.leu(a.id));
  const hist = local.ler<Hist[]>('historico', []);
  const limite = somarDias(hoje, 30);
  const nomeMed = (id: number) => b.medicos.find((m) => m.id === id)?.nome ?? '';
  const agenda = [
    ...b.feriados.filter((f) => f.data >= hoje && f.data <= limite).map((f) => ({ data: f.data, ic: 'calendario', txt: <><b>{f.nome}</b> · a RCC atende; os convênios não contam esse dia no prazo.</> })),
    ...b.medicoAgendas.filter((a) => a.tipo === 'eventual' && a.data && a.data >= hoje && a.data <= limite).map((a) => ({ data: a.data!, ic: 'medico', txt: <><b>{nomeMed(a.medico_id)}</b> atende das {a.inicio} às {a.fim} (agenda eventual).</> })),
  ].sort((x, y) => x.data.localeCompare(y.data));
  const recorrentes = b.medicoAgendas.filter((a) => a.tipo === 'recorrente');
  const dataLonga = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <TituloPagina titulo={`${saudacao()}, ${s.usuario?.nome.split(' ')[0]}`} sub={dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}>
        {temLidos && <button type="button" className={'btn2' + (verLidos ? ' ativo' : '')} aria-pressed={verLidos} onClick={() => setVerLidos(!verLidos)}>Avisos lidos</button>}
        <Link className="btn2 pri" to="/consultar">Nova consulta</Link>
      </TituloPagina>
      <QuadroAvisos mostrarLidos={verLidos && temLidos} />

      <div className="grade2">
        <Bloco titulo="Suas últimas consultas">
          {hist.length ? (
            <table className="tab"><thead><tr><th>Hora</th><th>Convênio</th><th>Exames</th><th>Resultado</th><th /></tr></thead>
              <tbody>{hist.map((h, i) => (
                <tr key={i}><td className="mut">{h.quando}</td><td><b>{h.conv}</b></td><td>{h.ex}</td>
                  <td>{h.sit && TAG[h.sit] ? <span className={'tag ' + TAG[h.sit][0]}>{TAG[h.sit][1]}</span> : ''}</td>
                  <td style={{ width: 44 }}>{h.slug && h.ids && <button type="button" className="btn2 ic" onClick={() => nav(`/consultar?convenio=${h.slug}&exames=${h.ids}`)} title="Abrir de novo" aria-label="Abrir de novo"><Icone n="seta" /></button>}</td></tr>
              ))}</tbody></table>
          ) : <Vazio>As consultas que você fizer aparecem aqui (só convênio e exames, nunca dado de paciente).</Vazio>}
        </Bloco>
        <Bloco titulo="Agenda dos próximos dias">
          {agenda.length || recorrentes.length ? (
            <ul className="feed">
              {agenda.map((x, i) => <li key={i}><span className="dot"><Icone n={x.ic} /></span><div><span className="mut" style={{ fontSize: 12 }}>{nomeDia(x.data)} {br(x.data).slice(0, 5)}</span><div>{x.txt}</div></div></li>)}
              {recorrentes.map((a, i) => <li key={'r' + i}><span className="dot"><Icone n="medico" /></span><div><span className="mut" style={{ fontSize: 12 }}>toda {a.dia_semana}</span><div><b>{nomeMed(a.medico_id)}</b> atende das {a.inicio} às {a.fim}.</div></div></li>)}
            </ul>
          ) : <Vazio>Nada de diferente nos próximos 30 dias.</Vazio>}
        </Bloco>
      </div>
    </>
  );
}

