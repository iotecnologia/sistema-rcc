// Catálogo de páginas (mesma ordem do protótipo aprovado). O cargo decide quais o usuário abre.
export interface Pagina { id: string; rota: string; nome: string; grupo: string; icone: string }

export const PAGINAS: Pagina[] = [
  { id: 'inicio', rota: '/inicio', nome: 'Visão geral', grupo: '', icone: 'inicio' },
  { id: 'consultar', rota: '/consultar', nome: 'Consultar', grupo: '', icone: 'busca' },
  { id: 'convenios', rota: '/convenios', nome: 'Convênios', grupo: 'Autorização', icone: 'convenio' },
  { id: 'exames', rota: '/exames', nome: 'Exames', grupo: 'Autorização', icone: 'exame' },
  { id: 'orcamento', rota: '/orcamento', nome: 'Orçamento', grupo: 'Atendimento', icone: 'orcamento' },
  { id: 'medicos', rota: '/medicos', nome: 'Médicos', grupo: 'Atendimento', icone: 'medico' },
  { id: 'maquinas', rota: '/maquinas', nome: 'Máquinas', grupo: 'Atendimento', icone: 'maquina' },
  { id: 'unidades', rota: '/unidades', nome: 'Unidades', grupo: 'Atendimento', icone: 'predio' },
  { id: 'ramais', rota: '/ramais', nome: 'Ramais', grupo: 'Atendimento', icone: 'ramal' },
  { id: 'avisos', rota: '/avisos', nome: 'Avisos', grupo: 'Administração', icone: 'sino' },
  { id: 'cadastros', rota: '/cadastros', nome: 'Cadastros', grupo: 'Administração', icone: 'lista' },
  { id: 'usuarios', rota: '/usuarios', nome: 'Usuários', grupo: 'Administração', icone: 'usuarios' },
  { id: 'ajuda', rota: '/ajuda', nome: 'Como usar', grupo: 'Ajuda', icone: 'info' },
];

// Fora do menu por enquanto (16/10, Oliver): 'agendar' (Agendar passo a passo → vai virar 'Como usar') e 'janela' (Janela de agendamento).
// Os arquivos das telas continuam no projeto; para voltar, é só recolocar a linha aqui.
/** Itens que aparecem no menu apagados (fosco), sem abrir: o que pode entrar no sistema no futuro. */
export const EM_BREVE: { nome: string; grupo: string; icone: string; dica: string }[] = [
  { nome: 'Agendamento', grupo: 'Autorização', icone: 'calendario', dica: 'Em breve: agendar pelo sistema' },
];

export const GRUPOS = [...new Set(PAGINAS.map((p) => p.grupo))];
