import { test, expect } from "@playwright/test";

const menu = (page) => page.getByRole("button", { name: /categorias/i });
const nav = (page) => page.getByRole("navigation", { name: "Categorias" });

async function noHorizontalScroll(page) {
  const ok = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(ok).toBe(true);
}

// Abre a página e espera os dados carregarem (botões de categoria no DOM).
// Seletor CSS de propósito: com a gaveta fechada (visibility: hidden) ela sai
// da árvore de acessibilidade e getByRole não a encontra.
async function abrir(page) {
  await page.goto("/");
  await expect(page.locator("#category-drawer nav button").first()).toBeAttached();
}

test.describe("celular e tablet", () => {
  test.skip(({ viewport }) => viewport.width >= 1024);

  test.beforeEach(async ({ page }) => abrir(page));

  test("gaveta começa fechada", async ({ page }) => {
    await expect(menu(page)).toBeVisible();
    await expect(menu(page)).toHaveAccessibleName("Abrir categorias");
    await expect(nav(page)).toBeHidden();
  });

  test("sem rolagem horizontal e conteúdo na borda", async ({ page }) => {
    await noHorizontalScroll(page);
    const box = await page.locator("main").boundingBox();
    expect(box.x).toBeLessThan(1);
  });

  test("abrir, escolher e fechar", async ({ page }) => {
    await menu(page).click();
    await expect(nav(page)).toBeVisible();
    await nav(page).getByRole("button", { name: /^Best Picture/ }).click();
    await expect(nav(page)).toBeHidden();
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Best Picture");
  });

  test("estatísticas em 2 colunas", async ({ page }) => {
    const cards = page
      .getByRole("region", { name: "Estatísticas" })
      .locator(":scope > div > div");
    const a = await cards.nth(0).boundingBox();
    const b = await cards.nth(1).boundingBox();
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    expect(a.x).not.toBe(b.x);
  });

  test("Tab não entra na gaveta fechada", async ({ page }) => {
    const botao = page.locator("#category-drawer nav button").first();
    const focado = () =>
      botao.evaluate((el) => document.activeElement === el);

    // Fechada (visibility: hidden): o botão não pode receber foco.
    await botao.evaluate((el) => el.focus());
    expect(await focado()).toBe(false);
    expect(
      await page.evaluate(
        () => document.activeElement.closest("#category-drawer") !== null,
      ),
    ).toBe(false);

    // Controle positivo: com a gaveta aberta, o mesmo botão recebe foco.
    await menu(page).click();
    await expect(nav(page)).toBeVisible();
    await botao.evaluate((el) => el.focus());
    expect(await focado()).toBe(true);
  });

  test("nome longo não estoura", async ({ page }) => {
    await menu(page).click();
    await nav(page)
      .getByRole("button", { name: /^Art Direction \(Black-And-White\)/ })
      .click();
    await noHorizontalScroll(page);
  });

  test("320px: gaveta cabe e sem rolagem", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    await page.setViewportSize({ width: 320, height: 640 });
    await menu(page).click();
    await expect(nav(page)).toBeVisible();
    const box = await page.locator("#category-drawer").boundingBox();
    expect(box.width).toBeLessThanOrEqual(272);
    await noHorizontalScroll(page);
  });

  test("ir para o desktop com a gaveta aberta", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    await menu(page).click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId("drawer-backdrop")).toBeHidden();
    await expect(nav(page)).toBeVisible();
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => viewport.width < 1024);

  test.beforeEach(async ({ page }) => abrir(page));

  test("barra lateral fixa, sem ☰", async ({ page }) => {
    await expect(menu(page)).toBeHidden();
    await expect(nav(page)).toBeVisible();
    const box = await page.locator("main").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(288);
  });

  test("1024px já é desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(menu(page)).toBeHidden();
    await expect(nav(page)).toBeVisible();
  });
});
