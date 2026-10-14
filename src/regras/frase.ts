// Gera a frase que o usuário lê a partir do MOLDE + CAMPOS da regra padronizada.
// Assim duas regras iguais sempre aparecem com o mesmo texto, não importa como foram digitadas.
import type { BaseDados } from '../repositorio/repositorio';
import type { RegraPadronizada } from '../tipos/modelos';

const nomeAlvo = (b: BaseDados, id: string) => b.regras.alvos.find((a) => a.id === id)?.nome ?? id;
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

const COBERTURA: Record<string, string> = {
  coberto: 'Tem cobertura',
  sem_cobertura: 'SEM cobertura',
  consultar_contrato: 'Consultar o contrato antes de autorizar',
  consultar_faturamento: 'Consultar o faturamento antes de autorizar',
  nao_autoriza: 'O convênio NÃO autoriza',
  nao_aceito_no_contrato: 'Não aceito no contrato vigente',
  so_contrato_amb: 'Só autoriza o que está no contrato (códigos AMB)',
  conflito: 'Informação em conflito no cadastro',
};

const ACEITA: Record<string, string> = {
  copia_legivel: 'cópia legível', assinatura_digital: 'pedido digital com assinatura eletrônica',
  original: 'pedido original', digitalizado: 'pedido digitalizado', receituario_unimed_carimbado: 'receituário da Unimed carimbado e assinado',
};

export function frase(b: BaseDados, r: RegraPadronizada): string {
  const c = r.campos ?? {};
  switch (r.molde) {
    case 'M01':
      if (c.sem_prazo) return 'Pedido médico sem prazo de validade';
      if (c.conta_a_partir === 'data_futura_anotada') return 'Se o médico anotar uma data futura, a validade conta a partir dessa data';
      return c.dias ? `Pedido médico vale ${c.dias} dias corridos` : 'Validade do pedido: sem informação';
    case 'M02':
      return c.dias ? `Autorização vale ${c.dias} dias corridos` : 'Validade da autorização: sem informação';
    case 'M03': {
      if (c.grupo === 'regra_geral') return 'Prazos de agendamento contam dias úteis (segunda a sexta, sem feriado nacional)';
      const g = c.grupo === 'cardiaco' ? ' para exames cardíacos' : c.grupo === 'cardiaco+angio' ? ' para exames cardíacos e angio'
        : c.grupo === 'articulacao' ? ` com ${c.qtd_minima} ou mais articulações` : '';
      return `Agendar com ${c.dias} dias úteis${g}${c.contagem_assumida ? ' (unidade não escrita: assumido dias úteis)' : ''}`;
    }
    case 'M04':
      if (c.auditoria_todos) return 'Todos os pedidos vão para auditoria da operadora';
      if (c.dias_min && c.dias_max) return `Liberação em ${c.dias_min} a ${c.dias_max} dias úteis`;
      return c.dias_max ? `A operadora pode levar até ${c.dias_max} dias${c.contagem === 'uteis' ? ' úteis' : ''} para autorizar` : r.texto_original;
    case 'M05': return 'Só agendar DEPOIS de autorizado';
    case 'M06': {
      if (!c.conselhos) return 'Conselhos aceitos: sem informação';
      const aceita = c.conselhos.filter((x: any) => x.aceita).map((x: any) => x.conselho + (x.restricao ? ` (${x.restricao})` : ''));
      const nao = c.conselhos.filter((x: any) => !x.aceita).map((x: any) => x.conselho);
      return [aceita.length ? `Aceita ${lista(aceita)}` : '', nao.length ? `Não aceita ${lista(nao)}` : ''].filter(Boolean).join('. ');
    }
    case 'M07': {
      const ac = (c.aceita ?? []).map((k: string) => ACEITA[k] ?? k);
      if (c.aceita_copia === false) return `NÃO aceita cópia: só ${lista(ac)}`;
      return ac.length ? `Aceita ${lista(ac)}${c.informado_em ? ` (informação de ${c.informado_em})` : ''}` : r.texto_original;
    }
    case 'M08':
      return ({ nao_aceita_multipla_escolha: 'NÃO aceita pedido de múltipla escolha', carimbo_e_assinatura: 'Pedido carimbado e assinado pelo médico',
        cid_ou_indicacao_clinica: 'CID ou indicação clínica em TODOS os exames' } as Record<string, string>)[c.exigencia] ?? r.texto_original;
    case 'M09': return 'Transcrever o pedido médico na guia SP/SADT do convênio antes de enviar';
    case 'M10':
      if (c.canal === 'email') return 'Autorização por e-mail: ' + r.texto_original.replace(/^Por e-mail:\s*/i, '');
      if (c.gera_senha === true) return 'Gera senha';
      if (c.gera_senha === false) return 'Não gera senha';
      return r.texto_original;
    case 'M11':
      if (c.atende === true) return `Atende${Array.isArray(c.planos) ? ': ' + lista(c.planos) : typeof c.planos === 'string' ? ': ' + c.planos : ''}`;
      if (c.atende === false) return `NÃO atende${Array.isArray(c.planos) ? ': ' + lista(c.planos) : ''}`;
      return r.texto_original;
    case 'M13': {
      const base = COBERTURA[c.cobertura] ?? r.texto_original;
      return base + (c.variante ? ` (${c.variante})` : '') + (c.autorizar === false ? ' — não precisa autorizar' : '');
    }
    case 'M14':
      if (c.tabela_pacotes) return `Tem tabela de pacotes (códigos começando com ${c.prefixo})`;
      if (c.codigos?.length) return `Autorizar com o código ${c.codigos.join(c.alternativos ? ' ou ' : ' + ')}${c.status && c.status !== 'ativo' ? ` (${c.status.replace('_', ' ')})` : ''}${c.nao_usar ? ` — não usar ${c.nao_usar.join(', ')}` : ''}`;
      return r.texto_original;
    case 'M15': {
      if (Array.isArray(c.exames)) {
        const nomes = c.exames.map((x: string) => nomeAlvo(b, x));
        const cods = c.codigos?.length ? ` — códigos ${c.codigos.join(' + ')}` : c.codigos_pendentes ? ' — código não informado' : '';
        return `Autorizar junto: ${lista(nomes)}${c.condicao ? ` (${c.condicao})` : ''}${cods}`;
      }
      return c.codigos?.length ? `Autorizar junto os códigos ${c.codigos.join(' + ')}` : r.texto_original;
    }
    case 'M16': {
      const como = Array.isArray(c.autorizar_como) ? lista(c.autorizar_como.map((x: string) => nomeAlvo(b, x))) : c.autorizar_como;
      return `${c.uso === 'agendamento' ? 'Agendar' : 'Autorizar'} como ${como}${c.codigos?.length ? ` (${c.codigos.join(' + ')})` : ''}${c.motivo ? ` — ${c.motivo}` : ''}`;
    }
    case 'M17': {
      const em = Array.isArray(c.desmembrar_em) ? lista(c.desmembrar_em.map((x: string) => nomeAlvo(b, x))) : c.desmembrar_em;
      return `Desmembrar em: ${em}${c.codigos?.length ? ` (${c.codigos.join(' + ')})` : ''}${c.mais_o_que_tiver ? ' — e o que mais tiver no pedido' : ''}`;
    }
    case 'M18':
      if (r.segue_padrao === 'PAD-01') return 'O pedido precisa descrever "tomografia de tórax para avaliação do escore de cálcio"';
      return c.nao_pode_conter ? r.texto_original : r.texto_original.startsWith('Pedido') ? r.texto_original : `O pedido precisa ter: ${r.texto_original}`;
    case 'M19': return 'Pedir relatório médico';
    case 'M20':
      if (c.um_ou_outro) return 'Autorizar só UM: PAAF ou biópsia';
      if (c.conta_por === 'lado') return 'Conta por lado (cada lado é um exame)';
      if (c.max_nodulos_por_mama) return `Máximo de ${c.max_nodulos_por_mama} nódulos por mama`;
      return c.qtd ? `Autorizar quantidade ${String(c.qtd).padStart(2, '0')}${c.sempre_em ? ` (${c.sempre_em}: sempre)` : ''}` : r.texto_original;
    case 'M22':
      if (c.forma === 'percentual') return `Acrescenta ${c.percentual}% ao código do exame`;
      return c.forma === 'junto_pacote' ? 'Cobrado junto com o pacote' : 'Cobrança à parte na guia';
    default: return r.texto_original;
  }
}
