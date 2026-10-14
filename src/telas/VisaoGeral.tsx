// Visão geral: saudação, números da base, atalhos e últimas consultas deste computador.
import { Link } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, Kpi, TagSituacao, TituloPagina } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { local, saudacao } from '../util/formato';

export function VisaoGeral() {
  const b = useBase();
  const regras = b.regras.regras.filter((r) => r.situacao !== 'substituida');
  const conf = regras.filter((r) => r.situacao === 'confirmada').length;
  const abertas = regras.filter((r) => ['a_confirmar', 'conflito'].includes(r.situacao)).length;
  const hist = local.ler<{ conv: string; ex: string; quando: string }[]>('historico', []);
  const porConv = b.convenios.filter((c) => c.tem_regras).map((c) => {
    const rs = regras.filter((r) => r.convenio === c.slug);
    return { c, conflito: rs.filter((r) => r.situacao === 'conflito').length, aconf: rs.filter((r) => r.situacao === 'a_confirmar').length, sem: rs.filter((r) => r.situacao === 'sem_informacao').length };
  }).filter((x) => x.conflito + x.aconf + x.sem > 0).sort((a, c) => c.conflito + c.aconf - a.conflito - a.aconf);

  return (
    <>
      <TituloPagina titulo={`${saudacao()}, Izabel`} sub="Central de informações da RCC: regras de autorização, agenda, preparo e orçamento." />
      <div className="kpis">
        <Kpi cor="#12808C" rot="Convênios com regras" val={b.convenios.filter((c) => c.tem_regras).length} det={`${b.convenios.length} convênios atendidos`} />
        <Kpi cor="#3b82f6" rot="Exames no catálogo" val={b.exames.length} det={`${b.codigos.length} códigos de convênio`} />
        <Kpi cor="#16a34a" rot="Regras confirmadas" val={`${Math.round((conf / regras.length) * 100)}%`} det={`${conf} de ${regras.length} regras`} />
        <Kpi cor="#d97706" rot="Regras a confirmar" val={abertas} det="conflito ou dúvida — ver Regras a confirmar" />
      </div>
      <div className="grade2">
        <div className="pilha">
          <Bloco titulo="Convênios com regras para confirmar" extra={<Link className="lk" to="/pendencias">ver todas</Link>}>
            <table className="tab">
              <thead><tr><th>Convênio</th><th>Responsável</th><th>Conflito</th><th>A confirmar</th><th>Sem informação</th></tr></thead>
              <tbody>{porConv.map(({ c, conflito, aconf, sem }) => (
                <tr key={c.slug}><td><Link to={`/convenios?c=${c.slug}`}>{c.nome}</Link></td><td>{c.responsavel}</td>
                  <td>{conflito ? <TagSituacao s="conflito" /> : '—'} {conflito || ''}</td><td>{aconf || '—'}</td><td>{sem || '—'}</td></tr>
              ))}</tbody>
            </table>
          </Bloco>
        </div>
        <div className="pilha">
          <Bloco titulo="Atalhos">
            <ul className="atalhos">
              <li><Link to="/consultar"><Icone n="busca" />Consultar exame no convênio</Link></li>
              <li><Link to="/passo-a-passo"><Icone n="passos" />Agendar passo a passo</Link></li>
              <li><Link to="/convenios"><Icone n="convenio" />Ver regras de um convênio</Link></li>
              <li><Link to="/orcamento"><Icone n="orcamento" />Fazer orçamento particular</Link></li>
              <li><Link to="/ramais"><Icone n="ramal" />Ramais</Link></li>
            </ul>
          </Bloco>
          <Bloco titulo="Últimas consultas neste computador">
            {hist.length ? <ul className="feed">{hist.map((h, i) => (
              <li key={i}><span className="dot"><Icone n="busca" /></span><div><b>{h.conv}</b><div>{h.ex}</div><small>{h.quando}</small></div></li>
            ))}</ul> : <div className="vazio">Nenhuma consulta ainda.</div>}
          </Bloco>
        </div>
      </div>
    </>
  );
}
