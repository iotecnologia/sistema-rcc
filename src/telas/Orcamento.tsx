// Orçamento particular / Sócio Remido. Não pede CPF (LGPD: não guardar dado de paciente sem necessidade).
import { useMemo, useState } from 'react';
import { useBase } from '../componentes/Dados';
import { Bloco, BotoesSaida, TituloPagina, Vazio } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { norm } from '../regras/contexto';
import { brl } from '../util/formato';
import { br, hojeIso, somarDias } from '../regras/calendario';

interface Linha { precoId: number; qtd: number }

/** Parcelamento (tabela da RCC). Faixas exatas de R$300 e R$500 estão em pergunta para a equipe. */
export const parcelas = (total: number) => (total <= 300 ? 2 : total <= 500 ? 3 : 6);

export function Orcamento() {
  const b = useBase();
  const [tabela, setTabela] = useState(b.tabelasPreco[0]?.id ?? 1);
  const [q, setQ] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [desc, setDesc] = useState(0);
  const [paciente, setPaciente] = useState('');
  const precos = b.precos.filter((p) => p.tabela_id === tabela);
  const busca = useMemo(() => { const t = norm(q).split(/\s+/).filter(Boolean); return t.length ? precos.filter((p) => t.every((x) => norm(p.procedimento + ' ' + p.subgrupo).includes(x))).slice(0, 12) : []; }, [precos, q]);
  const itens = linhas.map((l) => ({ ...l, p: b.precos.find((x) => x.id === l.precoId)! }));
  const subtotal = itens.reduce((s, x) => s + x.p.valor * x.qtd, 0);
  const d = Math.min(100, Math.max(0, desc || 0));
  const total = subtotal * (1 - d / 100);
  const add = (id: number) => { setLinhas(linhas.some((l) => l.precoId === id) ? linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + 1 } : l)) : [...linhas, { precoId: id, qtd: 1 }]); setQ(''); };
  const mudarQtd = (id: number, dq: number) => setLinhas(linhas.map((l) => (l.precoId === id ? { ...l, qtd: l.qtd + dq } : l)).filter((l) => l.qtd > 0));
  const validade = somarDias(hojeIso(), 30);
  const texto = () => [`*Orçamento RCC — ${b.tabelasPreco.find((t) => t.id === tabela)?.nome}*`, paciente && `Paciente: ${paciente}`, ...itens.map((x) => `- ${x.qtd}x ${x.p.procedimento}: ${brl(x.p.valor * x.qtd)}`),
    d ? `Desconto: ${d}%` : '', `*Total: ${brl(total)}*`, `Parcelamento: até ${parcelas(total)}x · PIX ou dinheiro: 5% de desconto`, `Válido até ${br(validade)} (30 dias)`].filter(Boolean).join('\n');

  const nomeTabela = b.tabelasPreco.find((t) => t.id === tabela)?.nome ?? '';
  const relatorio = () => ({
    titulo: /remido/i.test(nomeTabela) ? 'Orçamento de Exames — Sócio Remido Casa de Saúde' : 'Orçamento de Exames',
    paciente: paciente || undefined,
    secoes: [{ linhas: itens.map((x) => [`${x.qtd > 1 ? x.qtd + 'x ' : ''}${x.p.procedimento}`, brl(x.p.valor * x.qtd)] as [string, string]) },
      { titulo: 'Formas de pagamento', linhas: [['Até R$ 300,00', 'em até 2x'], ['R$ 300,00 a R$ 500,00', 'em até 3x'], ['Acima de R$ 500,00', 'em até 6x'], ['PIX ou dinheiro', '5% de desconto']] as [string, string][] }],
    totais: [...(d ? [['Subtotal', brl(subtotal)], [`Desconto (${d}%)`, '- ' + brl(subtotal - total)]] as [string, string][] : []), ['Total', brl(total)] as [string, string]],
    rodape: [`Orçamento válido até ${br(validade)} (30 dias).`],
  });

  return (
    <>
      <TituloPagina titulo="Orçamento" sub="Some os exames, aplique desconto e envie ao paciente. Válido por 30 dias.">
        <button type="button" className="btn2 ic" onClick={() => { setLinhas([]); setDesc(0); setPaciente(''); }} title="Limpar orçamento" aria-label="Limpar orçamento"><Icone n="limpar" /></button>
        <BotoesSaida desativado={!itens.length} texto={texto} relatorio={relatorio} />
      </TituloPagina>
      <div className="barra">
        <label className="cp" style={{ flex: '0 1 220px' }}><span>Tabela</span><select value={tabela} onChange={(e) => { setTabela(Number(e.target.value)); setLinhas([]); }}>{b.tabelasPreco.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
        <label className="cp f" style={{ flex: '2 1 300px' }}><span>Exame</span><Icone n="busca" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: RM joelho, doppler, tórax" /></label>
        <label className="cp" style={{ flex: '1 1 200px' }}><span>Nome do paciente (opcional)</span><input value={paciente} onChange={(e) => setPaciente(e.target.value)} /></label>
        <label className="cp" style={{ flex: '0 1 120px' }}><span>Desconto %</span><input type="number" min={0} max={100} value={desc || ''} onChange={(e) => setDesc(Number(e.target.value))} /></label>
      </div>
      {busca.length > 0 && <div className="sugestoes">{busca.map((p) => <button type="button" key={p.id} onClick={() => add(p.id)}><Icone n="mais" />{p.procedimento}<small>{p.subgrupo} · {brl(p.valor)}</small></button>)}</div>}
      <div className="grade2">
        <Bloco titulo="Itens">
          {itens.length ? <table className="tab"><thead><tr><th>Exame</th><th>Qtd</th><th>Valor</th></tr></thead>
            <tbody>{itens.map((x) => <tr key={x.precoId}><td>{x.p.procedimento}<div className="mini">{x.p.subgrupo}</div></td>
              <td><span className="qtd"><button type="button" onClick={() => mudarQtd(x.precoId, -1)} aria-label="Diminuir"><Icone n="menos" /></button><span>{x.qtd}</span><button type="button" onClick={() => mudarQtd(x.precoId, 1)} aria-label="Aumentar"><Icone n="mais" /></button></span></td>
              <td>{brl(x.p.valor * x.qtd)}</td></tr>)}</tbody></table> : <Vazio>Busque um exame e clique para adicionar.</Vazio>}
          <div className="tot"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          {d > 0 && <div className="tot"><span>Desconto ({d}%)</span><span>− {brl(subtotal - total)}</span></div>}
          <div className="tot grande"><span>Total</span><span>{brl(total)}</span></div>
        </Bloco>
        <Bloco titulo="Formas de pagamento">
          <ul className="checks">
            <li>Até R$ 300,00: em até 2x</li><li>De R$ 300,00 a R$ 500,00: em até 3x</li><li>Acima de R$ 500,00: em até 6x</li><li>PIX ou dinheiro: 5% de desconto</li>
            <li className="forte">Este orçamento: até {parcelas(total)}x · válido até {br(validade)}</li>
          </ul>
          <div className="pad mini">Av. José de Souza Campos, 840 · (19) 3753-5700 · WhatsApp (19) 99790-9463</div>
        </Bloco>
      </div>
    </>
  );
}
