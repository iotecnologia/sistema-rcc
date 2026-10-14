// Tela de entrada (igual ao protótipo): e-mail da clínica + senha.
import { useState, type FormEvent } from 'react';
import { useSessao } from '../acesso/Sessao';
import { Icone } from '../componentes/Icone';

export function Login() {
  const s = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const entrar = (e: FormEvent) => { e.preventDefault(); if (!s.entrar(email)) setErro('E-mail não cadastrado. Fale com a administração.'); };
  return (
    <div className="app tema-claro" style={{ display: 'block', height: '100vh' }}>
      <div className="login">
        <section className="login-marca">
          <span className="deco" aria-hidden="true" />
          <div className="logo-bloco"><img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" style={{ height: 96, width: 'auto' }} />
            <div style={{ paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,.18)' }}><b>ANALIZA</b><small>CONSULTA DE REGRAS</small></div></div>
          <h1>As regras de cada convênio, <em>certas e no lugar certo.</em></h1>
          <p>Escolha o convênio e os exames: o sistema mostra o código, o que o pedido precisa ter, a data para agendar e o que falar ao paciente.</p>
          <div className="modulos-lista">
            <span><Icone n="busca" />Consulta por convênio</span><span><Icone n="calendario" />Data para agendar</span>
            <span><Icone n="convenio" />Regras dos convênios</span><span><Icone n="imprimir" />Imprimir e enviar</span>
          </div>
          <div className="rod">Analiza · uso interno RCC · nenhum dado de paciente é guardado</div>
        </section>
        <section className="login-form">
          <form className="form-caixa" onSubmit={entrar}>
            <h2>Entrar</h2>
            <p className="sub">Use o seu e-mail da clínica e a sua senha.</p>
            <label className="campo">E-mail<span className="inp"><Icone n="medico" /><input type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErro(''); }} placeholder="ex.: izabel@rcc.com.br" autoComplete="username" /></span></label>
            <label className="campo">Senha<span className="inp"><Icone n="chave" /><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></span></label>
            {erro && <div className="trava"><Icone n="x" /><span>{erro}</span></div>}
            <button type="submit" className="btn-entrar" disabled={!email.trim()}>Entrar</button>
            <p className="mut" style={{ fontSize: 12, marginTop: 14 }}>Mock: entre com admin@rcc.exemplo ou atendimento@rcc.exemplo (a senha não é conferida).</p>
          </form>
        </section>
      </div>
    </div>
  );
}
