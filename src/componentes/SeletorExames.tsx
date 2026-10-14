// Busca de exame no catálogo + exames escolhidos (com quantidade, para articulação/coluna/bilateral).
import { useMemo, useState } from 'react';
import { useBase } from './Dados';
import { Icone } from './Icone';
import { norm } from '../regras/contexto';

export interface Escolhido { exameId: number; quantidade: number }

const ROTULO: Record<string, string> = { RESSONANCIA: 'RM', ANGIORRESSONANCIA: 'Angio-RM', TOMOGRAFIA: 'TC', ANGIOTOMOGRAFIA: 'Angio-TC',
  ULTRASSOM: 'US', DOPPLER: 'Doppler', RX: 'RX', MAMOGRAFIA: 'Mamo', DENSITOMETRIA: 'Densito', OUTROS: 'Outros', PROCEDIMENTO: 'Proced.' };

export function SeletorExames({ convenio, escolhidos, mudar, desativado }: {
  convenio: string; escolhidos: Escolhido[]; mudar: (e: Escolhido[]) => void; desativado?: boolean;
}) {
  const b = useBase();
  const [q, setQ] = useState('');
  const conv = b.convenios.find((c) => c.slug === convenio);
  const comCodigo = useMemo(() => new Set(conv ? b.codigos.filter((c) => c.convenio_id === conv.id && c.exame_id).map((c) => c.exame_id) : []), [b, conv]);
  const sugestoes = useMemo(() => {
    const t = norm(q.trim());
    if (t.length < 2) return [];
    const palavras = t.split(/\s+/);
    return b.exames
      .filter((e) => !escolhidos.some((x) => x.exameId === e.id))
      .filter((e) => { const h = norm(`${e.nome} ${e.tuss ?? ''} ${ROTULO[e.modalidade] ?? ''}`); return palavras.every((p) => h.includes(p)); })
      .sort((a, b2) => Number(comCodigo.has(b2.id)) - Number(comCodigo.has(a.id)))
      .slice(0, 8);
  }, [b, q, escolhidos, comCodigo]);

  const add = (id: number) => { mudar([...escolhidos, { exameId: id, quantidade: 1 }]); setQ(''); };
  const qtd = (id: number, d: number) => mudar(escolhidos.map((x) => (x.exameId === id ? { ...x, quantidade: Math.max(1, x.quantidade + d) } : x)));
  const tirar = (id: number) => mudar(escolhidos.filter((x) => x.exameId !== id));

  return (
    <>
      <label className="cp f" style={{ flex: '2 1 320px' }}>
        <span><span className="passo">2</span>Exame</span>
        <Icone n="busca" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} disabled={desativado} autoComplete="off"
          placeholder={desativado ? 'Escolha o convênio primeiro' : 'Digite o exame ou o código TUSS… ex.: RM joelho, 41001230'} />
      </label>
      {sugestoes.length > 0 && (
        <div className="sugestoes" role="listbox" aria-label="Exames encontrados" style={{ flexBasis: '100%', margin: 0 }}>
          {sugestoes.map((e) => (
            <button type="button" key={e.id} onClick={() => add(e.id)}>
              <Icone n="mais" />{e.nome}
              <small>{ROTULO[e.modalidade] ?? e.modalidade}{e.tuss ? ` · TUSS ${e.tuss}` : ''}{comCodigo.has(e.id) ? ' · tem código no convênio' : ''}</small>
            </button>
          ))}
        </div>
      )}
      {escolhidos.length > 0 && (
        <div className="chips" style={{ flexBasis: '100%', margin: 0 }}>
          {escolhidos.map((x) => {
            const e = b.exames.find((y) => y.id === x.exameId)!;
            return (
              <span className="chip" key={x.exameId}>
                {e.nome}
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
