# Analiza — RCC Diagnósticos por Imagem (mock funcional)

Central de informações da RCC: o atendente escolhe o **convênio**, os **exames** e a **data do pedido**, e o sistema responde em linguagem simples:
se pode agendar, quais códigos autorizar, o que o pedido precisa ter, a partir de quando e até quando agendar, em qual máquina/médico e qual preparo passar ao paciente.

Este é o **mock funcional** (Fase 2): roda só no navegador e lê os dados de arquivos JSON. A troca para API + PostgreSQL (Fase 3) muda **só** a camada `repositorio/`.

## Como rodar

Requisito: Node 20 ou superior.

```bash
npm install        # instala as dependências
npm run dev        # abre em http://localhost:5173
npm test           # roda os testes das regras (casos reais + varredura de todos convênio × exame)
npm run build      # gera a versão final em dist/
npm run preview    # serve a pasta dist/ para conferir
```

O `build` usa caminhos relativos (`base: './'`) e rotas com `#`, então a pasta `dist/` funciona em qualquer hospedagem estática.

## Estrutura

```
analiza-mock/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── rcc-logo.png
│   └── arquivos/              guias SP/SADT em PDF (links da tela)
├── src/
│   ├── main.tsx / App.tsx     entrada e rotas
│   ├── dados/                 1. DADOS — base consolidada em JSON (gerada pelo pipeline da base)
│   ├── tipos/modelos.ts       tipos de todas as tabelas
│   ├── repositorio/           2. REPOSITÓRIO — de onde vêm os dados
│   │   ├── repositorio.ts         interface única: carregar(): Promise<BaseDados>
│   │   └── repo-json.ts           implementação atual (JSON). Fase 3: repo-api.ts
│   ├── regras/                3. REGRAS — funções puras, sem tela, todas testadas
│   │   ├── calendario.ts          dias úteis (operadora) x dias de atendimento (RCC), feriados
│   │   ├── contexto.ts            busca de regras por convênio / exame / combinação
│   │   ├── frase.ts               transforma a regra padronizada em frase simples
│   │   ├── autorizacao.ts         códigos, cobertura e regras de cada exame
│   │   ├── pedido.ts              validade do pedido, conselhos, guia, checklist
│   │   ├── janela.ts              "agendar a partir de" e "pedido vale até"
│   │   ├── agenda.ts              máquina, médico, preparo e avisos da RCC
│   │   └── resultado.ts           junta tudo: pode agendar / atenção / não pode
│   ├── componentes/           4. TELA — peças reutilizáveis (menu, seletor de exames, resultado)
│   ├── telas/                 4. TELA — uma por item do menu
│   ├── estilos/               rcc.css (visual) + extras.css (estados e impressão)
│   └── util/formato.ts        moeda, WhatsApp, localStorage protegido
└── tests/
    ├── regras.test.ts         26 casos reais (Bradesco, Amil, SulAmérica, Cesp, Hapvida, Mediservice…)
    └── varredura.test.ts      todos os convênios × todos os exames sem erro
```

Regra das camadas: **tela só chama `regras/`**, **`regras/` só recebe `BaseDados`**, e só o `repositorio/` sabe de onde os dados vêm.

## Telas

| Menu | O que faz |
|---|---|
| Visão geral | resumo da base e atalhos |
| Consultar | convênio + exames + data → resultado completo |
| Agendar passo a passo | o mesmo, em 5 etapas com travas (não avança sem responder) |
| Convênios | todas as regras de um convênio: prazos, pedido, regras por tipo, códigos, planos |
| Exames | um exame em todos os convênios + máquina e preparo |
| Orçamento | particular / Sócio Remido, desconto, parcelamento, envio por WhatsApp |
| Médicos · Unidades e máquinas · Ramais | consulta de apoio |
| Regras a confirmar | o que ainda depende de resposta da RCC, com o texto original |

Todo resultado tem **imprimir/PDF**, **WhatsApp** e **copiar**. A impressão sai em preto no branco.

## Como as regras funcionam

- Cada regra da base foi padronizada em um de 28 **moldes** (validade do pedido, antecedência, código, cobertura, conselhos…), guardando sempre o **texto original** e a **fonte**.
- Cada regra tem uma **situação**: `confirmada`, `a_confirmar`, `conflito`, `sem_informacao`, `substituida`, `vencida`. Regra que não está confirmada aparece marcada na tela, nunca escondida.
- **Código, preço e cobertura nunca são alterados sem resposta da RCC.**
- Calendário: prazos da operadora contam dias úteis (seg–sex, sem feriado nacional) a partir do dia seguinte; a RCC atende todos os dias (domingo só RM) e em feriados; validade conta dias corridos a partir do dia seguinte. Com vários exames, vale o maior prazo.

## Atualizar os dados

Os arquivos de `src/dados/` saem do pipeline da base consolidada (`build_base.py → catalogo_regras.py → padroniza.py → liga_codigos.py → aplica_padrao.py`, entregue à parte em `base_consolidada.zip`).
Depois de gerar a base: copie os JSON para `src/dados/` e rode `npm test` antes de publicar.

## LGPD

- Nenhum dado de paciente é gravado. O orçamento não pede CPF; o nome é opcional e não é salvo.
- O navegador guarda só o tema (claro/escuro) e o histórico de consultas (convênio + exames).

## Limitações conhecidas (mock)

- Sem login: o usuário é fixo ("Izabel · Administradora"). Login e perfis entram na Fase 3.
- Máquina e médico são ligados ao exame **pelo nome**; 9 exames de RM/TC ainda não têm máquina (escanometria, radiocirurgia, planejamento oncológico, perfusão, reconstrução 3D, endorretal, PET, urotomografia). O teste `varredura` lista esses casos.
- Os dados estão em JSON dentro do app; edição só pelo pipeline até a Fase 3.
- Respostas pendentes da RCC (40 perguntas) aparecem em "Regras a confirmar".
