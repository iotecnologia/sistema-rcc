// Acesso de teste, sem data de validade (vale por tempo indeterminado). A senha NÃO fica no código: só o hash (PBKDF2-SHA256, 200 mil voltas).
// Atenção: o repositório é público e o site é estático. Isto barra curiosos; não protege os dados dentro do pacote.
// Para trocar a senha: gerar nova senha e novo hash.

const SAL = '501964f30138a873b0407905';
const VOLTAS = 200_000;
const HASH = 'e5f3bf4766fcf6d3f2c5b07331a188c1aa608e285dfb8b6cca37a0f0dd5ea3d8';

export async function hashSenha(senha: string, sal: string = SAL, voltas: number = VOLTAS): Promise<string> {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(sal), iterations: voltas, hash: 'SHA-256' }, chave, 256);
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function conferirSenha(senha: string): Promise<boolean> {
  return (await hashSenha(senha.trim())) === HASH;
}
