// Orçamento particular / Sócio Remido (mesmo padrão de Convênios e Exames).
// A forma de pagamento aplica a regra da RCC; o desconto extra respeita o limite do cargo de quem está usando.
// Dados do paciente (nome, sobrenome, CPF, RG) só vão para o orçamento impresso / WhatsApp: não ficam gravados.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { buscarPrecos } from '../regras/busca';
import { brl } from '../util/formato';
import { br, hojeIso, somarDias } from '../regras/calendario';
import { descontoMaximo, useSessao } from '../acesso/Sessao';

interface Linha { precoId: number; qtd: number }
type Forma = 'cartao' | 'pix';

/** Parcelamento da RCC: até R$ 300 em 2x · de R$ 300 a R$ 500 em 3x · acima de R$ 500 em 6x. */
export const parcelas = (total: number) => (total <= 300 ? 2 : total <= 500 ? 3 : 6);
/** PIX ou dinheiro: 5% de desconto. */
export const DESCONTO_PIX = 5;

/** CPF: 000.000.000-00 enquanto digita. */
const mascaraCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
/** Confere os dois dígitos do CPF. */
function cpfValido(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dig = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10]);
}

export function Orcamento() {
  const b = useBase();
  const s = useSessao();
  const limite = descontoMaximo(s.cargo);
  const [tabela, setTabela] = useState(b.tabelasPreco[0]?.id ?? 1);
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [forma, setForma] = useState<Forma>('cartao');
  const [pac, setPac] = useState({ nome: '', sobrenome: '', cpf: '', rg: '' });
  const [extra, setExtra] = useState(0);

  const precos = b.precos.filter((p) => p.tabela_id === tabela);
  const busca = useMemo(() => (q.trim().length < 2 ? [] : buscarPrecos(precos, q)), [precos, q]);
  const itens = linhas.map((l) => ({ ...l, p: b.precos.find((x) => x.id === l.precoId)! }));
  const subtotal = itens.reduce((t, x) => t + x.p.valor * x.qtd, 0);
  // desconto: PIX (5%) + desconto extra do atendente (até o limite do cargo)
  const pctPix = forma === 'pix' ? DESCONTO_PIX : 0;
  const pctTotal = Math.min(100, pctPix + extra);
  const desconto = subtotal * pctTotal / 100;
  const total = subtotal - desconto;
  const nx = parcelas(total);
  const add = (id: number) => { setLinhas(linhas.some((l) => l.precoId === id) ? linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + 1 } : l)) : [...linhas, { precoId: id, qtd: 1 }]); setQ(''); setAberto(false); };
  const mudarQtd = (id: number, dq: number) => setLinhas(linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + dq } : l)).filter((l) => l.qtd > 0));
  const tecla = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setAberto(true); setFoco(Math.min(foco + 1, busca.length - 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setFoco(Math.max(foco - 1, 0)); }
    else if (ev.key === 'Enter' && busca[foco]) { ev.preventDefault(); add(busca[foco].id); }
    else if (ev.key === 'Escape') setAberto(false);
  };
  const mudarExtra = (v: string) => { const n = Math.max(0, Math.min(limite, Number(v.replace(',', '.')) || 0)); setExtra(Math.round(n * 10) / 10); };

  const validade = somarDias(hojeIso(), 30);
  const nomeTabela = b.tabelasPreco.find((t) => t.id === tabela)?.nome ?? '';
  const cpfRuim = pac.cpf.replace(/\D/g, '').length === 11 && !cpfValido(pac.cpf);
  const nomeCompleto = `${pac.nome} ${pac.sobrenome}`.trim();
  const docs = [pac.cpf && `CPF ${pac.cpf}`, pac.rg && `RG ${pac.rg}`].filter(Boolean).join(' · ');
  const pagamento = forma === 'pix' ? 'PIX ou dinheiro' : `Cartão em até ${nx}x de ${brl(total / nx)}`;
  const rotDesconto = [pctPix && `PIX ${pctPix}%`, extra && `extra ${extra}%`].filter(Boolean).join(' + ');
  const texto = () => [`*Orçamento RCC — ${nomeTabela}*`, nomeCompleto && `Paciente: ${nomeCompleto}`, docs, ...itens.map((x) => `- ${x.qtd > 1 ? x.qtd + 'x ' : ''}${x.p.procedimento}: ${brl(x.p.valor * x.qtd)}`),
    desconto ? `Desconto (${rotDesconto}): - ${brl(desconto)}` : '', `*Total: ${brl(total)}*`, `Pagamento: ${pagamento}`, `Válido até ${br(validade)} (30 dias)`].filter(Boolean).join('\n');
  const relatorio = () => ({
    titulo: /remido/i.test(nomeTabela) ? 'Orçamento de Exames — Sócio Remido Casa de Saúde' : 'Orçamento de Exames',
    paciente: [nomeCompleto, docs].filter(Boolean).join(' · ') || undefined,
    secoes: [{ linhas: itens.map((x) => [`${x.qtd > 1 ? x.qtd + 'x ' : ''}${x.p.procedimento}`, brl(x.p.valor * x.qtd)] as [string, string]) },
      { titulo: 'Forma de pagamento', linhas: [[pagamento]] as [string][] }],
    totais: [...(desconto ? [['Subtotal', brl(subtotal)], [`Desconto (${rotDesconto})`, '- ' + brl(desconto)]] as [string, string][] : []), ['Total', brl(total)] as [string, string]],
    rodape: [`Orçamento válido até ${br(validade)} (30 dias).`],
  });

  return (
    <>
      <TituloPagina titulo="Orçamento" sub="Particular ou Sócio Remido. Desconto e parcelas saem sozinhos pela forma de pagamento.">
        <button type="button" className="btn2 ic" onClick={() => { setLinhas([]); setForma('cartao'); setPac({ nome: '', sobrenome: '', cpf: '', rg: '' }); setExtra(0); }} title="Limpar orçamento" aria-label="Limpar orçamento"><Icone n="limpar" /></button>
        <BotoesSaida desativado={!itens.length || cpfRuim} texto={texto} relatorio={relatorio} />
      </TituloPagina>

      <div className="orc-topo">
        <div className="busca-conv">
          <Icone n="busca" />
          <input ref={ref} type="search" value={q} autoComplete="off" placeholder="Nome do exame… (ex.: raio x tórax)"
            onChange={(e) => { setQ(e.target.value); setFoco(0); setAberto(true); }} onFocus={() => setAberto(true)}
            onBlur={() => setTimeout(() => setAberto(false), 150)} onKeyDown={tecla} />
          {aberto && q.trim().length >= 2 && (
            <div className="combo-lista" role="listbox">
              {busca.length ? busca.map((p, k) => (
                <button type="button" key={p.id} role="option" aria-selected={k === foco} className={k === foco ? 'foco' : ''}
                  onMouseDown={(ev) => { ev.preventDefault(); add(p.id); }} onMouseEnter={() => setFoco(k)}>
                  <span>{p.procedimento}</span><small>{brl(p.valor)}</small>
                </button>
              )) : <div className="combo-vazio">Nenhum exame com “{q}” na tabela {nomeTabela}.</div>}
            </div>
          )}
        </div>
        <div className="seg" role="group" aria-label="Tabela de preço">
          {b.tabelasPreco.map((t) => <button type="button" key={t.id} className={tabela === t.id ? 'on' : ''} onClick={() => { setTabela(t.id); setLinhas([]); }}>{t.nome}</button>)}
        </div>
      </div>

      <div className="grade2 orc">
        <div className="coluna">
          <Bloco titulo="Paciente">
            <div className="orc-pac">
              <label className="cp"><span>Nome</span><input value={pac.nome} onChange={(e) => setPac({ ...pac, nome: e.target.value })} /></label>
              <label className="cp"><span>Sobrenome</span><input value={pac.sobrenome} onChange={(e) => setPac({ ...pac, sobrenome: e.target.value })} /></label>
              <label className="cp"><span>CPF</span><input inputMode="numeric" placeholder="000.000.000-00" value={pac.cpf} onChange={(e) => setPac({ ...pac, cpf: mascaraCpf(e.target.value) })} className={cpfRuim ? 'erro' : ''} />
                {cpfRuim && <small className="erro-txt">CPF inválido: confira os números</small>}</label>
              <label className="cp"><span>RG</span><input value={pac.rg} maxLength={14} onChange={(e) => setPac({ ...pac, rg: e.target.value.toUpperCase().replace(/[^0-9X.\-]/g, '') })} /></label>
            </div>
          </Bloco>
          <Bloco titulo="Exames" extra={<span className="mut" style={{ fontSize: 12 }}>Tabela: {nomeTabela}{itens.length ? ` · ${itens.length} exame${itens.length > 1 ? 's' : ''}` : ''}</span>}>
            {itens.length ? <table className="tab"><tbody>{itens.map((x) => <tr key={x.precoId}><td>{x.p.procedimento}</td>
              <td style={{ width: 110 }}><span className="qtd"><button type="button" onClick={() => mudarQtd(x.precoId, -1)} aria-label="Diminuir"><Icone n="menos" /></button><span>{x.qtd}</span><button type="button" onClick={() => mudarQtd(x.precoId, 1)} aria-label="Aumentar"><Icone n="mais" /></button></span></td>
              <td style={{ textAlign: 'right', width: 120 }}>{brl(x.p.valor * x.qtd)}</td></tr>)}</tbody></table> : <Vazio>Busque o exame lá em cima e escolha na lista.</Vazio>}
          </Bloco>
        </div>

        <div className="coluna">
          <Bloco titulo="Pagamento">
            <div className="formas">
              <button type="button" className={forma === 'cartao' ? 'on' : ''} onClick={() => setForma('cartao')}><b>Cartão</b><small>até {nx}x de {brl((total || 0) / nx)}</small></button>
              <button type="button" className={forma === 'pix' ? 'on' : ''} onClick={() => setForma('pix')}><b>PIX ou dinheiro</b><small>{DESCONTO_PIX}% de desconto</small></button>
            </div>
            <div className="orc-desc">
              <span>Desconto extra</span>
              <span className="pct"><input type="number" min={0} max={limite} step={0.5} value={extra || ''} placeholder="0" disabled={limite <= 0} onChange={(e) => mudarExtra(e.target.value)} aria-label="Desconto extra em porcentagem" />%</span>
              <span className="tag-lim">{limite >= 100 ? 'sem limite' : limite > 0 ? `seu limite: ${limite}%` : 'seu cargo não dá desconto extra'}</span>
            </div>
            <div className="tot"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            {desconto > 0 && <div className="tot verde"><span>Desconto ({rotDesconto})</span><span>− {brl(desconto)}</span></div>}
            <div className="tot grande"><span>Total</span><span>{brl(total)}</span></div>
            <div className="pad mut" style={{ fontSize: 12 }}>Válido por 30 dias · até {br(validade)}</div>
            <div className="orc-regra">
              <b>Regra de pagamento da RCC</b>
              <span>Até R$ 300: até 2x</span><span>R$ 300 a 500: até 3x</span>
              <span>Acima de R$ 500: até 6x</span><span>PIX/dinheiro: {DESCONTO_PIX}% off</span>
            </div>
          </Bloco>
        </div>
      </div>
    </>
  );
}
