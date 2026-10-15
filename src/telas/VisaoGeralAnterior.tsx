// Visão geral — VERSÃO ANTERIOR (guardada para comparação; decisão pendente do Oliver).
// Abrir em #/inicio-anterior. A versão em uso fica em VisaoGeral.tsx.
import { Link } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, Kpi, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { QuadroAvisos } from '../componentes/AvisosEquipe';
import { useSessao } from '../acesso/Sessao';
import { PAGINAS } from '../acesso/paginas';
import { br, hojeIso, nomeDia } from '../regras/calendario';
import { local, saudacao } from '../util/formato';
import { temInfo } from './Convenios';

const TAG: Record<string, [string, string]> = { pode_agendar: ['t-ok', 'Pode agendar'], atencao: ['t-at', 'Atenção'], nao_pode: ['t-no', 'Não agendar'] };

export function VisaoGeralAnterior() {
  const b = useBase();
  const s = useSessao();
  const hoje = hojeIso();
  const comRegras = b.convenios.filter((c) => temInfo(b, c)).length;
  const eventuais = b.medicoAgendas.filter((a) => a.tipo === 'eventual' && (a.data ?? '') >= hoje).sort((a, c) => (a.data ?? '').localeCompare(c.data ?? ''));
  const feriado = b.feriados.filter((f) => f.data >= hoje).sort((a, c) => a.data.localeCompare(c.data))[0];
  const hist = local.ler<{ conv: string; ex: string; quando: string; sit?: string }[]>('historico', []);
  const nomeMed = (id: number) => b.medicos.find((m) => m.id === id)?.nome ?? '';
  const dataLonga = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <TituloPagina titulo={`${saudacao()}, ${s.usuario?.nome.split(' ')[0]}`} sub={dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}>
        <Link className="btn2 pri" to="/consultar">Nova consulta</Link>
      </TituloPagina>
      <QuadroAvisos />
      <div className="kpis">
        <Kpi cor="#3b82f6" rot="Convênios ativos" val={comRegras} det={`com regras · ${b.convenios.length - comRegras} só com pedido autorizado`} />
        <Kpi cor="#22c55e" rot="Exames no catálogo" val={b.exames.length} det="códigos TUSS" />
        <Kpi cor="#a855f7" rot="Agendas eventuais" val={eventuais.length} det={eventuais[0] ? `${nomeMed(eventuais[0].medico_id)} · ${nomeDia(eventuais[0].data!)} ${br(eventuais[0].data).slice(0, 5)}` : 'nenhuma marcada'} />
        <Kpi cor="#f59e0b" rot="Próximo feriado" txt val={feriado ? `${nomeDia(feriado.data)} ${br(feriado.data).slice(0, 5)}` : '—'} det={feriado ? `${feriado.nome} · não conta como dia útil` : ''} />
      </div>
      <div className="grade2">
        <Bloco titulo="Suas últimas consultas" extra={<Link to="/consultar">Nova consulta →</Link>}>
          {hist.length ? (
            <table className="tab"><thead><tr><th>Hora</th><th>Convênio</th><th>Exames</th><th>Resultado</th></tr></thead>
              <tbody>{hist.map((h, i) => (
                <tr key={i}><td className="mut">{h.quando}</td><td><b>{h.conv}</b></td><td>{h.ex}</td>
                  <td>{h.sit && TAG[h.sit] ? <span className={'tag ' + TAG[h.sit][0]}>{TAG[h.sit][1]}</span> : ''}</td></tr>
              ))}</tbody></table>
          ) : <Vazio>As consultas que você fizer aparecem aqui (só convênio e exames, nunca dado de paciente).</Vazio>}
        </Bloco>
        <div className="pilha">
          <Bloco titulo="Avisos">
            <ul className="feed">
              {eventuais.map((a, i) => <li key={i}><span className="dot"><Icone n="medico" /></span><div><b>{nomeMed(a.medico_id)}</b> atende {nomeDia(a.data!)} {br(a.data).slice(0, 5)}, das {a.inicio} às {a.fim}.<small>Agenda eventual · some depois da data</small></div></li>)}
              {feriado && <li><span className="dot"><Icone n="calendario" /></span><div><b>{feriado.nome}, {nomeDia(feriado.data)} {br(feriado.data).slice(0, 5)}.</b> A RCC atende. Os convênios não contam esse dia no prazo.<small>Feriado nacional</small></div></li>}
            </ul>
          </Bloco>
          <Bloco titulo="Suas páginas">
            <ul className="atalhos">{PAGINAS.filter((p) => p.id !== 'inicio' && s.pode(p.id)).slice(0, 6).map((p) => <li key={p.id}><Link to={p.rota}>{p.nome}</Link></li>)}</ul>
          </Bloco>
        </div>
      </div>
    </>
  );
}
