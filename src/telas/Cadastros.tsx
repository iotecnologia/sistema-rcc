// Cadastros (só administradora): o que existe na base, em números. A edição de cada cadastro entra com o servidor (Fase 3).
import { Link } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, Kpi, TituloPagina } from '../componentes/Comuns';
import { useSessao } from '../acesso/Sessao';
import { temInfo } from './Convenios';

export function Cadastros() {
  const b = useBase();
  const s = useSessao();
  const linhas: [string, number | string][] = [
    ['Exames (catálogo TUSS)', b.exames.length], ['Convênios e regras', `${b.convenios.filter((c) => temInfo(b, c)).length} · ${b.regras.regras.length} regras`],
    ['Códigos por convênio', b.codigos.length], ['Planos e redes', b.planos.length], ['Médicos', b.medicos.length],
    ['Unidades e máquinas', `${b.unidades.length} · ${b.equipamentos.length}`], ['Preparos', b.preparos.length], ['Feriados', b.feriados.length],
    ['Valores (tabelas de preço)', `${b.precos.length} · ${b.tabelasPreco.length} tabelas`], ['Ramais', b.ramais.length],
  ];
  return (
    <>
      <TituloPagina titulo="Cadastros" sub="Só administradoras · o que está cadastrado na base" />
      <div className="kpis">
        <Kpi cor="#f59e0b" rot="Convênios" val={b.convenios.filter((c) => temInfo(b, c)).length} det="com regras cadastradas" />
        <Kpi cor="#3b82f6" rot="Usuários" val={s.usuarios.length} det={<Link to="/usuarios">gerenciar usuários</Link>} />
        <Kpi cor="#22c55e" rot="Exames" val={b.exames.length} det="no catálogo" />
        <Kpi cor="#a855f7" rot="Médicos" val={b.medicos.length} det="ultrassom e doppler" />
      </div>
      <Bloco titulo="Cadastros">
        <table className="tab"><thead><tr><th>Cadastro</th><th style={{ textAlign: 'right' }}>Quantidade</th></tr></thead>
          <tbody>{linhas.map(([n, v]) => <tr key={n}><td>{n}</td><td style={{ textAlign: 'right' }}>{v}</td></tr>)}</tbody></table>
        <p className="pad mut" style={{ fontSize: 12, margin: 0 }}>No mock os dados vêm da base consolidada (arquivos JSON). A edição de cada cadastro, com histórico de quem alterou, entra com o servidor.</p>
      </Bloco>
    </>
  );
}
