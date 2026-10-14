// Ícones em traço (estilo do protótipo). Uso: <Icone n="busca" />
const P: Record<string, string[]> = {
  inicio: ['M3 11l9-7 9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  busca: ['M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  convenio: ['M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6z'],
  passos: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6l1 1 2-2', 'M4 12l1 1 2-2', 'M4 18l1 1 2-2'],
  exame: ['M9 3h6v3H9z', 'M7 5H5v16h14V5h-2', 'M9 12h6', 'M9 16h4'],
  medico: ['M12 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8z', 'M4 21c1-4 4-6 8-6s7 2 8 6'],
  maquina: ['M4 5h16v12H4z', 'M8 21h8', 'M12 17v4', 'M12 8a3 3 0 1 0 0 6a3 3 0 0 0 0-6z'],
  ramal: ['M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  orcamento: ['M12 2v20', 'M17 6H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H6'],
  pendencia: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  tema: ['M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z'],
  sair: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h11'],
  imprimir: ['M6 9V3h12v6', 'M6 18H4v-7h16v7h-2', 'M6 14h12v7H6z'],
  pdf: ['M14 3H6v18h12V7z', 'M14 3v4h4', 'M12 11v6', 'M9 14l3 3 3-3'],
  zap: ['M4 20l1.5-4A8 8 0 1 1 8 18.5z', 'M9 10c0 3 2 5 5 5l1-1-2-1-1 1c-1 0-2-1-2-2l1-1-1-2z'],
  copiar: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  limpar: ['M4 4v6h6', 'M20 20v-6h-6', 'M5 10a8 8 0 0 1 14-3', 'M19 14a8 8 0 0 1-14 3'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  ok: ['M5 12l5 5 9-10'],
  info: ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z', 'M12 11v5', 'M12 8h.01'],
  calendario: ['M4 5h16v16H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  link: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  arquivo: ['M14 3H6v18h12V7z', 'M14 3v4h4'],
  usuarios: ['M9 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8z', 'M2 21c1-4 3.5-6 7-6s6 2 7 6', 'M16 4a4 4 0 0 1 0 8', 'M18 15c2 .5 3.5 2.5 4 6'],
  mais: ['M12 5v14', 'M5 12h14'],
  editar: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
  menos: ['M5 12h14'],
  seta: ['M5 12h14', 'M13 6l6 6-6 6'],
  volta: ['M19 12H5', 'M11 6l-6 6 6 6'],
};

export function Icone({ n, titulo }: { n: string; titulo?: string }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden={titulo ? undefined : true} role={titulo ? 'img' : undefined}>
      {titulo && <title>{titulo}</title>}
      {(P[n] ?? P.info).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
