// Catálogo de páginas (mesma ordem do protótipo aprovado). O cargo decide quais o usuário abre.
export interface Pagina { id: string; rota: string; nome: string; grupo: string; icone: string }

export const PAGINAS: Pagina[] = [
  { id: 'inicio', rota: '/inicio', nome: 'Visão geral', grupo: '', icone: 'inicio' },
  { id: 'consultar', rota: '/consultar', nome: 'Consultar', grupo: '', icone: 'busca' },
  { id: 'convenios', rota: '/convenios', nome: 'Convênios', grupo: 'Autorização', icone: 'convenio' },
  { id: 'agendar', rota: '/agendar', nome: 'Agendar passo a passo', grupo: 'Autorização', icone: 'passos' },
  { id: 'exames', rota: '/exames', nome: 'Exames', grupo: 'Autorização', icone: 'exame' },
  { id: 'janela', rota: '/janela', nome: 'Janela de agendamento', grupo: 'Autorização', icone: 'calendario' },
  { id: 'orcamento', rota: '/orcamento', nome: 'Orçamento', grupo: 'Atendimento', icone: 'orcamento' },
  { id: 'medicos', rota: '/medicos', nome: 'Médicos', grupo: 'Atendimento', icone: 'medico' },
  { id: 'unidades', rota: '/unidades', nome: 'Unidades e máquinas', grupo: 'Atendimento', icone: 'maquina' },
  { id: 'ramais', rota: '/ramais', nome: 'Ramais', grupo: 'Atendimento', icone: 'ramal' },
  { id: 'cadastros', rota: '/cadastros', nome: 'Cadastros', grupo: 'Administração', icone: 'lista' },
  { id: 'usuarios', rota: '/usuarios', nome: 'Usuários', grupo: 'Administração', icone: 'usuarios' },
];

export const GRUPOS = [...new Set(PAGINAS.map((p) => p.grupo))];
