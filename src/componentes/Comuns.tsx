// Peças pequenas reaproveitadas em várias telas.
import type { ReactNode } from 'react';
import type { Situacao } from '../tipos/modelos';

const SIT: Record<string, [string, string]> = {
  confirmada: ['t-ok', 'Confirmada'], a_confirmar: ['t-at', 'A confirmar'], conflito: ['t-no', 'Conflito'],
  sem_informacao: ['t-in', 'Sem informação'], vencida: ['t-at', 'Vencida'], substituida: ['t-in', 'Substituída'],
};
export function TagSituacao({ s }: { s: Situacao | string }) {
  const [c, t] = SIT[s] ?? ['t-in', s];
  return <span className={'tag ' + c}>{t}</span>;
}

export function TituloPagina({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="tit-pagina">
      <div><h1>{titulo}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="acoes-pagina">{children}</div>}
    </div>
  );
}

export function Bloco({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="bloco">
      <div className="bloco-cab"><h3>{titulo}</h3>{extra}</div>
      {children}
    </section>
  );
}

export function Kpi({ rot, val, det, cor, txt }: { rot: string; val: ReactNode; det?: ReactNode; cor: string; txt?: boolean }) {
  return (
    <div className="kpi" style={{ ['--c' as string]: cor }}>
      <div className="rot">{rot}</div><div className={'val' + (txt ? ' txt' : '')}>{val}</div>{det && <div className="det">{det}</div>}
    </div>
  );
}

/** Saídas (imprimir/PDF pelo relatório, WhatsApp, copiar) ficam em Relatorio.tsx. */
export { BotoesSaida } from './Relatorio';

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>;
}
