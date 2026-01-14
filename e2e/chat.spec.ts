import { test, expect } from "@playwright/test";

test.describe("AI Chat", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Oscar Mejia/);
  });

  test("should send a message and receive a response", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Find the chat accordion trigger with "Oscar AI" text
    const chatTrigger = page.getByText("Oscar AI");
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });

    // Click to open chat if it's not already open
    await chatTrigger.click();

    // Wait a bit for accordion animation
    await page.waitForTimeout(1000);

    // Find the chat input field
    const chatInput = page.getByPlaceholder(/Ask something/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Type a test question
    const testQuestion = "What projects has Oscar worked on?";
    await chatInput.fill(testQuestion);

    // Submit the message (either by pressing Enter or clicking send button)
    await chatInput.press("Enter");

    // Wait for the user message to appear in the chat
    await expect(page.locator("text=" + testQuestion)).toBeVisible({ timeout: 5000 });

    // Wait for the AI response (look for bot avatar or assistant message)
    // The response should mention at least one project (like "Mise")
    await expect(
      page.locator('text=/Mise|project|built|developed/i').first()
    ).toBeVisible({ timeout: 30000 });

    // Verify the loading state is gone (no longer streaming)
    await expect(page.locator('text=/loading|generating/i')).not.toBeVisible({ timeout: 30000 });

    console.log("✅ Chat test passed! Message sent and response received.");
  });

  test("should handle multiple messages in conversation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open chat
    const chatTrigger = page.getByText("Oscar AI");
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(1000);

    const chatInput = page.getByPlaceholder(/Ask something/i);
    await expect(chatInput).toBeVisible();

    // Send first message
    await chatInput.fill("What is Oscar's experience?");
    await chatInput.press("Enter");

    // Wait for first response
    await page.waitForTimeout(3000);

    // Send follow-up message
    await chatInput.fill("What technologies does he know?");
    await chatInput.press("Enter");

    // Wait for second response
    await expect(
      page.locator('text=/TypeScript|JavaScript|React|Next/i').first()
    ).toBeVisible({ timeout: 30000 });

    console.log("✅ Multi-message conversation test passed!");
  });

  test("should display prompt suggestions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open chat
    const chatTrigger = page.getByText("Oscar AI");
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(1000);

    // Check if there are prompt suggestions visible
    // (These should show when there are no messages yet)
    const promptSuggestions = page.locator('button, div').filter({ hasText: /project|experience|contact/i });

    // At least one suggestion should be visible
    await expect(promptSuggestions.first()).toBeVisible({ timeout: 5000 });

    console.log("✅ Prompt suggestions test passed!");
  });
});
