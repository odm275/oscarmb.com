import { test, expect } from "@playwright/test";

test.describe("AI Chat", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Oscar Mejia/);
  });

  test("should send a message and receive a response", async ({ page }) => {
    await page.goto("/");

    const chatTrigger = page.getByRole("button", {
      name: "Chat with Oscar AI",
    });
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click();

    const chatInput = page.getByPlaceholder(/Ask something/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const testQuestion = "What projects has Oscar worked on?";
    await chatInput.fill(testQuestion);
    await chatInput.press("Enter");

    await expect(page.locator("text=" + testQuestion)).toBeVisible({
      timeout: 5000,
    });

    await expect(
      page.locator("text=/Mise|project|built|developed/i").first(),
    ).toBeVisible({ timeout: 30000 });

    await expect(page.locator("text=Thinking...")).not.toBeVisible({
      timeout: 30000,
    });
  });

  test("should handle multiple messages in conversation", async ({ page }) => {
    await page.goto("/");

    const chatTrigger = page.getByRole("button", {
      name: "Chat with Oscar AI",
    });
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click();

    const chatInput = page.getByPlaceholder(/Ask something/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill("What is Oscar's experience?");
    await chatInput.press("Enter");

    await expect(
      page
        .locator("text=/experience|engineer|developer|senior|worked/i")
        .first(),
    ).toBeVisible({ timeout: 30000 });

    await chatInput.fill("What technologies does he know?");
    await chatInput.press("Enter");

    await expect(
      page.locator("text=/TypeScript|JavaScript|React|Next/i").first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test("should display prompt suggestions", async ({ page }) => {
    await page.goto("/");

    const chatTrigger = page.getByRole("button", {
      name: "Chat with Oscar AI",
    });
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click();

    const chatInput = page.getByPlaceholder(/Ask something/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const promptSuggestions = page
      .locator("button, div")
      .filter({ hasText: /project|experience|contact/i });

    await expect(promptSuggestions.first()).toBeVisible({ timeout: 5000 });
  });
});
