// Relatório no modelo do Analiza antigo (cartão do orçamento): cabeçalho RCC, título, paciente/data/atendente, conteúdo, total.
// Imprime SÓ o cartão (não a tela). Saídas: imprimir, PDF (baixa o arquivo direto para Downloads), WhatsApp, copiar.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icone } from './Icone';
import { useSessao } from '../acesso/Sessao';
import { abrirWhatsApp } from '../util/formato';

export interface SecaoRel { titulo?: string; linhas?: [string, string?][]; texto?: string }
export interface RelatorioDados { titulo: string; paciente?: string; secoes: SecaoRel[]; totais?: [string, string][]; rodape?: string[] }

/** Converte o texto do WhatsApp em relatório (telas que não montam um próprio). */
export const relatorioDeTexto = (t: string): RelatorioDados => {
  const l = t.replace(/\*/g, '').split('\n');
  return { titulo: l[0], secoes: [{ linhas: l.slice(1).filter((x) => x.trim()).map((x) => [x] as [string]) }] };
};

function Cartao({ d }: { d: RelatorioDados }) {
  const { usuario } = useSessao();
  const agora = new Date();
  return (
    <div className="rel-cartao">
      <div className="rel-cab">
        <img src="./rcc-logo.png" alt="RCC" />
        <div><div className="rel-clinica">RCC - Radiologia Clínica de Campinas Ltda.</div>
          <div className="rel-info">Avenida José de Souza Campos, nº 840 · CEP 13092-123 · Campinas - SP<br />Telefone: (19) 3753-5700 · WhatsApp: (19) 99790-9463</div></div>
      </div>
      <h2 className="rel-titulo">{d.titulo}</h2>
      <div className="rel-meta"><span>{d.paciente ? `Paciente: ${d.paciente}` : 'RCC Diagnósticos por Imagem'}</span>
        <span>Data: {agora.toLocaleDateString('pt-BR')} às {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{usuario ? ` · Atendente: ${usuario.nome}` : ''}</span></div>
      {d.secoes.map((s, i) => (
        <div key={i} className="rel-secao">
          {s.titulo && <h3>{s.titulo}</h3>}
          {s.linhas && <table><tbody>{s.linhas.map(([a, b], j) => <tr key={j}><td>{a}</td>{b !== undefined && <td className="v">{b}</td>}</tr>)}</tbody></table>}
          {s.texto && <p className="rel-texto">{s.texto}</p>}
        </div>
      ))}
      {d.totais && <div className="rel-totais">{d.totais.map(([a, b], i) => <div key={i} className={i === d.totais!.length - 1 ? 'fim' : ''}><span>{a}</span><span>{b}</span></div>)}</div>}
      {d.rodape && <div className="rel-rodape">{d.rodape.map((x, i) => <div key={i}>{x}</div>)}</div>}
    </div>
  );
}

/** Nome do arquivo: "Orcamento-de-Exames_OLIVER-AUGUSTO_21-10-2026.pdf" (sem acento e sem espaço). */
const nomeArquivo = (d: RelatorioDados) => {
  const limpo = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const paciente = d.paciente ? '_' + limpo(d.paciente.split(' · ')[0]) : '';
  return `${limpo(d.titulo)}${paciente}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
};

function Janela({ d, texto, fechar }: { d: RelatorioDados; texto: string; fechar: () => void }) {
  useEffect(() => { document.body.classList.add('rel-aberto'); return () => document.body.classList.remove('rel-aberto'); }, []);
  const cartao = useRef<HTMLDivElement>(null);
  const [baixando, setBaixando] = useState(false);
  // gera o PDF do cartão e baixa direto (sem a janela de impressão); a biblioteca só carrega quando alguém clica
  const baixarPdf = async () => {
    const el = cartao.current?.querySelector('.rel-cartao') as HTMLElement | null;
    if (!el || baixando) return;
    setBaixando(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set({ margin: 10, filename: nomeArquivo(d), image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(el).save();
    } finally { setBaixando(false); }
  };
  return createPortal(
    <div className="rel-fundo" onClick={fechar}>
      <div className="rel-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="rel-acoes">
          <button type="button" className="btn2 ic" onClick={() => window.print()} title="Imprimir" aria-label="Imprimir"><Icone n="imprimir" /></button>
          <button type="button" className="btn2 ic" onClick={baixarPdf} disabled={baixando} title={baixando ? 'Gerando o PDF…' : 'Baixar PDF'} aria-label="Baixar PDF"><Icone n="pdf" /></button>
          <button type="button" className="btn2 ic zap" onClick={() => abrirWhatsApp(texto)} title="Enviar por WhatsApp" aria-label="WhatsApp"><Icone n="zap" /></button>
          <button type="button" className="btn2 ic" onClick={() => navigator.clipboard?.writeText(texto).catch(() => undefined)} title="Copiar texto" aria-label="Copiar"><Icone n="copiar" /></button>
          <button type="button" className="btn2 ic" onClick={fechar} title="Fechar" aria-label="Fechar"><Icone n="x" /></button>
        </div>
        <div ref={cartao}><Cartao d={d} /></div>
      </div>
    </div>, document.body);
}

/** Botões de saída da página: abrem o relatório (imprimir/PDF) ou mandam o texto (WhatsApp/copiar). */
export function BotoesSaida({ desativado, texto, relatorio }: { desativado?: boolean; texto: () => string; relatorio?: () => RelatorioDados }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className="btn2 ic imp" disabled={desativado} onClick={() => setAberto(true)} title="Imprimir / PDF" aria-label="Imprimir ou PDF"><Icone n="imprimir" /></button>
      <button type="button" className="btn2 ic zap" disabled={desativado} onClick={() => abrirWhatsApp(texto())} title="Enviar por WhatsApp" aria-label="Enviar por WhatsApp"><Icone n="zap" /></button>
      <button type="button" className="btn2 ic" disabled={desativado} onClick={() => navigator.clipboard?.writeText(texto()).catch(() => undefined)} title="Copiar texto" aria-label="Copiar texto"><Icone n="copiar" /></button>
      {aberto && <Janela d={relatorio ? relatorio() : relatorioDeTexto(texto())} texto={texto()} fechar={() => setAberto(false)} />}
    </>
  );
}
