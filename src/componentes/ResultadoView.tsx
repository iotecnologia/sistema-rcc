// Resultado da consulta (igual ao protótipo aprovado): situação e datas no topo; à esquerda como autorizar e quando/onde;
// à direita o que o pedido precisa ter e o que falar ao paciente. Sem código de regra, sem "fonte", sem etiqueta técnica.
import type { ReactNode } from 'react';
import type { Resultado, ResultadoExame } from '../regras/resultado';
import type { AgendaExame } from '../regras/agenda';
import { br, nomeDia } from '../regras/calendario';
import { useBase } from './Dados';
import { calcularJanela } from '../regras/janela';

const COBERTURA_OK = new Set(['coberto', 'sem_informacao']);
const unicos = (l: string[]) => [...new Set(l)];

/** "RM 2 ou RM 4 · 1 horário (10 min)" — sem repetir máquina. */
export function ondeTexto(e: { agenda: AgendaExame }): string {
  const m = e.agenda.maquinas;
  if (m.length) {
    const nomes = unicos(m.map((x) => x.maquina));
    const h = m.map((x) => x.horarios).filter((x): x is number => !!x);
    const min = h.length ? Math.min(...h) : null;
    return `${nomes.join(' ou ')}${min ? ` · ${min} horário${min > 1 ? 's' : ''} (${min * 10} min)` : ''}`;
  }
  if (e.agenda.medicos.length) {
    const n = e.agenda.medicos.map((x) => x.medico);
    return n.slice(0, 3).join(', ') + (n.length > 3 ? ` e mais ${n.length - 3}` : '');
  }
  return '—';
}

/** Um passo da linha de raciocínio: número + pergunta + resposta curta. */
function Passo({ n, titulo, sub, extra, children }: { n: number; titulo: string; sub?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="passo-bloco">
      <div className="passo-num">{n}</div>
      <div className="passo-corpo"><h3>{titulo}{(sub || extra) && <small>{sub}{extra}</small>}</h3>{children}</div>
    </section>
  );
}


const dia = (d: string) => `${nomeDia(d)} ${br(d).slice(0, 5)}`;

/** Passo 1: uma mensagem de orientação (mesmo estilo do convênio de pedido autorizado), sem "pode / não pode":
 *  mostra as regras e pede para o atendente conferir os passos. */
/** Uma informação por linha: rótulo à esquerda, valor à direita (todos os passos). */
const Linha = ({ rot, children, aviso }: { rot: string; children: ReactNode; aviso?: boolean }) =>
  <div className={'p1-linha' + (aviso ? ' aviso' : '')}><span className="p1-rot">{rot}</span><span>{children}</span></div>;
/** Nome do exame como subtítulo dentro do passo (quando há mais de um exame ou para separar). */
const SubExame = ({ nome, qtd }: { nome: string; qtd?: number }) => <div className="p1-sub">{nome}{qtd && qtd > 1 ? <span className="mut"> · {qtd}x</span> : null}</div>;

/** Rótulo curto para cada item do "o pedido precisa ter". */
function rotuloPedido(t: string): [string, string] {
  const m = t.match(/^([^:]{3,40}):\s*(.*)$/);
  if (m) return [m[1], m[2]];
  if (/m[áa]ximo .* dias|sem prazo|validade/i.test(t)) return ['Validade', t.replace(/^Pedido (com )?/i, '')];
  if (/ORIGINAL|c[óo]pia/i.test(t)) return ['Original ou cópia', t.replace(/^Pedido /, '')];
  if (/carimb/i.test(t)) return ['Carimbo', t.replace(/^Pedido /, '')];
  if (/CID/.test(t)) return ['CID', t];
  if (/m[úu]ltipla escolha/i.test(t)) return ['Múltipla escolha', t];
  if (/CRM de S/i.test(t)) return ['CRM', t];
  if (/SP\/SADT/i.test(t)) return ['Guia', t];
  return ['Conferir', t];
}

function Mensagem1({ r, resp }: { r: Resultado; resp: string }) {
  const j = r.janela;
  const avisoDoConvenio = `${r.convenio.nome}:`;
  const avisos = r.motivos.filter((m) => !m.startsWith(avisoDoConvenio));
  if (!r.convenio.tem_regras) return (
    <>
      <div className="p1-cab">{r.convenio.nome} — o pedido já vem autorizado pelo próprio convênio. Antes de agendar, confira na guia:</div>
      <Linha rot="Nome do paciente">igual ao documento</Linha>
      <Linha rot="Exame">o mesmo que vai ser marcado</Linha>
      <Linha rot="Validade da senha">marcar dentro da data escrita na guia</Linha>
      {avisos.map((m) => <Linha key={m} rot="Atenção" aviso>{m}</Linha>)}
    </>
  );
  return (
    <>
      <div className="p1-cab">{r.convenio.nome} — antes de agendar:</div>
      <Linha rot="Pedido médico">confira no passo 2</Linha>
      <Linha rot="Autorização">pedir com {r.geral.responsavel ?? resp} (passo 3)</Linha>
      <Linha rot="Marcar a partir de">{j.agendarAPartirDe ? <>{dia(j.agendarAPartirDe)} (passo 4)</> : <>só depois que o convênio autorizar (passo 4)</>}</Linha>
      {j.pedidoValeAte && !j.pedidoVencido && <Linha rot="Marcar até">{dia(j.pedidoValeAte)}</Linha>}
      {avisos.map((m) => <Linha key={m} rot="Atenção" aviso>{m}</Linha>)}
    </>
  );
}

export function ResultadoView({ r, dataPedido }: { r: Resultado; dataPedido?: string | null }) {
  const b = useBase();
  const j = r.janela;
  const resp = r.convenio.tem_regras ? (r.geral.responsavel ?? 'setor de autorização') : 'o próprio convênio';
  const prazoDe = (e: ResultadoExame) => {
    const so = calcularJanela(b, r.convenio.slug, [{ exame: e.autorizacao.exame, quantidade: e.quantidade }], dataPedido ?? null, j.hoje);
    return { aPartirDe: so.agendarAPartirDe, motivo: j.prazos.find((x) => x.exameId === e.autorizacao.exame.id)?.motivo ?? so.motivoAPartir };
  };
  return (
    <>
      <div className="passos-resultado">
        <Passo n={1} titulo="Posso agendar?">
          <Mensagem1 r={r} resp={resp} />
        </Passo>
        <Passo n={2} titulo="O pedido está certo?" sub="Confira no papel do paciente">
          {r.combinacao.map((x) => <Linha key={x.id} rot="Atenção" aviso>{x.texto}</Linha>)}
          {r.exames.flatMap((e) => e.autorizacao.regras.filter((x) => x.molde === 'M18').map((x) => <Linha key={x.id} rot="Escrito no pedido">{r.exames.length > 1 ? `${e.autorizacao.exame.nome}: ` : ''}{x.texto}</Linha>))}
          {r.geral.checklist.filter((c) => c.situacao === 'confirmada').map((c) => { const [rot, txt] = rotuloPedido(c.texto); return (
            <Linha key={c.texto} rot={rot}>{txt}{c.link && <> · <a href={'./' + c.link} target="_blank" rel="noopener noreferrer">abrir guia</a></>}</Linha>); })}
          {!r.combinacao.length && !r.geral.checklist.some((c) => c.situacao === 'confirmada') && <p className="mut" style={{ margin: 0 }}>Nada especial para conferir.</p>}
        </Passo>
        <Passo n={3} titulo="Como peço a autorização?">
          <Linha rot="Com quem">{resp}</Linha>
          {r.geral.portal && <Linha rot="Onde"><a href={r.geral.portal.url} target="_blank" rel="noopener noreferrer">{r.geral.portal.rotulo}</a></Linha>}
          {r.exames.map((e) => {
            const a = e.autorizacao;
            const obs = [...(COBERTURA_OK.has(a.cobertura) ? [] : [a.coberturaTexto]), ...a.regras.filter((x) => x.molde !== 'M18').map((x) => x.texto)];
            return (
              <div key={a.exame.id}>
                <SubExame nome={a.exame.nome} qtd={e.quantidade} />
                <Linha rot="Código">{a.codigos.length ? <span className="cod">{unicos(a.codigos.map((c) => c.codigo)).join(' + ')}</span> : <span className="mut">sem código cadastrado</span>}</Linha>
                {obs.map((o) => <Linha key={o} rot="Observação">{o}</Linha>)}
              </div>
            );
          })}
        </Passo>
        <Passo n={4} titulo="Quando e onde marcar?">
          {r.exames.map((e) => {
            const p = prazoDe(e);
            const internos = e.agenda.avisos.filter((x) => x.molde !== 'M26');
            return (
              <div key={e.autorizacao.exame.id}>
                <SubExame nome={e.autorizacao.exame.nome} />
                <Linha rot="Marcar a partir de">{p.aPartirDe ? `${nomeDia(p.aPartirDe)} ${br(p.aPartirDe).slice(0, 5)}` : '—'} <span className="mut">· {p.motivo}</span></Linha>
                <Linha rot="Onde">{ondeTexto(e)}</Linha>
                {internos.map((x) => <Linha key={x.id} rot="Aviso">{x.texto}</Linha>)}
              </div>
            );
          })}
        </Passo>
        <Passo n={5} titulo="O que falo para o paciente?">
          {r.exames.map((e) => {
            const prep = e.agenda.avisos.filter((x) => x.molde === 'M26');
            const nada = !e.agenda.preparos.length && !prep.length && !e.agenda.avisosPaciente.length;
            return (
              <div key={e.autorizacao.exame.id}>
                <SubExame nome={e.autorizacao.exame.nome} />
                {nada && <Linha rot="Preparo">sem preparo</Linha>}
                {e.agenda.preparos.map((pp) => <Linha key={pp.id} rot="Preparo"><span className="preparo-txt">{pp.texto}</span></Linha>)}
                {prep.map((x) => <Linha key={x.id} rot="Avisar">{x.texto}</Linha>)}
                {e.agenda.avisosPaciente.map((a) => <Linha key={a.id} rot="Pergunte">{a.texto}</Linha>)}
              </div>
            );
          })}
        </Passo>
      </div>
    </>
  );
}
