// Contrato de acesso aos dados. O motor de regras e as telas só conversam com isto.
// Hoje: repo-json.ts (lê os arquivos da base). Fase 3: repo-api.ts (Node + PostgreSQL), sem mexer no resto.
import type * as M from '../tipos/modelos';

export interface BaseDados {
  unidades: M.Unidade[];
  convenios: M.Convenio[];
  config: M.ConvenioConfig[];
  prazos: M.ConvenioPrazo[];
  conselhos: M.ConvenioConselho[];
  planos: M.Plano[];
  exames: M.Exame[];
  gruposPrazo: M.GrupoPrazo[];
  exameGrupos: M.ExameGrupo[];
  codigos: M.ConvenioCodigo[];
  equipamentos: M.Equipamento[];
  equipamentoExames: M.EquipamentoExame[];
  preparos: M.Preparo[];
  avisos: M.Aviso[];
  medicos: M.Medico[];
  medicoExames: M.MedicoExame[];
  medicoAgendas: M.MedicoAgenda[];
  medicoRestricoes: M.MedicoRestricao[];
  ramais: M.Ramal[];
  tabelasPreco: M.TabelaPreco[];
  precos: M.Preco[];
  feriados: M.Feriado[];
  arquivos: M.Arquivo[];
  pendencias: M.Pendencia[];
  regras: M.RegrasPadronizadas;
}

export interface Repositorio {
  carregar(): Promise<BaseDados>;
}
