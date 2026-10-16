// Médico solicitante: um conselho por linha (CRM, CRO, CREFITO...), cada um com 3 situações possíveis:
//   aceita (✓ verde) · não aceita (✕ vermelho) · aceita com condição (✓ amarelo + a condição)
import { useBase } from './Dados';
import { Icone } from './Icone';

const ORDEM = ['CRM', 'CRO', 'CREFITO'];

export function ConselhosLinhas({ convenioId }: { convenioId: number }) {
  const b = useBase();
  const cons = b.conselhos.filter((c) => c.convenio_id === convenioId)
    .sort((x, y) => (ORDEM.indexOf(x.conselho) + 99) % 99 - (ORDEM.indexOf(y.conselho) + 99) % 99);
  if (!cons.length) return <span className="mut">sem informação — confirmar com o setor de autorização</span>;
  return (
    <ul className="conselhos">
      {cons.map((c) => {
        // "Inclusive ..." é só observação (aceita sem restrição); qualquer outro texto é condição
        const cond = c.aceita && c.restricao && !/^inclusive/i.test(c.restricao);
        const tipo = !c.aceita ? 'nao' : cond ? 'cond' : 'sim';
        return (
          <li key={c.conselho} className={tipo}>
            <span className="ic"><Icone n={c.aceita ? 'ok' : 'x'} /></span>
            <b>{c.conselho}</b>
            <span>{!c.aceita ? 'não aceita' : cond ? c.restricao : `aceita${c.restricao ? ' · ' + c.restricao.toLowerCase() : ''}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
