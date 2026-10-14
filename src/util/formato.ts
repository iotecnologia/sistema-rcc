// Formatação e pequenas utilidades das telas.
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const saudacao = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

export const iniciais = (nome: string) =>
  nome.replace(/^(Dra?\.)\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

/** Abre o WhatsApp com o texto (o atendente escolhe o contato). */
export const abrirWhatsApp = (texto: string) =>
  window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(texto), '_blank', 'noopener');

/** Guarda / lê preferências leves do navegador (tema, últimas consultas). Nunca dado de paciente. */
export const local = {
  ler<T>(chave: string, padrao: T): T {
    try { const v = localStorage.getItem('analiza:' + chave); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
  },
  gravar(chave: string, valor: unknown) {
    try { localStorage.setItem('analiza:' + chave, JSON.stringify(valor)); } catch { /* sem armazenamento: segue sem lembrar */ }
  },
};
