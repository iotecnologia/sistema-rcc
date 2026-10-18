// Busca de exame pelo nome falado (regras/busca.ts) + exames escolhidos (com quantidade, para articulação/coluna/bilateral).
import { useMemo, useState } from 'react';
import { useBase } from './Dados';
import { Icone } from './Icone';
import { buscarExames } from '../regras/busca';

export interface Escolhido { exameId: number; quantidade: number; rotulo?: string }

export function SeletorExames({ convenio, escolhidos, mudar, desativado, passo = 2, semChips }: {
  convenio: string; escolhidos: Escolhido[]; mudar: (e: Escolhido[]) => void; desativado?: boolean; passo?: number; semChips?: boolean;
}) {
  const b = useBase();
  const [q, setQ] = useState('');
  const conv = b.convenios.find((c) => c.slug === convenio);
  // código para autorizar NESTE convênio (o que a pessoa vai usar), não o TUSS do catálogo
  const codigosConv = useMemo(() => {
    const m = new Map<number, string[]>();
    if (conv) for (const c of b.codigos) if (c.convenio_id === conv.id && c.exame_id && c.status === 'ativo') m.set(c.exame_id, [...(m.get(c.exame_id) ?? []), c.codigo]);
    return m;
  }, [b, conv]);
  const comCodigo = useMemo(() => new Set(codigosConv.keys()), [codigosConv]);
  const sugestoes = useMemo(() => buscarExames(b, q, 30)
    .filter((x) => !escolhidos.some((y) => y.exameId === x.exame.id))
    .sort((a, c) => Number(comCodigo.has(c.exame.id)) - Number(comCodigo.has(a.exame.id)))
    .slice(0, 8), [b, q, escolhidos, comCodigo]);

  const add = (id: number, rotulo: string) => { mudar([...escolhidos, { exameId: id, quantidade: 1, rotulo }]); setQ(''); };
  const qtd = (id: number, d: number) => mudar(escolhidos.map((x) => (x.exameId === id ? { ...x, quantidade: Math.max(1, x.quantidade + d) } : x)));
  const tirar = (id: number) => mudar(escolhidos.filter((x) => x.exameId !== id));

  return (
    <>
      <label className="cp f" style={{ flex: '2 1 320px' }}>
        <span><span className="passo">{passo}</span>Exame</span>
        <Icone n="busca" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} disabled={desativado} autoComplete="off"
          placeholder={desativado ? 'Escolha o convênio primeiro' : 'Digite como o paciente falou (ex.: resso joelho, tomo de tórax)'} />
      </label>
      {sugestoes.length > 0 && (
        <div className="sugestoes" role="listbox" aria-label="Exames encontrados" style={{ flexBasis: '100%', margin: 0 }}>
          {sugestoes.map(({ exame: e, rotulo }) => (
            <button type="button" key={e.id} onClick={() => add(e.id, rotulo)}>
              <Icone n="mais" />{rotulo}
              <small>{[rotulo !== e.nome ? e.nome : '', codigosConv.has(e.id) ? `Código ${[...new Set(codigosConv.get(e.id))].join(' ou ')}` : ''].filter(Boolean).join(' · ')}</small>
            </button>
          ))}
        </div>
      )}
      {!semChips && escolhidos.length > 0 && (
        <div className="chips" style={{ flexBasis: '100%', margin: 0 }}>
          {escolhidos.map((x) => {
            const e = b.exames.find((y) => y.id === x.exameId)!;
            return (
              <span className="chip" key={x.exameId}>
                {x.rotulo ?? e.nome}
                <span className="qtd" title="Quantidade (ex.: lados, articulações, segmentos)">
                  <button type="button" onClick={() => qtd(x.exameId, -1)} aria-label="Diminuir quantidade"><Icone n="menos" /></button>
                  <span>{x.quantidade}</span>
                  <button type="button" onClick={() => qtd(x.exameId, 1)} aria-label="Aumentar quantidade"><Icone n="mais" /></button>
                </span>
                <button type="button" onClick={() => tirar(x.exameId)} title="Tirar exame" aria-label={'Tirar ' + e.nome}><Icone n="x" /></button>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Exames da consulta como subtítulo dos passos: nome, quantidade (muda prazos e regras) e tirar. */
export function ExamesEscolhidos({ escolhidos, mudar }: { escolhidos: Escolhido[]; mudar: (e: Escolhido[]) => void }) {
  const b = useBase();
  if (!escolhidos.length) return null;
  const qtd = (id: number, d: number) => mudar(escolhidos.map((x) => (x.exameId === id ? { ...x, quantidade: Math.max(1, x.quantidade + d) } : x)));
  return (
    <div className="exames-sel">
      {escolhidos.map((x) => {
        const e = b.exames.find((y) => y.id === x.exameId)!;
        return (
          <div className="exame-linha" key={x.exameId}>
            <h2>{x.rotulo ?? e.nome}</h2>
            <span className="qtd" title="Quantidade (ex.: lados, articulações, segmentos)">
              <small className="mut">Quantidade</small>
              <button type="button" onClick={() => qtd(x.exameId, -1)} aria-label="Diminuir quantidade"><Icone n="menos" /></button>
              <span>{x.quantidade}</span>
              <button type="button" onClick={() => qtd(x.exameId, 1)} aria-label="Aumentar quantidade"><Icone n="mais" /></button>
            </span>
            <button type="button" className="exame-tirar" onClick={() => mudar(escolhidos.filter((y) => y.exameId !== x.exameId))} title="Tirar exame" aria-label={'Tirar ' + e.nome}><Icone n="x" /></button>
          </div>
        );
      })}
    </div>
  );
}
