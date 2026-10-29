// Implementação que lê os JSON da base consolidada (pasta src/dados).
import type { BaseDados, Repositorio } from './repositorio';
import type * as M from '../tipos/modelos';
import unidades from '../dados/unidades.json';
import convenios from '../dados/convenios.json';
import config from '../dados/convenio_config.json';
import prazos from '../dados/convenio_prazos.json';
import conselhos from '../dados/convenio_conselhos.json';
import planos from '../dados/planos.json';
import exames from '../dados/exames.json';
import gruposPrazo from '../dados/grupos_prazo.json';
import exameGrupos from '../dados/exame_grupos.json';
import codigos from '../dados/convenio_codigos.json';
import equipamentos from '../dados/equipamentos.json';
import equipamentoExames from '../dados/equipamento_exames.json';
import preparos from '../dados/preparos.json';
import avisos from '../dados/avisos.json';
import medicos from '../dados/medicos.json';
import medicoExames from '../dados/medico_exames.json';
import medicoAgendas from '../dados/medico_agendas.json';
import medicoRestricoes from '../dados/medico_restricoes.json';
import ramais from '../dados/ramais.json';
import tabelasPreco from '../dados/tabelas_preco.json';
import precos from '../dados/precos.json';
import feriados from '../dados/feriados.json';
import arquivos from '../dados/arquivos.json';
import pendencias from '../dados/pendencias.json';
import regras from '../dados/regras_padronizadas.json';
import pacotes from '../dados/convenio_pacotes.json';
import { codigosDosPacotes, codigosTussPadrao } from './pacotes';

export const baseJson: BaseDados = {
  unidades: unidades as M.Unidade[],
  convenios: convenios as M.Convenio[],
  config: config as M.ConvenioConfig[],
  prazos: prazos as M.ConvenioPrazo[],
  conselhos: conselhos as M.ConvenioConselho[],
  planos: planos as M.Plano[],
  exames: exames as M.Exame[],
  gruposPrazo: gruposPrazo as M.GrupoPrazo[],
  exameGrupos: exameGrupos as M.ExameGrupo[],
  codigos: [...(codigos as M.ConvenioCodigo[]), ...codigosDosPacotes(pacotes as M.ConvenioPacotes[], codigos as M.ConvenioCodigo[], exames as M.Exame[]),
    ...codigosTussPadrao(config as M.ConvenioConfig[], codigos as M.ConvenioCodigo[], exames as M.Exame[])],
  pacotes: pacotes as M.ConvenioPacotes[],
  equipamentos: equipamentos as M.Equipamento[],
  equipamentoExames: equipamentoExames as M.EquipamentoExame[],
  preparos: preparos as M.Preparo[],
  avisos: avisos as M.Aviso[],
  medicos: medicos as M.Medico[],
  medicoExames: medicoExames as M.MedicoExame[],
  medicoAgendas: medicoAgendas as M.MedicoAgenda[],
  medicoRestricoes: medicoRestricoes as M.MedicoRestricao[],
  ramais: ramais as M.Ramal[],
  tabelasPreco: tabelasPreco as M.TabelaPreco[],
  precos: precos as M.Preco[],
  feriados: feriados as M.Feriado[],
  arquivos: arquivos as M.Arquivo[],
  pendencias: pendencias as M.Pendencia[],
  regras: regras as unknown as M.RegrasPadronizadas,
};

export const repoJson: Repositorio = {
  async carregar() { return baseJson; },
};
