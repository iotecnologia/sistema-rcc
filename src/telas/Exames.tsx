// Exames (mesmo padrão da página Convênios): busca curtinha com lista suspensa; escolhido o exame,
// aparece o código para autorizar em cada convênio (com botão de copiar), onde fazer e o preparo.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBase } from '../componentes/Dados';
import { Bloco, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { buscarExames, type Achado } from '../regras/busca';
import { agendaDoExame, type AgendaExame } from '../regras/agenda';
import { tussTexto } from '../util/formato';
import { LogoConvenio } from './Convenios';
import { Copiar } from '../componentes/Copiar';

const Linha = ({ rot, children }: { rot: string; children: ReactNode }) =>
  <div className="p1-linha"><span className="p1-rot">{rot}</span><span>{children}</span></div>;

/** Onde e quanto tempo, uma informação por linha. */
function OndeTempo({ ag }: { ag: AgendaExame }) {
  const m = ag.maquinas;
  if (m.length) {
    const maquinas = [...new Set(m.map((x) => x.maquina))];
    const pesos = [...new Set(m.map((x) => x.pesoMaxKg).filter(Boolean))];
    const tempos = m.map((x) => x.minutos ?? (x.horarios ? x.horarios * 10 : null)).filter((x): x is number => !!x);
    const min = tempos.length ? Math.min(...tempos) : null;
    return <>
      <Linha rot={maquinas.length > 1 ? 'Máquinas' : 'Máquina'}>{maquinas.join(' ou ')}</Linha>
      {pesos.length > 0 && <Linha rot="Peso máximo">{pesos.length > 1 ? `${Math.min(...pesos)} a ${Math.max(...pesos)} kg (depende da máquina)` : `${pesos[0]} kg`}</Linha>}
      <Linha rot="Tempo">{min ? `${min} min` : <span className="mut">não cadastrado</span>}</Linha>
    </>;
  }
  if (ag.medicos.length) return <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 14 }}>{[...new Set(ag.medicos.map((x) => x.medico))].map((n) => <li key={n}>{n}</li>)}</ul>;
  return <Linha rot="Onde">sem máquina ou médico cadastrado</Linha>;
}

/** Tipos de exame (modalidade) mostrados no catálogo. Só nome de tela: os dados continuam como estão. */
const TIPOS: Record<string, string> = { RX: 'Raio-X', RESSONANCIA: 'Ressonância', ULTRASSOM: 'Ultrassom', DOPPLER: 'Doppler', TOMOGRAFIA: 'Tomografia',
  ANGIOTOMOGRAFIA: 'Angiotomografia', MAMOGRAFIA: 'Mamografia', ANGIORRESSONANCIA: 'Angiorressonância', DENSITOMETRIA: 'Densitometria óssea', PROCEDIMENTO: 'Procedimentos', OUTROS: 'Outros' };
const ORDEM_TIPOS = Object.keys(TIPOS);

export function Exames() {
  const b = useBase();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Achado | null>(null);
  const [aberto, setAberto] = useState(false);
  const [i, setI] = useState(0);
  const [tipo, setTipo] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const [params] = useSearchParams();
  // veio da busca geral do cabeçalho: já abre o exame escolhido
  useEffect(() => {
    const ex = b.exames.find((x) => x.id === Number(params.get('id')));
    if (!ex) return;
    const rot = params.get('rotulo') ?? ex.nome;
    setQ(rot); setSel({ exame: ex, rotulo: rot }); setAberto(false);
  }, [b, params]);
  const achados = useMemo(() => buscarExames(b, q, 12), [b, q]);
  const escolher = (a: Achado) => { setSel(a); setQ(a.rotulo); setAberto(false); ref.current?.blur(); };
  const tecla = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setAberto(true); setI(Math.min(i + 1, achados.length - 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setI(Math.max(i - 1, 0)); }
    else if (ev.key === 'Enter' && achados[i]) { ev.preventDefault(); escolher(achados[i]); }
    else if (ev.key === 'Escape') setAberto(false);
  };

  const ativos = useMemo(() => b.exames.filter((x) => x.ativo), [b]);
  const tipos = useMemo(() => ORDEM_TIPOS.map((t) => ({ t, n: ativos.filter((x) => x.modalidade === t).length })).filter((x) => x.n), [ativos]);
  const doTipo = useMemo(() => (tipo ? ativos.filter((x) => x.modalidade === tipo).sort((x, y) => x.nome.localeCompare(y.nome)) : []), [ativos, tipo]);
  const voltarLista = () => { setSel(null); setQ(''); };

  const e = sel?.exame;
  const ag = e ? agendaDoExame(b, e) : null;
  // códigos ativos agrupados por convênio (um convênio pode ter mais de um código)
  const porConvenio = e ? b.convenios.map((cv) => ({ cv, cods: b.codigos.filter((c) => c.exame_id === e.id && c.convenio_id === cv.id && c.status === 'ativo') }))
    .filter((x) => x.cods.length).sort((x, y) => x.cv.nome.localeCompare(y.cv.nome)) : [];

  return (
    <>
      <TituloPagina titulo={tipo && !e ? TIPOS[tipo] : 'Exames'} sub={tipo && !e ? `${doTipo.length} exames. Toque no exame para ver o código de cada convênio.` : 'Digite o exame do jeito que o paciente falou ou toque no tipo de exame.'}>
        {tipo && <button type="button" className="btn2 ic" onClick={() => (e ? voltarLista() : setTipo(null))} title={e ? `Voltar para ${TIPOS[tipo]}` : 'Voltar aos tipos de exame'} aria-label="Voltar"><Icone n="volta" /></button>}
      </TituloPagina>
      <div className="busca-conv">
        <Icone n="busca" />
        <input ref={ref} type="search" autoFocus value={q} autoComplete="off" placeholder="Nome do exame… (ex.: resso joelho)"
          onChange={(x) => { setQ(x.target.value); setSel(null); setI(0); setAberto(true); }} onFocus={() => q.trim() && setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)} onKeyDown={tecla} />
        {aberto && q.trim().length > 0 && (
          <div className="combo-lista" role="listbox">
            {achados.length ? achados.map((a, k) => (
              <button type="button" key={a.exame.id} role="option" aria-selected={k === i} className={k === i ? 'foco' : ''}
                onMouseDown={(ev) => { ev.preventDefault(); escolher(a); }} onMouseEnter={() => setI(k)}>
                <span>{a.rotulo}</span>{a.rotulo !== a.exame.nome && <small>{a.exame.nome}</small>}
              </button>
            )) : <div className="combo-vazio">Nenhum exame com “{q}”.</div>}
          </div>
        )}
      </div>

      {!e || !ag ? (q.trim() ? <div className="bloco"><Vazio>Escolha o exame na lista.</Vazio></div> : !tipo ? (
        <section className="grupo-conv">
          <h3>Tipo de exame <span className="mut">· {tipos.length} tipos · {ativos.length} exames</span></h3>
          <div className="cards-med">
            {tipos.map(({ t, n }) => (
              <button type="button" key={t} className="med-card" onClick={() => setTipo(t)}>
                <span className="med-av"><Icone n="exame" /></span>
                <span className="med-inf"><b>{TIPOS[t]}</b><span className="mut">{n} exame{n === 1 ? '' : 's'}</span></span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="cards-med">
          {doTipo.map((x) => (
            <button type="button" key={x.id} className="med-card" onClick={() => escolher({ exame: x, rotulo: x.nome })}>
              <span className="med-inf"><b>{x.nome}</b></span>
            </button>
          ))}
        </div>
      )) : (
        <div className="conv-detalhe">
          <div className="conv-cab bloco exame-cab"><div><b>{sel!.rotulo}</b>{sel!.rotulo !== e.nome && <span className="mut">{e.nome}</span>}</div></div>
          <div className="grade2">
            <div className="coluna">
              <Bloco titulo="Código para autorizar em cada convênio" extra={<span className="mut" style={{ fontSize: 12 }}>{porConvenio.length} convênio{porConvenio.length === 1 ? '' : 's'}</span>}>
                {porConvenio.length ? <div className="pad-l">{porConvenio.map(({ cv, cods }) => (
                  <div key={cv.id} className="cod-conv">
                    <Link to={`/consultar?convenio=${cv.slug}&exame=${e.id}`} className="cod-conv-nome" title="Abrir a consulta deste convênio"><LogoConvenio c={cv} tam={22} /><span>{cv.nome}</span></Link>
                    <span className="codigos">{cods.map((c) => <span key={c.id} className="cod-item">
                      {c.tipo === 'PACOTE' || c.tipo === 'AMB' ? <small className="cod-tipo">{c.tipo === 'PACOTE' ? 'pacote' : 'AMB'}</small> : null}<Copiar codigo={c.codigo} /></span>)}</span>
                    {[...new Set(cods.filter((c) => c.vinculo === 'pacote_conferir' && c.observacao).map((c) => c.observacao))].map((o) => (
                      <small key={o} style={{ flexBasis: '100%', color: 'var(--st-at-t)', fontSize: 12.5 }}>⚠ {o}</small>))}
                  </div>
                ))}</div> : <Vazio>Nenhum convênio tem código próprio cadastrado: autorizar pelo {tussTexto(e).toLowerCase()}.</Vazio>}
              </Bloco>
            </div>
            <div className="coluna">
              <Bloco titulo={ag.maquinas.length ? 'Onde e quanto tempo' : ag.medicos.length ? 'Quem faz' : 'Onde e quanto tempo'}><div className="pad-l"><OndeTempo ag={ag} /></div></Bloco>
              <Bloco titulo="Preparo">{ag.preparos.length ? <div className="pad">{ag.preparos.map((p) => <div key={p.id} style={{ marginBottom: 8 }}><b>{p.titulo.replace(/^Preparo\s*[—-]\s*/i, '')}</b><div className="preparo-txt">{p.texto}</div></div>)}</div> : <Vazio>Sem preparo.</Vazio>}</Bloco>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
