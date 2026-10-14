// Orçamento particular / Sócio Remido. Ninguém digita desconto: a forma de pagamento aplica a regra da RCC.
// Não pede CPF (LGPD: não guardar dado de paciente sem necessidade).
import { useMemo, useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { buscarPrecos } from '../regras/busca';
import { brl } from '../util/formato';
import { br, hojeIso, somarDias } from '../regras/calendario';

interface Linha { precoId: number; qtd: number }
type Forma = 'cartao' | 'pix';

/** Parcelamento da RCC: até R$ 300 em 2x · de R$ 300 a R$ 500 em 3x · acima de R$ 500 em 6x. */
export const parcelas = (total: number) => (total <= 300 ? 2 : total <= 500 ? 3 : 6);
/** PIX ou dinheiro: 5% de desconto. */
export const DESCONTO_PIX = 5;

export function Orcamento() {
  const b = useBase();
  const [tabela, setTabela] = useState(b.tabelasPreco[0]?.id ?? 1);
  const [q, setQ] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [forma, setForma] = useState<Forma>('cartao');
  const [paciente, setPaciente] = useState('');
  const precos = b.precos.filter((p) => p.tabela_id === tabela);
  const busca = useMemo(() => (q.trim().length < 2 ? [] : buscarPrecos(precos, q)), [precos, q]);
  const itens = linhas.map((l) => ({ ...l, p: b.precos.find((x) => x.id === l.precoId)! }));
  const subtotal = itens.reduce((s, x) => s + x.p.valor * x.qtd, 0);
  const desconto = forma === 'pix' ? subtotal * DESCONTO_PIX / 100 : 0;
  const total = subtotal - desconto;
  const nx = parcelas(total);
  const add = (id: number) => { setLinhas(linhas.some((l) => l.precoId === id) ? linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + 1 } : l)) : [...linhas, { precoId: id, qtd: 1 }]); setQ(''); };
  const mudarQtd = (id: number, dq: number) => setLinhas(linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + dq } : l)).filter((l) => l.qtd > 0));
  const validade = somarDias(hojeIso(), 30);
  const nomeTabela = b.tabelasPreco.find((t) => t.id === tabela)?.nome ?? '';
  const pagamento = forma === 'pix' ? `PIX ou dinheiro (${DESCONTO_PIX}% de desconto)` : `Cartão em até ${nx}x de ${brl(total / nx)}`;
  const texto = () => [`*Orçamento RCC — ${nomeTabela}*`, paciente && `Paciente: ${paciente}`, ...itens.map((x) => `- ${x.qtd > 1 ? x.qtd + 'x ' : ''}${x.p.procedimento}: ${brl(x.p.valor * x.qtd)}`),
    desconto ? `Desconto PIX/dinheiro: - ${brl(desconto)}` : '', `*Total: ${brl(total)}*`, `Pagamento: ${pagamento}`, `Válido até ${br(validade)} (30 dias)`].filter(Boolean).join('\n');
  const relatorio = () => ({
    titulo: /remido/i.test(nomeTabela) ? 'Orçamento de Exames — Sócio Remido Casa de Saúde' : 'Orçamento de Exames',
    paciente: paciente || undefined,
    secoes: [{ linhas: itens.map((x) => [`${x.qtd > 1 ? x.qtd + 'x ' : ''}${x.p.procedimento}`, brl(x.p.valor * x.qtd)] as [string, string]) },
      { titulo: 'Forma de pagamento', linhas: [[pagamento]] as [string][] }],
    totais: [...(desconto ? [['Subtotal', brl(subtotal)], [`Desconto PIX/dinheiro (${DESCONTO_PIX}%)`, '- ' + brl(desconto)]] as [string, string][] : []), ['Total', brl(total)] as [string, string]],
    rodape: [`Orçamento válido até ${br(validade)} (30 dias).`],
  });

  return (
    <>
      <TituloPagina titulo="Orçamento" sub="Particular ou Sócio Remido. Desconto e parcelas saem sozinhos pela forma de pagamento.">
        <button type="button" className="btn2 ic" onClick={() => { setLinhas([]); setForma('cartao'); setPaciente(''); }} title="Limpar orçamento" aria-label="Limpar orçamento"><Icone n="limpar" /></button>
        <BotoesSaida desativado={!itens.length} texto={texto} relatorio={relatorio} />
      </TituloPagina>
      <div className="barra">
        <label className="cp" style={{ flex: '0 1 220px' }}><span>Tabela</span><select value={tabela} onChange={(e) => { setTabela(Number(e.target.value)); setLinhas([]); }}>{b.tabelasPreco.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
        <label className="cp f" style={{ flex: '2 1 300px' }}><span>Adicionar exame</span><Icone n="busca" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite o exame (ex.: ultrassom abdome, resso joelho)" /></label>
        <label className="cp" style={{ flex: '1 1 200px' }}><span>Nome do paciente (opcional)</span><input value={paciente} onChange={(e) => setPaciente(e.target.value)} /></label>
      </div>
      {busca.length > 0 && <div className="sugestoes">{busca.map((p) => <button type="button" key={p.id} onClick={() => add(p.id)}><Icone n="mais" />{p.procedimento}<small>{p.subgrupo} · {brl(p.valor)}</small></button>)}</div>}
      <div className="grade2">
        <Bloco titulo="Exames" extra={<span className="mut" style={{ fontSize: 12 }}>Tabela: {nomeTabela}</span>}>
          {itens.length ? <table className="tab"><thead><tr><th>Exame</th><th>Qtd</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
            <tbody>{itens.map((x) => <tr key={x.precoId}><td>{x.p.procedimento}</td>
              <td><span className="qtd"><button type="button" onClick={() => mudarQtd(x.precoId, -1)} aria-label="Diminuir"><Icone n="menos" /></button><span>{x.qtd}</span><button type="button" onClick={() => mudarQtd(x.precoId, 1)} aria-label="Aumentar"><Icone n="mais" /></button></span></td>
              <td style={{ textAlign: 'right' }}>{brl(x.p.valor * x.qtd)}</td></tr>)}</tbody></table> : <Vazio>Busque um exame e clique para adicionar.</Vazio>}
        </Bloco>
        <div className="pilha">
          <Bloco titulo="Como o paciente vai pagar?">
            <div className="formas">
              <button type="button" className={forma === 'cartao' ? 'on' : ''} onClick={() => setForma('cartao')}><b>Cartão</b><small>até {nx}x de {brl((subtotal || 0) / nx)}</small></button>
              <button type="button" className={forma === 'pix' ? 'on' : ''} onClick={() => setForma('pix')}><b>PIX ou dinheiro</b><small>{DESCONTO_PIX}% de desconto automático</small></button>
            </div>
            <div className="tot"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            {desconto > 0 && <div className="tot"><span>Desconto PIX/dinheiro ({DESCONTO_PIX}%)</span><span>− {brl(desconto)}</span></div>}
            <div className="tot grande"><span>Total</span><span>{brl(total)}</span></div>
            <div className="pad mut" style={{ fontSize: 12 }}>Válido por 30 dias · até {br(validade)} · sem CPF (LGPD)</div>
          </Bloco>
          <Bloco titulo="Regra de pagamento da RCC">
            <ul className="feed"><li><div>Até R$ 300,00: em até 2x</div></li><li><div>De R$ 300,00 a R$ 500,00: em até 3x</div></li><li><div>Acima de R$ 500,00: em até 6x</div></li><li><div>PIX ou dinheiro: {DESCONTO_PIX}% de desconto</div></li></ul>
          </Bloco>
        </div>
      </div>
    </>
  );
}
