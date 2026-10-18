// Avisos (quem tem permissão no cargo): escrever o aviso, ver quem já leu e encerrar. Não apaga: encerra.
import { Fragment, useState } from 'react';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { useSessao } from '../acesso/Sessao';
import { useAvisos, ROTULO_TIPO, type TipoAviso } from '../acesso/Avisos';
import { br, hojeIso, somarDias } from '../regras/calendario';

export function Avisos() {
  const s = useSessao();
  const v = useAvisos();
  const hoje = hojeIso();
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<TipoAviso>('importante');
  const [validoAte, setValidoAte] = useState(somarDias(hoje, 3));
  const [para, setPara] = useState('todos');
  const [aberto, setAberto] = useState<string | null>(null);
  const publicar = () => { v.publicar({ titulo: titulo.trim(), texto: texto.trim(), tipo, validoAte, para }); setTitulo(''); setTexto(''); setTipo('importante'); setValidoAte(somarDias(hoje, 3)); setPara('todos'); };
  const publico = (p: string) => s.usuarios.filter((u) => p === 'todos' || u.cargo === p);
  const nomeCargo = (p: string) => (p === 'todos' ? 'Todos' : s.cargos.find((c) => c.id === p)?.nome ?? p);
  const situacao = (ativo: boolean, valido: string) => (!ativo ? 'Encerrado' : valido < hoje ? 'Vencido' : 'No ar');

  return (
    <>
      <TituloPagina titulo="Avisos" sub="Recados para a equipe. Urgente aparece na frente de tudo quando a pessoa entra; todos ficam na Visão geral até a data de validade." />
      <div className="grade2">
        <Bloco titulo="Novo aviso">
          <div className="pad form-aviso">
            <label className="cp"><span>Título</span><input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} placeholder="ex.: RM 2 parada hoje" /></label>
            <label className="cp"><span>Mensagem</span><textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} placeholder="ex.: A RM 2 quebrou. Reagendar os pacientes da tarde para a RM 4." /></label>
            <div className="tipos-aviso">{(['urgente', 'importante', 'informativo'] as TipoAviso[]).map((t) => (
              <button type="button" key={t} className={'tag-aviso ' + t + (tipo === t ? ' on' : '')} onClick={() => setTipo(t)}>{ROTULO_TIPO[t]}</button>
            ))}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label className="cp" style={{ flex: '1 1 160px' }}><span>Válido até</span><input type="date" value={validoAte} min={hoje} onChange={(e) => setValidoAte(e.target.value)} /></label>
              <label className="cp" style={{ flex: '1 1 160px' }}><span>Para quem</span><select value={para} onChange={(e) => setPara(e.target.value)}><option value="todos">Todos</option>{s.cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            </div>
            <button type="button" className="btn-grande pri" disabled={!titulo.trim() || !texto.trim()} onClick={publicar}><Icone n="ok" />Publicar aviso</button>
            <p className="mut" style={{ fontSize: 12, margin: 0 }}>Mock: o aviso fica salvo neste navegador. Com o servidor, chega para todos.</p>
          </div>
        </Bloco>
        <Bloco titulo={`Avisos publicados (${v.avisos.length})`}>
          {!v.avisos.length ? <Vazio>Nenhum aviso publicado ainda.</Vazio> : (
            <table className="tab"><thead><tr><th>Aviso</th><th>Para</th><th>Leram</th><th>Situação</th><th /></tr></thead>
              <tbody>{v.avisos.map((a) => {
                const alvo = publico(a.para); const leram = alvo.filter((u) => v.leu(a.id, u.email));
                return (<Fragment key={a.id}>
                  <tr>
                    <td><span className={'tag-aviso ' + a.tipo}>{ROTULO_TIPO[a.tipo]}</span> <b>{a.titulo}</b><div className="mut" style={{ fontSize: 12 }}>{a.autor} · até {br(a.validoAte)}</div></td>
                    <td>{nomeCargo(a.para)}</td>
                    <td><button type="button" className="btn2 leram" onClick={() => setAberto(aberto === a.id ? null : a.id)} title="Ver quem leu">{leram.length} de {alvo.length}</button></td>
                    <td>{situacao(a.ativo, a.validoAte)}</td>
                    <td style={{ width: 44 }}><button type="button" className="btn2 ic" disabled={!a.ativo} onClick={() => v.encerrar(a.id)} title="Encerrar aviso (sai da tela de todos)" aria-label="Encerrar aviso"><Icone n="x" /></button></td>
                  </tr>
                  {aberto === a.id && <tr><td colSpan={5} style={{ background: 'var(--hover)' }}>
                    {alvo.map((u) => <div key={u.email} style={{ fontSize: 13 }}>{v.leu(a.id, u.email) ? '✔' : '—'} {u.nome} <span className="mut">({u.email})</span></div>)}
                  </td></tr>}
                </Fragment>);
              })}</tbody></table>
          )}
        </Bloco>
      </div>
    </>
  );
}
