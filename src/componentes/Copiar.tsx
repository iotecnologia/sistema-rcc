// Código em destaque com botão de copiar ao lado (Consultar, Exames).
import { useState } from 'react';
import { Icone } from './Icone';

/** Código com botão de copiar ao lado (mostra "copiado" por 1,5 s). */
export function Copiar({ codigo, rotulo = 'código' }: { codigo: string; rotulo?: string }) {
  const [ok, setOk] = useState(false);
  const copiar = () => { navigator.clipboard?.writeText(codigo).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => undefined); };
  return (
    <span className="cod-copiar">
      <span className="cod">{codigo}</span>
      <button type="button" onClick={copiar} title={'Copiar ' + rotulo} aria-label={'Copiar ' + rotulo + ' ' + codigo}>{ok ? 'copiado' : <Icone n="copiar" />}</button>
    </span>
  );
}
