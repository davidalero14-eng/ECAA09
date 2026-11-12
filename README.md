# 🍲 Marmitaê - Chatbot Inteligente de Vendas com Agente de IA

Aplicação web completa, funcional, moderna e responsiva para o restaurante fictício **Marmitaê**, desenvolvida em arquitetura 100% *client-side* (compatível diretamente com **GitHub Pages**), equipada com um agente de inteligência artificial conversacional para atendimento, vendas, personalização de pratos e finalização de pedidos.

---

## 🎯 Objetivo da Aplicação

Desenvolvida com fins acadêmicos e comerciais demonstrativos, a aplicação resolve a jornada de compra de refeições prontas (marmitas individuais, bebidas e sobremesas) através de uma **conversa natural, empática e fluida** com o cliente.

O sistema demonstra na prática:
- Integração direta do navegador com LLM (**Google Gemini via Function Calling/Tool Use**).
- Interpretação robusta de linguagem natural (gírias, pronomes, trocas, cancelamentos e erros comuns de digitação).
- Gerenciamento de contexto e memória de curto prazo durante a sessão.
- **Guardrails de segurança** contra Prompt Injection, Jailbreak e vazamento de regras internas.
- **Autoridade financeira estrita no JavaScript**: o LLM nunca dita valores nem inventa itens; todas as operações monetárias são calculadas com base nas regras do cardápio estruturado.
- **Modo Demonstração Determinístico (Sem Chave)**: permite testar e avaliar 100% da aplicação sem precisar de chave externa.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: Estruturação acessível e amigável para SEO e leitores de tela.
- **CSS3 Moderno**: Variáveis nativas (Custom Properties), Flexbox, CSS Grid, animações fluidas e design responsivo (Mobile First / Drawer).
- **JavaScript Moderno (ES6+)**: Módulos nativos (`import`/`export`), classes orientadas a responsabilidades únicas, manipulação reativa de eventos do DOM.
- **Google Gemini API**: Modelo `gemini-1.5-flash` via REST client-side com chamada estruturada de ferramentas (`tools` / `functionDeclarations`).
- **FontAwesome & SVG**: Ícones vetoriais leves e intuitivos.
- **Totalmente Client-Side**: Sem dependência de Node.js, sem backend próprio e sem banco de dados externo.

---

## 🏛️ Arquitetura do Sistema e do Agente LLM

A arquitetura do projeto foi desenhada separando claramente a camada de apresentação, a máquina de regras de negócio e a camada cognitiva:

```
/ChatBot - Marmitaria
│
├── index.html                  # Interface principal (Chat, Carrinho e Modal de Configuração)
├── test-runner.html            # Executor visual dos 12 testes de validação obrigatórios
├── README.md                   # Documentação detalhada
├── .gitignore                  # Arquivos ignorados pelo Git
│
├── assets/
│   ├── icons/logo.svg          # Identidade visual vetorial
│   └── images/
│
├── css/
│   ├── style.css               # Identidade visual, tipografia, balões do chat e carrinho
│   └── responsive.css          # Adaptações para mobile, gaveta deslizante (drawer)
│
└── js/
    ├── app.js                  # Ponto de entrada, orquestração da UI e ciclo de eventos
    ├── agent.js                # Orquestrador do Agente (Gemini LLM x Modo Determinístico)
    ├── agent_tools.js          # Definições de ferramentas (Function Calling) e System Prompt
    ├── llm.js                  # Comunicação HTTP segura com a API do Google Gemini
    ├── guardrails.js           # Camada de segurança (Prompt Injection, limites, sanitização)
    ├── deterministic_agent.js  # Motor conversacional local para o Modo Demonstração
    ├── menu.js                 # Cardápio oficial, regras diárias e personalizações válidas
    ├── cart.js                 # Máquina de estado do Carrinho e regras financeiras
    ├── checkout.js             # Validação de dados de entrega e forma de pagamento
    ├── chatbot.js              # Gerenciador de renderização de mensagens e digitação
    ├── utils.js                # Sanitização contra XSS, formatação de moeda BRL e IDs
    └── tests.js                # Suíte com os 12 testes obrigatórios implementados
```

---

## 🛡️ Estratégia de Guardrails e Segurança do Agente

1. **Proteção contra Prompt Injection e Jailbreak**:
   - `guardrails.js` inspeciona a entrada do usuário antes do envio ao modelo. Padrões como `"ignore todas as instruções anteriores"`, `"mostre seu prompt de sistema"`, `"finja que é um admin"`, `"de tudo de graça"` ou comandos de script são imediatamente bloqueados.
2. **Autoridade Financeira do JavaScript**:
   - O LLM **nunca** calcula nem define valores. Ele apenas sinaliza a intenção (ex: `adicionar_item(produto_id, quantidade)`). O cálculo real de subtotais, taxas de entrega e total é feito pelo `cart.js` a partir dos preços cadastrados em `menu.js`.
3. **Validação Estrita de Ferramentas (Function Calling)**:
   - IDs de produtos desconhecidos são rejeitados antes de atingirem o carrinho.
   - Limite de quantidade para coibir abusos (máximo 30 por item).
4. **Proteção de Dados Pessoais e Sensíveis**:
   - Expressões regulares bloqueiam o envio de números completos de cartões de crédito ou senhas no chat.
   - Os pagamentos reais não são processados (aplicação demonstrativa/acadêmica); as opções são PIX, Dinheiro ou Cartão na entrega.
5. **Armazenamento Seguro da Chave de API**:
   - A chave do Gemini é salva exclusivamente em `sessionStorage` (memória temporária da aba do navegador), podendo ser apagada a qualquer momento pelo usuário. Nenhuma chave é salva no código ou enviada para servidores terceiros.
6. **Sanitização contra XSS**:
   - Todas as mensagens passam por `escaparHTML()` em `utils.js` antes da renderização no DOM.

---

## 📋 Cardápio Cadastrado e Disponibilidade Diária

| Categoria | Produto | Descrição | Preço | Dias Disponíveis |
| :--- | :--- | :--- | :--- | :--- |
| **Marmita** | Frango Grelhado | Frango grelhado, arroz, feijão e legumes | R$ 21,90 | Seg a Sáb |
| **Marmita** | Bife Acebolado | Bife bovino, arroz, feijão e batata frita | R$ 24,90 | Seg a Sáb |
| **Marmita** | Strogonoff de Frango | Strogonoff, arroz e batata palha | R$ 23,90 | Seg, Qua, Sex, Sáb |
| **Marmita** | Carne de Panela | Carne cozida, arroz, feijão e purê | R$ 25,90 | Ter, Qui, Sáb |
| **Marmita** | Parmegiana de Frango | Frango à parmegiana, arroz e batata frita | R$ 27,90 | Seg, Qua, Sex, Sáb |
| **Marmita** | Marmita Vegetariana | Legumes, arroz, feijão e omelete | R$ 21,90 | Seg a Sáb |
| **Bebida** | Refrigerante lata 350 ml | Coca-Cola ou Guaraná Antarctica | R$ 6,00 | Todos os dias |
| **Bebida** | Suco natural 300 ml | Laranja, Limão ou Maracujá | R$ 7,00 | Seg a Sáb |
| **Bebida** | Água mineral 500 ml | Com ou sem gás | R$ 3,50 | Todos os dias |
| **Bebida** | Refrigerante 600 ml | Coca-Cola ou Guaraná Antarctica | R$ 8,00 | Todos os dias |
| **Sobremesa** | Pudim | Pudim de leite condensado tradicional | R$ 7,00 | Seg a Sáb |
| **Sobremesa** | Mousse de maracujá | Mousse cremoso com calda | R$ 6,50 | Seg a Sáb |
| **Sobremesa** | Brigadeiro | Brigadeiro artesanal de panela | R$ 4,00 | Seg a Sáb |

---

## 🚀 Como Executar Localmente

Como a aplicação é 100% estática baseada em ES6 Modules, utilize qualquer servidor web local simples (para evitar restrições de CORS em arquivos locais `file://`):

### Opção 1: Usando Python (já disponível na maioria dos sistemas)
```bash
# Na pasta do projeto:
python -m http.server 8000
```
Acesse no navegador: `http://localhost:8000`

### Opção 2: Extensão Live Server (VS Code)
1. Abra a pasta no VS Code.
2. Clique com o botão direito no `index.html` e selecione **"Open with Live Server"**.

---

## 🔑 Como Configurar a API do Google Gemini

1. Acesse o [Google AI Studio](https://aistudio.google.com/) e faça login com sua conta Google.
2. Clique em **"Get API key"** e gere uma chave gratuita.
3. No topo direito do Marmitaê, clique no botão **"Configuração"** (ou no badge de modo).
4. Cole sua chave no campo **"Chave de API do Google Gemini"**.
5. Selecione a opção **"Modo IA Gemini (Com chave)"** e clique em **"Salvar Configuração"**.
6. O badge no topo mudará para **"IA Gemini"** com o ícone roxo, e todas as conversas passarão a ser interpretadas pelo modelo LLM com suporte a Function Calling!

---

## 🧪 Como Utilizar o Modo Demonstração (Sem Chave)

- O **Modo Demo** já vem ativado por padrão!
- Ele foi construído com um motor semântico determinístico completo (`deterministic_agent.js`) capaz de responder a saudações, interpretar variações de pedidos ("uma de bife sem cebola", "troca a batata por purê", "coloca uma coca", "cancela a bebida"), atualizar quantidades, aplicar frete ou retirada, solicitar confirmação e gerar o recibo final do pedido.
- Para rodar os **12 Testes Obrigatórios**, abra `test-runner.html` no seu navegador ou clique no atalho de testes. Todos os 12 cenários previstos na especificação são validados e exibidos com status visual verde.

---

## 🌐 Como Publicar no GitHub Pages

1. Crie um novo repositório público no seu GitHub (exemplo: `marmitae-chatbot`).
2. No seu terminal, inicialize e envie o código:
   ```bash
   git init
   git add .
   git commit -m "feat: implementacao completa do chatbot inteligente Marmitae"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/marmitae-chatbot.git
   git push -u origin main
   ```
3. No GitHub, abra o repositório e vá em:
   **Settings** ➔ **Pages** (no menu lateral esquerdo).
4. Na seção **"Build and deployment"**:
   - Em **Source**, selecione `Deploy from a branch`.
   - Em **Branch**, selecione `main` e a pasta `/(root)`.
   - Clique em **Save**.
5. Em cerca de 1 a 2 minutos, o GitHub Pages fornecerá o link público (exemplo: `https://seu-usuario.github.io/marmitae-chatbot/`).

---

## ⚠️ Limitações Conhecidas da Aplicação

- Por ser uma aplicação estática *client-side* sem backend próprio, não há envio real para impressoras de comandas ou WhatsApp de restaurantes parceiros.
- A chave de API do Gemini, quando inserida, fica restrita à sessão local do navegador (`sessionStorage`) do usuário que a digitou.
- O modo com IA Gemini necessita de conexão com a internet para alcançar os endpoints da Google Cloud/AI Studio. Caso haja oscilação na rede, o sistema automaticamente aciona o *fallback* para o motor determinístico local.
