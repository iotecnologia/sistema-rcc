// Tela de entrada (igual ao protótipo): e-mail da clínica + senha, com "mostrar senha" e "esqueci minha senha".
import { useEffect, useState, type FormEvent } from 'react';
import { useSessao } from '../acesso/Sessao';
import { Icone } from '../componentes/Icone';

export function Login() {
  const s = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [esqueci, setEsqueci] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [preparando, setPreparando] = useState<string | null>(null);
  const entrar = (e: FormEvent) => {
    e.preventDefault();
    const u = s.usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) { setErro('E-mail não cadastrado. Fale com a administração.'); return; }
    setPreparando(u.nome.split(' ')[0]);
  };
  const recuperar = (e: FormEvent) => { e.preventDefault(); setEnviado(true); };
  const voltar = () => { setEsqueci(false); setEnviado(false); setErro(''); };

  if (preparando) return <Preparando nome={preparando} fim={() => s.entrar(email)} />;
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
          <div className="rod">Analiza · Central de informações da RCC Diagnósticos por Imagem</div>
        </section>
        <section className="login-form">
          {!esqueci ? (
            <form className="form-caixa" onSubmit={entrar}>
              <h2>Entrar</h2>
              <p className="sub">Use o seu e-mail da clínica e a sua senha.</p>
              <label className="campo">E-mail<span className="inp"><Icone n="medico" /><input type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErro(''); }} placeholder="ex.: izabel@rcc.com.br" autoComplete="username" /></span></label>
              <label className="campo">Senha<span className="inp com-olho"><Icone n="chave" />
                <input type={verSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                <button type="button" className="olho" onClick={() => setVerSenha(!verSenha)} title={verSenha ? 'Esconder senha' : 'Mostrar senha'} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}><Icone n={verSenha ? 'olhoFechado' : 'olho'} /></button>
              </span></label>
              <button type="button" className="link-esqueci" onClick={() => { setEsqueci(true); setErro(''); }}>Esqueci minha senha</button>
              {erro && <div className="trava"><Icone n="x" /><span>{erro}</span></div>}
              <button type="submit" className="btn-entrar" disabled={!email.trim()}>Entrar</button>
              <p className="mut" style={{ fontSize: 12, marginTop: 14 }}>Mock: entre com admin@rcc.exemplo ou atendimento@rcc.exemplo (a senha não é conferida).</p>
            </form>
          ) : (
            <form className="form-caixa" onSubmit={recuperar}>
              <h2>Esqueci minha senha</h2>
              {!enviado ? <>
                <p className="sub">Digite o seu e-mail da clínica. Vamos enviar um link para você criar uma senha nova.</p>
                <label className="campo">E-mail<span className="inp"><Icone n="medico" /><input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex.: izabel@rcc.com.br" /></span></label>
                <button type="submit" className="btn-entrar" disabled={!email.trim()}>Enviar link</button>
              </> : (
                <div className="certo" style={{ marginBottom: 16 }}><Icone n="ok" /><span>Se <b>{email}</b> estiver cadastrado, você vai receber um e-mail com o link para criar uma senha nova. Confira também a caixa de spam.</span></div>
              )}
              <button type="button" className="link-esqueci" style={{ marginTop: 14 }} onClick={voltar}>← Voltar para o login</button>
              <p className="mut" style={{ fontSize: 12, marginTop: 14 }}>Mock: o envio do e-mail funciona quando o sistema tiver servidor. Até lá, a administração redefine a senha.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

const PASSOS = ['Conferindo seu acesso…', 'Carregando convênios e regras…', 'Organizando exames e códigos…', 'Preparando sua área de trabalho…'];

/** Tela de abertura depois do login: logo animado + mensagens de preparo, depois entra no sistema. */
function Preparando({ nome, fim }: { nome: string; fim: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 650);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (i > PASSOS.length) fim(); }, [i, fim]);
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <div className="abertura" role="status" aria-live="polite">
      <div className="abertura-logo"><img src="./rcc-logo.png" alt="RCC Diagnósticos por Imagem" /><span className="onda" /><span className="onda o2" /></div>
      <div className="abertura-nome">ANALIZA</div>
      <div className="abertura-ola">{saud}, {nome}!</div>
      <div className="abertura-barra"><span style={{ width: `${Math.min(100, (i / PASSOS.length) * 100)}%` }} /></div>
      <div className="abertura-msg">{i < PASSOS.length ? PASSOS[i] : 'Tudo pronto!'}</div>
    </div>
  );
}
