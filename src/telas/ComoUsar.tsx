// Como usar: tutorial curto, uma lição por quadro, uma informação por linha. Cada lição tem um exemplo para experimentar.
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TituloPagina } from '../componentes/Comuns';
import { Icone } from '../componentes/Icone';
import { abrirTour } from '../componentes/Tour';

const Linha = ({ rot, children }: { rot: string; children: ReactNode }) =>
  <div className="p1-linha"><span className="p1-rot">{rot}</span><span>{children}</span></div>;

function Licao({ n, titulo, children, exemplo, ir }: { n: number; titulo: string; children: ReactNode; exemplo?: string; ir?: string }) {
  const nav = useNavigate();
  return (
    <section className="passo-bloco">
      <div className="passo-num">{n}</div>
      <div className="passo-corpo">
        <h3>{titulo}</h3>
        {children}
        {ir && <div className="licao-rod"><span className="mut">{exemplo}</span>
          <button type="button" className="btn2 pri" onClick={() => nav(ir)}><Icone n="seta" />Experimentar</button></div>}
      </div>
    </section>
  );
}

const Sinal = ({ tipo, txt }: { tipo: 'sim' | 'cond' | 'nao'; txt: string }) =>
  <span className={'sinal ' + tipo}><span className="ic"><Icone n={tipo === 'nao' ? 'x' : 'ok'} /></span>{txt}</span>;

export function ComoUsar() {
  return (
    <>
      <TituloPagina titulo="Como usar" sub="O Analiza não agenda: ele mostra o que fazer para agendar certo. Siga as lições na ordem.">
        <button type="button" className="btn2" onClick={() => abrirTour('mostra')}>Me mostra sozinho</button>
        <button type="button" className="btn2 pri" onClick={() => abrirTour('faz')}>Fazer o tour</button>
      </TituloPagina>
      <div className="passos-resultado">
        <Licao n={1} titulo="Escolha o convênio" exemplo="Exemplo: Amil" ir="/consultar?convenio=amil">
          <Linha rot="Onde">página Consultar, campo 1 (Convênio)</Linha>
          <Linha rot="Como">digite o nome do convênio e clique no nome certo da lista</Linha>
          <Linha rot="Com regras">o sistema mostra o que conferir e com quem pedir a autorização</Linha>
          <Linha rot="Sem regras">o pedido já vem autorizado pelo convênio: confira a guia que o paciente trouxe</Linha>
        </Licao>

        <Licao n={2} titulo="Ache o exame" exemplo="Exemplo: Amil + ressonância de joelho" ir="/consultar?convenio=amil&exame=141&rotulo=Resson%C3%A2ncia%20de%20joelho">
          <Linha rot="Onde">campo 2 (Exame)</Linha>
          <Linha rot="Como">digite do jeito que o paciente falou: “resso joelho”, “tomo de tórax”, “ultrassom barriga”</Linha>
          <Linha rot="Depois">clique no exame certo; se forem vários exames, repita para cada um</Linha>
          <Linha rot="Quantidade">use o + e o − quando for mais de um lado, articulação ou segmento</Linha>
        </Licao>

        <Licao n={3} titulo="Coloque a data do pedido">
          <Linha rot="Onde">campo 3 (Data do pedido)</Linha>
          <Linha rot="Qual data">a data que o médico escreveu no pedido</Linha>
          <Linha rot="Para quê">o sistema mostra até quando dá para marcar e avisa se o pedido venceu</Linha>
        </Licao>

        <Licao n={4} titulo="Leia o resultado, passo por passo">
          <Linha rot="Passo 1">orientações antes de agendar e a partir de quando marcar</Linha>
          <Linha rot="Passo 2">o que conferir no papel do pedido médico</Linha>
          <Linha rot="Passo 3">com quem pedir a autorização e o código (o botão ao lado copia o código)</Linha>
          <Linha rot="Passo 4">a partir de quando e em qual máquina ou médico marcar</Linha>
          <Linha rot="Passo 5">o preparo e o que falar ou perguntar ao paciente</Linha>
        </Licao>

        <Licao n={5} titulo="O que os sinais querem dizer">
          <Linha rot="Aceita"><Sinal tipo="sim" txt="verde: pode" /></Linha>
          <Linha rot="Com condição"><Sinal tipo="cond" txt="amarelo: pode, só se cumprir o que está escrito ao lado" /></Linha>
          <Linha rot="Não aceita"><Sinal tipo="nao" txt="vermelho: não pode" /></Linha>
          <Linha rot="Atenção"><span className="p1-linha aviso" style={{ display: 'inline-block', margin: 0, padding: '2px 10px' }}>faixa amarela: leia antes de continuar</span></Linha>
        </Licao>

        <Licao n={6} titulo="Outras ajudas do sistema">
          <Linha rot="Busca no topo">acha exame, convênio, médico, ramal ou máquina de qualquer tela</Linha>
          <Linha rot="Convênios">resumo de cada convênio: prazos, o que o pedido precisa ter, o que não cobre</Linha>
          <Linha rot="Exames">código do exame em cada convênio, onde fazer, preço particular e preparo</Linha>
          <Linha rot="Médicos e Ramais">digite o nome, o exame ou o setor</Linha>
          <Linha rot="Sino">avisos da equipe; os urgentes aparecem na frente de tudo até você clicar em “Li e entendi”</Linha>
        </Licao>
      </div>
    </>
  );
}
