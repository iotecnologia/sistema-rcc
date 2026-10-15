// Busca de exame pelo nome falado (regras/busca.ts) + exames escolhidos (com quantidade, para articulação/coluna/bilateral).
import { useMemo, useState } from 'react';
import { useBase } from './Dados';
import { Icone } from './Icone';
import { buscarExames } from '../regras/busca';
import { tussTexto } from '../util/formato';

export interface Escolhido { exameId: number; quantidade: number; rotulo?: string }

const ROTULO: Record<string, string> = { RESSONANCIA: 'RM', ANGIORRESSONANCIA: 'Angio-RM', TOMOGRAFIA: 'TC', ANGIOTOMOGRAFIA: 'Angio-TC',
  ULTRASSOM: 'US', DOPPLER: 'Doppler', RX: 'RX', MAMOGRAFIA: 'Mamo', DENSITOMETRIA: 'Densito', OUTROS: 'Outros', PROCEDIMENTO: 'Proced.' };

export function SeletorExames({ convenio, escolhidos, mudar, desativado }: {
  convenio: string; escolhidos: Escolhido[]; mudar: (e: Escolhido[]) => void; desativado?: boolean;
}) {
  const b = useBase();
  const [q, setQ] = useState('');
  const conv = b.convenios.find((c) => c.slug === convenio);
  const comCodigo = useMemo(() => new Set(conv ? b.codigos.filter((c) => c.convenio_id === conv.id && c.exame_id).map((c) => c.exame_id) : []), [b, conv]);
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
        <span><span className="passo">2</span>Exame</span>
        <Icone n="busca" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} disabled={desativado} autoComplete="off"
          placeholder={desativado ? 'Escolha o convênio primeiro' : 'Digite como o paciente falou (ex.: resso joelho, tomo de tórax)'} />
      </label>
      {sugestoes.length > 0 && (
        <div className="sugestoes" role="listbox" aria-label="Exames encontrados" style={{ flexBasis: '100%', margin: 0 }}>
          {sugestoes.map(({ exame: e, rotulo }) => (
            <button type="button" key={e.id} onClick={() => add(e.id, rotulo)}>
              <Icone n="mais" />{rotulo}
              <small>{rotulo !== e.nome ? e.nome + ' · ' : ''}{ROTULO[e.modalidade] ?? e.modalidade}{e.tuss ? ` · ${tussTexto(e)}` : ''}</small>
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
