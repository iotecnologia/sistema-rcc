import { describe, it, expect } from 'vitest';
import { acessoExpirado, conferirSenha, hashSenha, VALIDO_ATE } from '../src/acesso/acessoProvisorio';

describe('acesso provisório', () => {
  it('vale até o fim do dia limite e vence no segundo seguinte', () => {
    const fim = new Date(VALIDO_ATE).getTime();
    expect(acessoExpirado(new Date(fim - 1000))).toBe(false);
    expect(acessoExpirado(new Date(fim + 1000))).toBe(true);
  });
  it('recusa senha errada ou vazia', async () => {
    expect(await conferirSenha('')).toBe(false);
    expect(await conferirSenha('senha-errada')).toBe(false);
  });
  it('o hash é estável para a mesma senha e muda com o sal', async () => {
    expect(await hashSenha('x', 'a', 1000)).toBe(await hashSenha('x', 'a', 1000));
    expect(await hashSenha('x', 'a', 1000)).not.toBe(await hashSenha('x', 'b', 1000));
  });
});
