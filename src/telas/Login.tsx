// Entrada: e-mail cadastrado → cargo → páginas liberadas.
import { useState, type FormEvent } from 'react';
import { useSessao } from '../acesso/Sessao';

export function Login() {
  const s = useSessao();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const entrar = (e: FormEvent) => { e.preventDefault(); if (!s.entrar(email)) setErro('E-mail não cadastrado. Fale com o administrador.'); };
  return (
    <div className="app login-tela tema-claro">
      <form className="login-caixa" onSubmit={entrar}>
        <img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" />
        <h1>Analiza</h1>
        <label className="campo">E-mail<input type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErro(''); }} /></label>
        {erro && <div className="trava"><span>{erro}</span></div>}
        <button type="submit" className="btn-grande pri" disabled={!email.trim()}>Entrar</button>
      </form>
    </div>
  );
}
