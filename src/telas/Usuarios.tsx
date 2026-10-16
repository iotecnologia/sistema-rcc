// Usuários e cargos (padrão Prometals): o cargo define as páginas. Tabela abre travada; o lápis libera; Salvar/Descartar só depois.
import { useState } from 'react';
import { Bloco, TituloPagina } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { useSessao, type Cargo, type Usuario } from '../acesso/Sessao';
import { GRUPOS, PAGINAS } from '../acesso/paginas';

const slug = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export function Usuarios() {
  const s = useSessao();
  const [ed, setEd] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>(s.cargos);
  const [usuarios, setUsuarios] = useState<Usuario[]>(s.usuarios);
  const [erro, setErro] = useState('');
  const descartar = () => { setCargos(s.cargos); setUsuarios(s.usuarios); setEd(false); setErro(''); };
  const salvar = () => {
    const emails = usuarios.map((u) => u.email.trim().toLowerCase());
    if (emails.some((e) => !/^\S+@\S+\.\S+$/.test(e))) return setErro('Tem e-mail inválido.');
    if (new Set(emails).size !== emails.length) return setErro('Tem e-mail repetido.');
    if (cargos.some((c) => !c.nome.trim())) return setErro('Tem cargo sem nome.');
    if (!usuarios.some((u) => u.cargo === 'administrador')) return setErro('Precisa ficar pelo menos um Administrador.');
    s.salvar({ cargos, usuarios: usuarios.map((u) => ({ ...u, email: u.email.trim().toLowerCase() })) }); setEd(false); setErro('');
  };
  const mudarU = (i: number, k: keyof Usuario, v: string) => setUsuarios(usuarios.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const marcar = (id: string, p: string) => setCargos(cargos.map((c) => (c.id !== id ? c : { ...c, paginas: c.paginas.includes(p) ? c.paginas.filter((x) => x !== p) : [...c.paginas, p] })));
  const novoCargo = () => { const n = `Novo cargo ${cargos.length}`; setCargos([...cargos, { id: slug(n) + '_' + Date.now(), nome: n, paginas: [] }]); };
  const emUso = (id: string) => usuarios.some((u) => u.cargo === id);

  return (
    <>
      <TituloPagina titulo="Usuários e cargos" sub="O cargo define quais páginas a pessoa abre. O login é o e-mail.">
        <button type="button" className="btn2 ic" disabled={ed} onClick={() => setEd(true)} title="Editar" aria-label="Editar"><Icone n="editar" /></button>
        <button type="button" className="btn2 ic" disabled={!ed} onClick={salvar} title="Salvar" aria-label="Salvar"><Icone n="ok" /></button>
        <button type="button" className="btn2 ic" disabled={!ed} onClick={descartar} title="Descartar" aria-label="Descartar"><Icone n="x" /></button>
      </TituloPagina>
      {erro && <div className="trava" style={{ marginBottom: 12 }}><span>{erro}</span></div>}
      <div className="blocos">
        <Bloco titulo={`Usuários (${usuarios.length})`} extra={<button type="button" className="btn2 ic" disabled={!ed} onClick={() => setUsuarios([...usuarios, { email: '', nome: '', cargo: cargos[cargos.length - 1]?.id ?? '' }])} title="Novo usuário" aria-label="Novo usuário"><Icone n="mais" /></button>}>
          <table className="tab"><thead><tr><th>E-mail</th><th>Nome</th><th>Cargo</th><th /></tr></thead>
            <tbody>{usuarios.map((u, i) => (
              <tr key={i}>
                <td><input type="email" disabled={!ed} value={u.email} onChange={(e) => mudarU(i, 'email', e.target.value)} /></td>
                <td><input disabled={!ed} value={u.nome} onChange={(e) => mudarU(i, 'nome', e.target.value)} /></td>
                <td><select disabled={!ed} value={u.cargo} onChange={(e) => mudarU(i, 'cargo', e.target.value)}>{cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></td>
                <td style={{ width: 44 }}><button type="button" className="btn2 ic" disabled={!ed || u.email === s.usuario?.email} onClick={() => setUsuarios(usuarios.filter((_, j) => j !== i))} title="Remover usuário" aria-label="Remover usuário"><Icone n="menos" /></button></td>
              </tr>
            ))}</tbody></table>
        </Bloco>
        <Bloco titulo="Cargos e páginas" extra={<button type="button" className="btn2 ic" disabled={!ed} onClick={novoCargo} title="Novo cargo" aria-label="Novo cargo"><Icone n="mais" /></button>}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tab matriz"><thead>
              <tr><th rowSpan={2}>Cargo</th><th rowSpan={2} title="Desconto extra máximo no Orçamento">Desconto máx.</th>{GRUPOS.map((g) => <th key={g || 'geral'} colSpan={PAGINAS.filter((p) => p.grupo === g).length}>{g || 'Geral'}</th>)}<th rowSpan={2} /></tr>
              <tr>{PAGINAS.map((p) => <th key={p.id} className="rot-pag">{p.nome}</th>)}</tr>
            </thead>
              <tbody>{cargos.map((c) => {
                const fixo = c.paginas.includes('*');
                return (
                  <tr key={c.id}>
                    <td><input disabled={!ed || fixo} value={c.nome} onChange={(e) => setCargos(cargos.map((x) => (x.id === c.id ? { ...x, nome: e.target.value } : x)))} /></td>
                    <td className="centro" style={{ width: 96 }}>{fixo ? <span className="mut">sem limite</span> : <span className="pct-cel"><input type="number" min={0} max={100} step={0.5} disabled={!ed} value={c.descontoMax ?? 0} onChange={(e) => setCargos(cargos.map((x) => (x.id === c.id ? { ...x, descontoMax: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } : x)))} aria-label={`${c.nome}: desconto máximo`} />%</span>}</td>
                    {PAGINAS.map((p) => <td key={p.id} className="centro"><input type="checkbox" disabled={!ed || fixo} checked={fixo || c.paginas.includes(p.id)} onChange={() => marcar(c.id, p.id)} aria-label={`${c.nome}: ${p.nome}`} /></td>)}
                    <td style={{ width: 44 }}><button type="button" className="btn2 ic" disabled={!ed || fixo || emUso(c.id)} onClick={() => setCargos(cargos.filter((x) => x.id !== c.id))} title={emUso(c.id) ? 'Cargo em uso: troque os usuários antes' : 'Remover cargo'} aria-label="Remover cargo"><Icone n="menos" /></button></td>
                  </tr>
                );
              })}</tbody></table>
          </div>
          <p className="pad mini">Administrador tem acesso a tudo e não pode ser alterado. Desconto máx. = quanto de desconto extra o cargo pode dar no Orçamento. No mock, as mudanças ficam salvas neste navegador; com o servidor (Fase 3) passam a valer para todos.</p>
        </Bloco>
      </div>
    </>
  );
}
