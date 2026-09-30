# Layout mobile do frontend — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o front funcionar bem em celular, tablet e desktop, com a lista de categorias virando um menu gaveta abaixo de 1024px.

**Architecture:** O Tailwind decide o que aparece em cada largura (mobile-first, virada em `lg` = 1024px); o React só guarda `drawerOpen` no `App`. A mesma `Sidebar` é barra fixa no desktop e gaveta no celular. Comportamento testado com Vitest + Testing Library; layout testado com Playwright Test num Chrome real.

**Tech Stack:** React 19, Vite 6, Tailwind 3, JavaScript puro; Vitest 3, jsdom, Testing Library, Playwright Test.

**Spec:** `docs/superpowers/specs/2026-09-29-layout-mobile-design.md`

## Global Constraints

- Todo trabalho fica em `frontend/`, na branch `feat/frontend`. Backend, `services/`, `hooks/` e `data/` não mudam.
- **Sem commits:** o usuário decide quando commitar. Onde um plano normal diria "commit", este diz "checkpoint" — pare e mostre o `git diff --stat`.
- Comunicação e textos da interface em português do Brasil.
- Breakpoint de virada: `lg` (1024px). Abaixo → gaveta. `≥ 1024px` → barra fixa, sem botão ☰.
- Textos exatos: botão ☰ `aria-label` = `"Abrir categorias"` (fechado) / `"Fechar categorias"` (aberto); `aria-controls="category-drawer"`.
- Testes de componente procuram por papel e nome acessível (`getByRole`), não por classe CSS.
- Não mudar cores, fontes, altura do header (`h-20`) nem altura do pôster (`h-80`).
- Novas dependências só em `devDependencies`.
- Comandos rodam dentro de `frontend/`.

## Review Focus

1. **Tab no celular com a gaveta fechada** — o foco não pode cair em botões de categoria invisíveis (é o motivo do `invisible`). Teste E2E na Task 4.
2. **Celular estreito (320px)** — a gaveta não passa de 85% da largura e a página não rola para o lado. Teste E2E na Task 4.
3. **Exatamente 1024px** — já é desktop: sem ☰, barra lateral visível. Teste E2E na Task 4.
4. **Redimensionar de celular (gaveta aberta) para desktop** — o fundo escuro não pode ficar cobrindo a página. Teste E2E na Task 4.
5. **Nome de categoria longo no título** ("Art Direction (Black-And-White)") — não pode causar rolagem horizontal no celular. Teste E2E na Task 4.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `frontend/package.json` | scripts `test`, `test:watch`, `test:e2e`; devDependencies | 1, 4 |
| `frontend/vite.config.js` | chave `test` do Vitest | 1 |
| `frontend/src/test/setup.js` | liga os matchers do jest-dom | 1 |
| `frontend/src/components/Header.jsx` (+ `.test.jsx`) | botão ☰ acessível | 1 |
| `frontend/src/components/Sidebar.jsx` (+ `.test.jsx`) | gaveta: classes por estado, fundo escuro, Esc | 2 |
| `frontend/src/App.jsx` (+ `App.test.jsx`) | estado da gaveta, `closeDrawer`, classes responsivas | 3 |
| `frontend/playwright.config.js`, `frontend/e2e/layout.spec.js` | testes de layout nos 3 tamanhos | 4 |
| `frontend/src/components/StatsRibbon.jsx` | grade 2×2 e tamanhos | 4 |
| `frontend/src/components/WinnersCatalog.jsx` | título e grades de cards responsivos | 4 |
| `.gitignore` (raiz, novo), `frontend/.gitignore` | pastas geradas | 1, 4 |

---

### Task 1: Configurar o Vitest e criar o botão ☰ no Header

**Files:**
- Modify: `frontend/package.json`, `frontend/vite.config.js`
- Create: `frontend/src/test/setup.js`, `.gitignore` (raiz do repositório)
- Modify: `frontend/src/components/Header.jsx`
- Test: `frontend/src/components/Header.test.jsx`

**Interfaces:**
- Produces: `Header({ drawerOpen: boolean, onToggleDrawer: () => void, menuButtonRef?: React.Ref<HTMLButtonElement> })`. O `ref` vai direto no `<button>` do ☰.
- Produces: comandos `npm test` (roda uma vez) e `npm run test:watch`.

- [ ] **Step 1: Instalar as ferramentas de teste**

Run: `npm install -D vitest@^3 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
Expected: termina sem erro e as 5 aparecem em `devDependencies`.

- [ ] **Step 2: Configurar o Vitest**

- `vite.config.js`: adicionar ao objeto do `defineConfig` a chave `test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.js", exclude: ["e2e/**", "node_modules/**"] }`.
- `src/test/setup.js`: uma linha, `import "@testing-library/jest-dom/vitest";`.
- `package.json` → `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.
- Criar `.gitignore` na raiz do repositório com duas linhas: `.superpowers/` e `.playwright-mcp/`.

- [ ] **Step 3: Escrever os testes do Header (vão falhar)**

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header.jsx";

describe("Header", () => {
  it("mostra o botão 'Abrir categorias' quando a gaveta está fechada", () => {
    render(<Header drawerOpen={false} onToggleDrawer={() => {}} />);
    const button = screen.getByRole("button", { name: "Abrir categorias" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "category-drawer");
  });

  it("vira 'Fechar categorias' quando a gaveta está aberta", () => {
    render(<Header drawerOpen onToggleDrawer={() => {}} />);
    expect(screen.getByRole("button", { name: "Fechar categorias" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("chama onToggleDrawer ao clicar", async () => {
    const onToggleDrawer = vi.fn();
    render(<Header drawerOpen={false} onToggleDrawer={onToggleDrawer} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir categorias" }));
    expect(onToggleDrawer).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test -- src/components/Header.test.jsx`
Expected: 3 testes FAIL com `Unable to find an accessible element with the role "button"`. Se falhar por outro motivo (ex.: `document is not defined`), a configuração do Step 2 está errada — corrija antes de seguir.

- [ ] **Step 5: Implementar o botão em `Header.jsx`**

- Assinatura: `export default function Header({ drawerOpen = false, onToggleDrawer, menuButtonRef })`.
- `<button type="button">` antes do troféu, dentro da `div` flex existente, com `ref={menuButtonRef}`, `onClick={onToggleDrawer}`, `aria-expanded={drawerOpen}`, `aria-controls="category-drawer"`, `aria-label` conforme os Global Constraints.
- Classes: `lg:hidden` para sumir no desktop, mais algo como `w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container transition-colors`.
- Conteúdo: `<MaterialIcon name={drawerOpen ? "close" : "menu"} className="text-[26px]" />`. O `MaterialIcon` já tem `aria-hidden`, então o nome acessível vem só do `aria-label`.
- Atualizar o comentário JSDoc do componente para mencionar o botão.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test`
Expected: `3 passed`.

- [ ] **Step 7: Checkpoint (sem commit)**

Run: `git status --short` e mostrar ao usuário.

---

### Task 2: Transformar a Sidebar em gaveta

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`
- Test: `frontend/src/components/Sidebar.test.jsx`

**Interfaces:**
- Consumes: configuração do Vitest (Task 1).
- Produces: `Sidebar({ categories, loading, error, selectedCategoryId, onSelectCategory, open: boolean, onClose: () => void })`.
  - `<aside id="category-drawer">`; a `<nav>` ganha `aria-label="Categorias"` (usada pelos testes E2E).
  - Fundo escuro: `<div data-testid="drawer-backdrop" aria-hidden="true">`, renderizado só com `open === true`.

- [ ] **Step 1: Escrever os testes da Sidebar (vão falhar)**

Montar um helper `renderSidebar(props)` com duas categorias fixas (`{ categoryId: 1, categoryName: "BEST PICTURE", categoryClass: "Title", winsCount: 98, winners: [] }` e `{ categoryId: 2, categoryName: "DIRECTING", ... winsCount: 93 }`), `loading: false`, `error: null`, `selectedCategoryId: 1` e `vi.fn()` para `onSelectCategory`/`onClose`.

| Teste | Arranjo | Verificação |
|---|---|---|
| `mostra o fundo escuro quando aberta` | `open` | `getByTestId("drawer-backdrop")` existe |
| `não mostra o fundo escuro quando fechada` | `open={false}` | `queryByTestId("drawer-backdrop")` é `null` |
| `fecha ao clicar no fundo escuro` | `open`; clicar no backdrop | `onClose` chamado 1 vez |
| `fecha com Esc quando aberta` | `open`; `userEvent.keyboard("{Escape}")` | `onClose` chamado 1 vez |
| `ignora Esc quando fechada` | `open={false}`; Esc | `onClose` não chamado |
| `seleciona a categoria clicada` | `open`; clicar em `getByRole("button", { name: /Directing/ })` | `onSelectCategory` chamado com `2` |

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/components/Sidebar.test.jsx`
Expected: os testes de backdrop e de Esc FAIL. `seleciona a categoria clicada` e `ignora Esc quando fechada` podem já passar, porque esse comportamento já existe; está certo, eles protegem contra regressão.

- [ ] **Step 3: Implementar em `Sidebar.jsx`**

- Adicionar as props `open = false` e `onClose`.
- `useEffect` dependente de `[open, onClose]`: só quando `open` é verdadeiro, registrar `keydown` no `document` que chama `onClose()` se `event.key === "Escape"`; a função de limpeza remove o listener.
- Retornar um fragmento: o backdrop (condicional) + o `<aside>`.
  - Backdrop: `fixed inset-x-0 top-20 bottom-0 z-30 bg-black/60 lg:hidden`, `onClick={onClose}`.
  - `<aside id="category-drawer">`: manter `fixed left-0 top-20 bottom-0 bg-surface-container-lowest overflow-y-auto shadow-[...] z-40`; trocar `w-72` por `w-72 max-w-[85vw]`; acrescentar `transition-transform duration-300 lg:translate-x-0 lg:visible` e, conforme o estado, `translate-x-0 visible` (aberta) ou `-translate-x-full invisible` (fechada).
- `<nav aria-label="Categorias">`.
- Atualizar o JSDoc explicando por que se usa `invisible` (tira os botões do Tab e do leitor de tela quando a gaveta está fechada).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `9 passed` (3 do Header + 6 da Sidebar).

- [ ] **Step 5: Checkpoint (sem commit)**

---

### Task 3: Ligar a gaveta no App

**Files:**
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: `Header` (Task 1) e `Sidebar` (Task 2), com as props exatas dos blocos Produces.
- Consumes: `getCategoryAwards()` de `./services/api.js`, que devolve `Promise<Array<Category>>`. No teste ele é substituído por mock.
- Produces: `App` com `drawerOpen`, `menuButtonRef` (`useRef(null)`), `closeDrawer()` (fecha e foca o ☰) e `handleSelectCategory(id)` (seleciona e fecha, sem mover o foco).

- [ ] **Step 1: Escrever os testes de integração (vão falhar)**

```jsx
vi.mock("./services/api.js", () => ({
  getCategoryAwards: vi.fn().mockResolvedValue([
    { categoryId: 1, categoryName: "BEST PICTURE", categoryClass: "Title", winsCount: 0, winners: [] },
    { categoryId: 2, categoryName: "DIRECTING", categoryClass: "Directing", winsCount: 0, winners: [] },
  ]),
}));
```

| Teste | Passos | Verificação |
|---|---|---|
| `o botão abre a gaveta` | `render(<App />)`; aguardar `findByRole("button", { name: /Directing/ })`; clicar em "Abrir categorias" | existe o botão "Fechar categorias" com `aria-expanded="true"` |
| `escolher uma categoria fecha a gaveta e troca o título` | render; aguardar; clicar em "Abrir categorias"; clicar em "Directing" | existe o botão "Abrir categorias" com `aria-expanded="false"`; `getByRole("heading", { level: 2, name: "Directing" })` existe |
| `Esc fecha a gaveta e devolve o foco ao botão` | render; aguardar; clicar em "Abrir categorias"; dar foco a outro elemento com `screen.getByRole("button", { name: /Directing/ }).focus()`; `userEvent.keyboard("{Escape}")` | o botão "Abrir categorias" existe e `toHaveFocus()` |

Notas:
- No Esc, o foco é movido de propósito para a categoria antes de apertar a tecla: o clique no ☰ já deixa o foco nele, e sem esse passo o teste passaria mesmo sem o `closeDrawer` devolver o foco.
- Com `winners: []`, o catálogo mostra "Nenhuma vitória registrada" e não chama os pôsteres.
- Se o nome formatado não for exatamente "Directing", conferir `formatCategoryName` em `src/utils/format.js` e ajustar a expectativa, não a função.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/App.test.jsx`
Expected: os 3 testes FAIL. O `App` ainda não passa `drawerOpen`/`onToggleDrawer` ao `Header`, então o botão nunca vira "Fechar categorias" (`Unable to find ... name "Fechar categorias"`), e o Esc não devolve o foco (`toHaveFocus` falha). O segundo teste pode falhar só no primeiro `expect` que dependa da gaveta aberta; confira que a falha é essa, e não um erro de import ou de mock.

- [ ] **Step 3: Implementar em `App.jsx`**

- `useState(false)` para `drawerOpen` e `useRef(null)` para `menuButtonRef`; importar `useRef` e `useCallback`.
- `closeDrawer` com `useCallback`: `setDrawerOpen(false)` e `menuButtonRef.current?.focus()`. Estável, para não re-registrar o listener de Esc a cada render.
- `handleSelectCategory(id)`: `setSelectedCategoryId(id)` e `setDrawerOpen(false)`.
- `<Header drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((open) => !open)} menuButtonRef={menuButtonRef} />`.
- `<Sidebar ... open={drawerOpen} onClose={closeDrawer} onSelectCategory={handleSelectCategory} />`.
- Wrapper: `pl-72` → `lg:pl-72`. `<main>`: `px-gutter` → `px-gutter-mobile sm:px-gutter`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `12 passed`.

- [ ] **Step 5: Conferir o build**

Run: `npm run build`
Expected: termina com `✓ built in`, sem erros.

- [ ] **Step 6: Checkpoint (sem commit)**

---

### Task 4: Testes E2E de layout e ajustes visuais

**Files:**
- Modify: `frontend/package.json`, `frontend/.gitignore`
- Create: `frontend/playwright.config.js`, `frontend/e2e/layout.spec.js`
- Modify: `frontend/src/components/StatsRibbon.jsx`, `frontend/src/components/WinnersCatalog.jsx`

**Interfaces:**
- Consumes: `nav` com `aria-label="Categorias"` (Task 2), `data-testid="drawer-backdrop"` (Task 2), botão "Abrir categorias"/"Fechar categorias" (Task 1), `<main>` (Task 3).
- Produces: `<section aria-label="Estatísticas">` no `StatsRibbon`, cujos cartões são os filhos diretos da `div` de grade; comando `npm run test:e2e`.

- [ ] **Step 1: Instalar e configurar o Playwright**

- Run: `npm install -D @playwright/test`. Não rodar `npx playwright install`: usamos o Chrome já instalado.
- `package.json` → `"test:e2e": "playwright test"`.
- `frontend/.gitignore`: acrescentar `test-results/` e `playwright-report/`.
- `playwright.config.js` (`defineConfig` de `@playwright/test`):
  - `testDir: "./e2e"`, `use: { baseURL: "http://localhost:5174", channel: "chrome" }`.
  - `webServer: { command: "npx vite --port 5174 --strictPort", url: "http://localhost:5174", reuseExistingServer: false, env: { VITE_DATA_SOURCE: "planilha", VITE_TMDB_API_KEY: "" } }`.
  - `projects`: `mobile` com `viewport: { width: 390, height: 844 }`, `tablet` com `768×1024` e `desktop` com `1280×800`.

- [ ] **Step 2: Escrever `e2e/layout.spec.js`**

Helpers: `const menu = (page) => page.getByRole("button", { name: /categorias/i })`, `const nav = (page) => page.getByRole("navigation", { name: "Categorias" })` e `noHorizontalScroll(page)`, que avalia `document.documentElement.scrollWidth <= window.innerWidth` e espera `true`. Em todo teste: `await page.goto("/")` e aguardar `nav(page).getByRole("button").first()` estar anexado (`toBeAttached()`), ou seja, os dados carregaram.

Usar `test.describe` + `test.skip(({ viewport }) => viewport.width >= 1024)` para o grupo "celular e tablet", e o inverso para "desktop". Nos testes marcados "só no projeto `mobile`", usar `test.skip(test.info().project.name !== "mobile")` no início do teste.

**Celular e tablet:**

| Teste | Verificação |
|---|---|
| `gaveta começa fechada` | `menu` visível, com nome "Abrir categorias"; `nav` `toBeHidden()` |
| `sem rolagem horizontal e conteúdo na borda` | `noHorizontalScroll`; `page.locator("main").boundingBox()` com `x < 1` |
| `abrir, escolher e fechar` | clicar em `menu`; `nav` visível; clicar em `nav.getByRole("button", { name: /^Best Picture/ })`; `nav` escondida; `getByRole("heading", { level: 2 })` com texto "Best Picture" |
| `estatísticas em 2 colunas` | pegar os dois primeiros filhos de `getByRole("region", { name: "Estatísticas" }).locator(":scope > div > div")`; mesmo `y` (diferença < 2) e `x` diferentes |
| `Tab não entra na gaveta fechada` *(Review Focus 1)* | apertar Tab 5 vezes; `nav` não contém o elemento focado (`page.evaluate` → `document.activeElement.closest("nav") === null`) |
| `nome longo não estoura` *(Review Focus 5)* | abrir a gaveta e escolher `/^Art Direction \(Black-And-White\)/`; `noHorizontalScroll` |
| `320px: gaveta cabe e sem rolagem` *(Review Focus 2)* | só no projeto `mobile`; `page.setViewportSize({ width: 320, height: 640 })`; abrir a gaveta; largura do `#category-drawer` ≤ 272 (85% de 320); `noHorizontalScroll` |
| `ir para o desktop com a gaveta aberta` *(Review Focus 4)* | só no projeto `mobile`; abrir a gaveta; `setViewportSize({ width: 1280, height: 800 })`; `getByTestId("drawer-backdrop")` `toBeHidden()`; `nav` visível |

**Desktop:**

| Teste | Verificação |
|---|---|
| `barra lateral fixa, sem ☰` | `menu` `toBeHidden()`; `nav` visível; `main` com `x ≥ 288` |
| `1024px já é desktop` *(Review Focus 3)* | `setViewportSize({ width: 1024, height: 768 })`; `menu` escondido; `nav` visível |

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:e2e`
Expected: FAIL em `estatísticas em 2 colunas` (a região "Estatísticas" ainda não existe), nos projetos mobile e tablet. Os demais devem passar, porque dependem das Tasks 1–3. **Se outro teste falhar, é um bug real das tasks anteriores**: investigue com superpowers:systematic-debugging antes de mexer no teste.

- [ ] **Step 4: Implementar os ajustes visuais**

`StatsRibbon.jsx`, com as classes exatas da spec (seção 4):
- `<section aria-label="Estatísticas" className="max-w-7xl mx-auto w-full py-space-lg sm:py-space-xl">`
- Grade: `grid grid-cols-2 lg:grid-cols-4 gap-space-sm sm:gap-space-md`
- Cartão: `p-space-sm sm:p-space-md gap-space-sm sm:gap-space-md`, mantendo as demais classes
- Caixa do ícone: `w-9 h-9 sm:w-12 sm:h-12`; ícone `text-[20px] sm:text-[26px]`
- Número: `font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md`

`WinnersCatalog.jsx`:
- `<h2>`: `font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-primary`
- As **duas** grades (skeleton e cards): `lg:grid-cols-3` → `xl:grid-cols-3`

- [ ] **Step 5: Rodar tudo e ver passar**

Run: `npm run test:e2e`
Expected: todos passam nos 3 projetos (os testes pulados aparecem como `skipped`).

Run: `npm test && npm run build`
Expected: `12 passed` e `✓ built in`.

- [ ] **Step 6: Conferência visual**

Com o Playwright MCP, abrir `http://localhost:5173` em 390×844, 768×1024 e 1280×800 e salvar os prints em `.playwright-mcp/` (`final-mobile.png`, `final-tablet.png`, `final-desktop.png`). Mostrar ao usuário: gaveta fechada, gaveta aberta no celular e desktop.

- [ ] **Step 7: Checkpoint final (sem commit)**

Mostrar `git status --short` e perguntar ao usuário se quer commitar.
