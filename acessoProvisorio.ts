// Acesso de teste por tempo limitado. A senha NÃO fica no código: só o hash (PBKDF2-SHA256, 200 mil voltas).
// Atenção: o repositório é público e o site é estático. Isto barra curiosos; não protege os dados dentro do pacote.
// Para renovar: gerar nova senha e novo hash, e mudar VALIDO_ATE.

/** Fim do acesso de teste (horário de Brasília). Depois disso o login recusa e a sessão aberta é encerrada. */
export const VALIDO_ATE = '2026-10-26T23:59:59-03:00';

const SAL = '501964f30138a873b0407905';
const VOLTAS = 200_000;
const HASH = 'e5f3bf4766fcf6d3f2c5b07331a188c1aa608e285dfb8b6cca37a0f0dd5ea3d8';

export const acessoExpirado = (agora: Date = new Date()): boolean => agora.getTime() > new Date(VALIDO_ATE).getTime();

export const dataLimite = (): string => new Date(VALIDO_ATE).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export async function hashSenha(senha: string, sal: string = SAL, voltas: number = VOLTAS): Promise<string> {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(sal), iterations: voltas, hash: 'SHA-256' }, chave, 256);
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function conferirSenha(senha: string): Promise<boolean> {
  return (await hashSenha(senha.trim())) === HASH;
}
