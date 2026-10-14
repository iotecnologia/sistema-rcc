// Catálogo de páginas. O cargo decide quais o usuário abre (cadastro em Usuários e cargos).
export interface Pagina { id: string; rota: string; nome: string; grupo: string; icone: string }

export const PAGINAS: Pagina[] = [
  { id: 'agendar', rota: '/agendar', nome: 'Agendar', grupo: 'Atendimento', icone: 'passos' },
  { id: 'convenio', rota: '/convenio', nome: 'Regras do convênio', grupo: 'Atendimento', icone: 'convenio' },
  { id: 'orcamento', rota: '/orcamento', nome: 'Orçamento', grupo: 'Atendimento', icone: 'orcamento' },
  { id: 'preparos', rota: '/preparos', nome: 'Preparos', grupo: 'Atendimento', icone: 'exame' },
  { id: 'contatos', rota: '/contatos', nome: 'Telefones e endereços', grupo: 'Atendimento', icone: 'ramal' },
  { id: 'consultar', rota: '/consultar', nome: 'Consulta completa', grupo: 'Autorização', icone: 'busca' },
  { id: 'convenios', rota: '/convenios', nome: 'Convênios', grupo: 'Autorização', icone: 'convenio' },
  { id: 'exames', rota: '/exames', nome: 'Exames e códigos', grupo: 'Autorização', icone: 'exame' },
  { id: 'medicos', rota: '/medicos', nome: 'Médicos', grupo: 'Cadastros', icone: 'medico' },
  { id: 'maquinas', rota: '/maquinas', nome: 'Máquinas', grupo: 'Cadastros', icone: 'maquina' },
  { id: 'pendencias', rota: '/pendencias', nome: 'Regras a confirmar', grupo: 'Cadastros', icone: 'pendencia' },
  { id: 'usuarios', rota: '/usuarios', nome: 'Usuários e cargos', grupo: 'Cadastros', icone: 'usuarios' },
];

export const GRUPOS = [...new Set(PAGINAS.map((p) => p.grupo))];
