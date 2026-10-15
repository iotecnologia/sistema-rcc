// Tipos de cada tabela da base consolidada (Fase 1).
// Na Fase 2 cada tipo vira uma tabela do PostgreSQL com os mesmos campos.

export type Id = number;

export interface Unidade {
  id: Id; nome: string; apelido: string; observacao: string;
  endereco: string; cep: string; cidade: string; telefones: string;
  whatsapp: string | null; horario_atendimento: string;
}

export interface Convenio {
  id: Id; slug: string; nome: string; cor: string | null; responsavel: string | null;
  ativo: boolean; tem_regras: boolean; portal_url: string | null; portal_rotulo: string | null;
  logo: string | null; nome_atendidos: string;
}

export interface ConvenioConfig {
  convenio_id: Id; validade_pedido_dias: number | null; validade_autorizacao_dias: number | null;
  aceita_copia: boolean | null; exige_original: boolean; exige_cid: boolean; exige_carimbo_assinatura: boolean;
  aceita_multipla_escolha: boolean | null; aceita_outro_estado: boolean | null; guia_sp_sadt: boolean;
  canal_autorizacao: string | null; gera_senha: string | null; observacao: string | null; revisar: boolean;
}

export interface ConvenioPrazo {
  convenio_id: Id; grupo: string | null; tipo: 'agendamento' | 'analise' | string;
  dias: number | null; contagem: 'uteis' | 'corridos' | string; qtd_minima: number | null; observacao: string | null;
}

export interface ConvenioConselho { convenio_id: Id; conselho: string; aceita: boolean; restricao: string | null; }
export interface Plano { convenio_id: Id; nome: string; atende: boolean | null; origem: string; }

export interface Exame { id: Id; tuss: string | null; nome: string; modalidade: string; origem: string; ativo: boolean; tuss_a_confirmar?: boolean; }
export interface GrupoPrazo { id: Id; slug: string; nome: string; }
export interface ExameGrupo { exame_id: Id; grupo_id: Id; }

export interface ConvenioCodigo {
  id: Id; convenio_id: Id; exame_id: Id | null; codigo: string; tipo: string; nome_no_convenio: string;
  observacao: string | null; composicao: boolean; alternativo: boolean; grupo: string | null; secao: string;
  revisao: string | null; status: string; vinculo: string; motivo_sem_vinculo?: string; quantidade?: number;
}

export interface Equipamento { id: Id; nome: string; tipo: string; unidade_id: Id; peso_max_kg: number; }
export interface EquipamentoExame {
  equipamento_id: Id; exame_nome: string; exame_id: Id | null; horarios: number | null; minutos: number | null;
  contraste: string | null; condicao_paciente: string | null; periodo: string | null;
}

export interface Preparo { id: Id; titulo: string; texto: string; vigencia_inicio: string | null; }
export interface Aviso { id: Id; escopo: string; referencia: string | null; texto: string; vigencia_inicio: string | null; vigencia_fim: string | null; fonte: string; }

export interface Medico { id: Id; nome: string; titulo: string; agenda_todos_os_dias: boolean; ativo: boolean; crm: string | null; }
export interface MedicoExame { medico_id: Id; exame_nome: string; exame_id: Id | null; }
export interface MedicoAgenda { medico_id: Id; tipo: 'recorrente' | 'eventual' | string; dia_semana: string | null; data: string | null; inicio: string; fim: string; observacao: string; }
export interface MedicoRestricao { medico_id: Id; texto: string; }

export interface Ramal { id: Id; unidade_id: Id | null; setor: string | null; local: string; numeros: string[] | null; }
export interface TabelaPreco { id: Id; nome: string; }
export interface Preco { id: Id; tabela_id: Id; grupo: string; procedimento: string; subgrupo: string; valor: number; exame_id: Id | null; nomes_alternativos?: string[]; }
export interface Feriado { data: string; nome: string; abrangencia: string; fonte: string; }
export interface Arquivo { arquivo: string; tipo: string; convenio_id: Id | null; tamanho_kb: number; }
export interface Pendencia { id: Id; tipo: string; onde: string; problema: string; acao_sugerida: string; resolvido: boolean; resposta: string | null; }

// ---------------------------------------------------------------- regras padronizadas (28 moldes)
export type Situacao = 'confirmada' | 'a_confirmar' | 'conflito' | 'sem_informacao' | 'substituida' | 'vencida';

export interface Alvo { id: string; nome: string; tipo: 'exame' | 'grupo' | 'item' | 'escopo' | 'recurso'; tuss: string[]; exame_ids: Id[]; }

export interface RegraPadronizada {
  id: string;                 // ex.: BRA-01
  molde: string;              // M01..M28 | INFO | SIS
  molde_nome: string;
  convenio: string | null;    // slug do convênio; null = regra geral da RCC
  alvo_original: string;
  alvos: string[];            // ids do vocabulário de alvos
  campos: Record<string, any>;
  situacao: Situacao;
  texto_original: string;
  fontes: string[];
  resposta?: string | null;
  segue_padrao?: string;
  substituida_por?: string;
  resolucao?: string;
}

export interface PadraoRCC { id: string; molde: string; alvos: string[]; campos: Record<string, any>; texto: string; convenios_que_seguem: string[]; }

export interface RegrasPadronizadas {
  moldes: Record<string, string>;
  alvos: Alvo[];
  padroes: PadraoRCC[];
  regras: RegraPadronizada[];
}
