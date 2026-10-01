# Layout mobile do frontend — Design

- **Data:** 2026-09-29
- **Branch:** `feat/frontend`
- **Escopo:** `frontend/` apenas (backend, dados e hooks não mudam)

## 1. Objetivo

Hoje o front só funciona bem no desktop. A barra lateral (`Sidebar`) é `fixed w-72` e o conteúdo tem `pl-72`
em **qualquer** largura de tela; num celular de 390px sobram ~100px para o conteúdo, os números das
estatísticas somem e o título da categoria é cortado.

Queremos que o site funcione bem em **celular (≈360–430px)**, **tablet (até 1023px)** e **desktop (≥1024px)**,
com o visual do desktop preservado.

### Critérios de sucesso

1. Em celular e tablet não há rolagem horizontal e o conteúdo ocupa a largura toda.
2. As categorias são acessadas por um menu gaveta (drawer) aberto por um botão ☰ no header.
3. No desktop (≥1024px) a barra lateral continua fixa e o ☰ não aparece — visual igual ao atual.
4. Estatísticas em grade 2×2 no celular; títulos e espaçamentos adequados a telas pequenas.
5. Comportamento da gaveta coberto por testes de componente (Vitest) e layout coberto por testes E2E
   (Playwright Test) nos três tamanhos de tela.

### Contexto do projeto

- Projeto de estudo: o objetivo também é aprender o processo (TDD, testes de componente, E2E).
- Stack: React 19 + Vite 6 + Tailwind 3, JavaScript puro.
- Não existe nenhum teste no front hoje.
- O `tailwind.config.js` já tem tokens de mobile não usados: `gutter-mobile` (1rem) e
  `headline-xl-mobile` (2rem).

## 2. Decisões tomadas

| # | Decisão | Escolha | Alternativas descartadas |
|---|---|---|---|
| 1 | Escopo | Celular + tablet + ajustes visuais (títulos, espaçamentos, cards) | Só celular; só a barra lateral |
| 2 | Navegação no mobile | Menu gaveta com botão ☰ | Chips com rolagem horizontal (ruim com 66 categorias); `<select>` nativo (não estilizável, perde contagens) |
| 3 | Estatísticas no mobile | Grade 2×2 compacta | Manter 1 coluna (empurra vencedores para baixo); faixa com rolagem (esconde números) |
| 4 | Testes | Vitest (componente) + Playwright Test (E2E) | Só Vitest (não prova layout); só E2E (ciclo TDD lento) |
| 5 | Abordagem | CSS responsivo (Tailwind) + `useState` no React, reaproveitando a `Sidebar` | `useMediaQuery` em JS (pisca, duplica o CSS); componente `MobileNav` separado (duplica a lista) |

**Breakpoint de virada:** `lg` (1024px). Abaixo → gaveta. A partir dele → barra lateral fixa.

## 3. Estrutura e gaveta

### `App.jsx` — dono do estado

- Novo estado: `const [drawerOpen, setDrawerOpen] = useState(false);`
- Nova ref para o botão ☰ (`menuButtonRef`), usada para devolver o foco quando a gaveta fecha com Esc.
- Passa para o `Header`: `drawerOpen`, `onToggleDrawer` (inverte o estado) e `menuButtonRef`.
- Função `closeDrawer()`: faz `setDrawerOpen(false)` e devolve o foco ao botão ☰
  (`menuButtonRef.current?.focus()`). É o `onClose` passado para a `Sidebar`, usado pelo Esc e pelo fundo escuro.
- Passa para a `Sidebar`: `open={drawerOpen}` e `onClose={closeDrawer}`.
- Ao selecionar uma categoria: `setSelectedCategoryId(id)` **e** `setDrawerOpen(false)` — sem mover o foco, para
  quem usa desktop (onde a gaveta nunca "abre") não ter o foco puxado para um botão escondido.
- Wrapper do conteúdo: `pl-72` → `lg:pl-72`.
- `<main>`: `px-gutter` → `px-gutter-mobile sm:px-gutter`.

### `Header.jsx` — botão ☰

- Botão à esquerda do troféu, visível só abaixo de `lg` (`lg:hidden`).
- Ícone `menu` quando fechado, `close` quando aberto (via `MaterialIcon`).
- Acessibilidade:
  - `aria-label`: "Abrir categorias" (fechado) / "Fechar categorias" (aberto)
  - `aria-expanded`: `"false"` / `"true"`
  - `aria-controls="category-drawer"`
- `onClick` chama `onToggleDrawer`.
- Recebe a ref do botão como prop (React 19 aceita `ref` como prop comum).

### `Sidebar.jsx` — vira gaveta abaixo de `lg`

- `id="category-drawer"` no `<aside>`.
- Largura: `w-72 max-w-[85vw]`.
- Classes por estado (mantendo `fixed left-0 top-20 bottom-0 z-40` e demais classes atuais):
  - Sempre: `transition-transform duration-300 lg:translate-x-0 lg:visible`
  - Fechada: `-translate-x-full invisible`
  - Aberta: `translate-x-0 visible`
- Fundo escuro, renderizado **só quando aberta**: elemento `fixed inset-x-0 top-20 bottom-0 bg-black/60 z-30 lg:hidden`,
  que chama `onClose` ao ser clicado. É um `<div>` com `aria-hidden="true"` — o caminho acessível para fechar é o
  próprio botão ☰ e a tecla Esc.
- Tecla **Esc**: um `useEffect` registra um listener de `keydown` no `document` **apenas enquanto `open` for
  `true`**; ao receber `Escape`, chama `onClose`. Quem devolve o foco ao ☰ é o `closeDrawer()` do `App` — a
  `Sidebar` não conhece o botão.
- O clique numa categoria continua chamando `onSelectCategory(id)`; quem fecha a gaveta é o `App`.

**Por que `invisible`:** um elemento só empurrado para fora da tela ainda recebe foco pelo Tab e é lido pelo
leitor de tela. `visibility: hidden` remove os botões da ordem de foco e da árvore de acessibilidade enquanto a
gaveta está fechada. No desktop, `lg:visible` anula esse efeito.

**Mudança de tamanho de tela com a gaveta aberta:** não precisa de tratamento — no `lg` a barra fica visível pelas
classes `lg:` e o fundo escuro some por `lg:hidden`, independentemente do estado.

### Fora do escopo (YAGNI)

- Travar a rolagem do `<body>` com a gaveta aberta.
- Gestos de arrastar para abrir/fechar.
- Prender o foco dentro da gaveta (focus trap).
- Mudar a altura do header (`h-20`); `top-20`/`pt-20` continuam valendo.

## 4. Ajustes visuais

| Componente | Antes | Depois |
|---|---|---|
| `StatsRibbon` — grade | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md` | `grid-cols-2 lg:grid-cols-4 gap-space-sm sm:gap-space-md` |
| `StatsRibbon` — seção | `py-space-xl` | `py-space-lg sm:py-space-xl` |
| `StatsRibbon` — cartão | `p-space-md gap-space-md` | `p-space-sm sm:p-space-md gap-space-sm sm:gap-space-md` |
| `StatsRibbon` — ícone | `w-12 h-12`, ícone `text-[26px]` | `w-9 h-9 sm:w-12 sm:h-12`, ícone `text-[20px] sm:text-[26px]` |
| `StatsRibbon` — número | `font-headline-md text-headline-md` | `font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md` |
| `WinnersCatalog` — título | `font-headline-xl text-headline-xl` | `font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl` |
| `WinnersCatalog` — grades de cards (conteúdo e skeleton) | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |
| `App` — `<main>` | `px-gutter` | `px-gutter-mobile sm:px-gutter` |

Observações:

- Os rótulos das estatísticas ("Vitórias registradas", "Filmes premiados") podem quebrar em duas linhas no
  celular; isso é aceitável, o texto não muda. O `min-w-0` já existente impede estouro.
- O token `headline-sm` (1.25rem, Bodoni Moda) já existe no `tailwind.config.js` e é usado no `Header`.
- A grade de cards passa a ter 3 colunas só a partir de `xl` (1280px): em 1024px, com a barra de 288px, sobram
  ~690px, estreito demais para 3 cards.

Não mudam: cores, fontes, altura do pôster (`h-80`), selo de vitórias, dados, hooks e serviços.

## 5. Testes

### Dependências (devDependencies do `frontend/`)

`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`,
`@playwright/test`.

### Configuração

- `vite.config.js` ganha a chave `test`: `environment: "jsdom"`, `setupFiles: "./src/test/setup.js"`,
  `globals: true` e `exclude` da pasta `e2e/` (para o Vitest não tentar rodar os testes do Playwright).
- `src/test/setup.js` importa `@testing-library/jest-dom/vitest`.
- `playwright.config.js`:
  - `testDir: "./e2e"`, `use.channel: "chrome"` (usa o Chrome instalado, sem baixar navegador).
  - `webServer`: `npx vite --port 5174 --strictPort` com `env: { VITE_DATA_SOURCE: "planilha", VITE_TMDB_API_KEY: "" }`
    e `baseURL: "http://localhost:5174"`. Não depende de backend nem de internet e não conflita com o servidor de
    desenvolvimento na 5173.
  - Três projetos: `mobile` (390×844), `tablet` (768×1024), `desktop` (1280×800).
- Scripts no `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`.

### Testes de componente (Vitest + Testing Library)

Princípio: testar o que o usuário vê e faz (papéis e nomes acessíveis), não classes CSS.

**`src/components/Header.test.jsx`**
- Com `drawerOpen=false`: existe o botão "Abrir categorias" com `aria-expanded="false"`.
- Com `drawerOpen=true`: o botão se chama "Fechar categorias" e tem `aria-expanded="true"`.
- O botão tem `aria-controls="category-drawer"`.
- Clicar no botão chama `onToggleDrawer` uma vez.

**`src/components/Sidebar.test.jsx`**
- Aberta: o fundo escuro existe; clicar nele chama `onClose`.
- Fechada: o fundo escuro não existe.
- Aberta: apertar Esc chama `onClose`.
- Fechada: apertar Esc **não** chama `onClose`.
- Clicar numa categoria chama `onSelectCategory` com o `categoryId` dela.

**`src/App.test.jsx`** (integração, com `vi.mock("./services/api.js")` devolvendo 2–3 categorias fictícias)
- Abrir a gaveta pelo ☰, clicar numa categoria → o ☰ volta a "Abrir categorias" (`aria-expanded="false"`) e o
  título (`heading`) passa a ser o nome dessa categoria.
- Abrir a gaveta e apertar Esc → a gaveta fecha e o foco está no botão ☰.

### Testes E2E (Playwright Test) — `e2e/layout.spec.js`

**Celular e tablet**
- O botão "Abrir categorias" está visível; a navegação de categorias não está visível.
- Não há rolagem horizontal: `document.documentElement.scrollWidth <= window.innerWidth`.
- O `<main>` começa na borda esquerda (`boundingBox().x` < 1).
- Abrir a gaveta → a navegação fica visível; clicar em "Best Picture" → a gaveta fecha e o título é "Best Picture".
- Estatísticas em duas colunas: os dois primeiros cartões têm o mesmo `y` e `x` diferentes.

**Desktop**
- O botão ☰ não está visível; a navegação de categorias está visível.
- O `<main>` começa em `x ≥ 288`.

### Critério para considerar pronto

`npm test`, `npm run test:e2e` e `npm run build` passando, e prints de conferência nos três tamanhos.

## 6. Arrumação

Criar `.gitignore` na raiz do repositório (hoje não existe) com `.superpowers/` e `.playwright-mcp/`; e
adicionar ao `frontend/.gitignore` (já existe): `test-results/` e `playwright-report/`.

## 7. Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `frontend/src/App.jsx` | estado da gaveta, ref, classes responsivas |
| `frontend/src/components/Header.jsx` | botão ☰ acessível |
| `frontend/src/components/Sidebar.jsx` | comportamento de gaveta, fundo escuro, Esc |
| `frontend/src/components/StatsRibbon.jsx` | grade 2×2 e tamanhos |
| `frontend/src/components/WinnersCatalog.jsx` | título e grade de cards |
| `frontend/vite.config.js` | configuração do Vitest |
| `frontend/playwright.config.js` | novo |
| `frontend/package.json` | scripts e devDependencies |
| `frontend/src/test/setup.js` | novo |
| `frontend/src/**/*.test.jsx`, `frontend/e2e/layout.spec.js` | novos |
| `.gitignore`, `frontend/.gitignore` | pastas geradas |
