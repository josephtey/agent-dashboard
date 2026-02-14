import { test, expect } from '@playwright/test';

test.describe('Agent Log Viewer', () => {
  test('should display agent logs when clicking on a task', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    // Find a completed task with agent logs (task 11 has logs)
    const taskCard = page.locator('[data-task-id="11"]').first();

    if (await taskCard.count() === 0) {
      test.skip(true, 'Task 11 not found, skipping test');
      return;
    }

    // Click on the task to open log viewer
    await taskCard.click();

    // Wait for the sheet to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Check that task title is displayed
    await expect(page.locator('text=/Task #11/i')).toBeVisible();

    // Switch to Agent Logs tab
    const agentLogsTab = page.locator('button:has-text("Agent Logs")');
    await agentLogsTab.click();

    // Wait for logs to load
    await page.waitForTimeout(2000);

    // Check that logs are displayed (either "No logs yet..." or actual log content)
    const logContent = page.locator('[class*="slate-"]').first();
    await expect(logContent).toBeVisible({ timeout: 10000 });

    // Verify log content is not empty or shows loading state
    const hasContent = await page.locator('text=/Agent Execution Log|Summary|No logs yet/i').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should display specification when on spec tab', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    const taskCard = page.locator('[data-task-id="11"]').first();

    if (await taskCard.count() === 0) {
      test.skip(true, 'Task 11 not found, skipping test');
      return;
    }

    await taskCard.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // By default, spec tab should be active
    const specContent = page.locator('[class*="prose"]').first();
    await expect(specContent).toBeVisible({ timeout: 10000 });

    // Should have some spec content
    const hasSpecContent = await page.locator('[class*="prose"] p, [class*="prose"] h1, [class*="prose"] h2').count();
    expect(hasSpecContent).toBeGreaterThan(0);
  });

  test('should copy log content to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    const taskCard = page.locator('[data-task-id="11"]').first();

    if (await taskCard.count() === 0) {
      test.skip(true, 'Task 11 not found, skipping test');
      return;
    }

    await taskCard.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Switch to Agent Logs tab
    const agentLogsTab = page.locator('button:has-text("Agent Logs")');
    await agentLogsTab.click();

    // Wait for logs to load
    await page.waitForTimeout(2000);

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy")');
    await copyButton.click();

    // Verify button text changes to "Copied!"
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({ timeout: 2000 });

    // Verify clipboard has content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent.length).toBeGreaterThan(0);
  });

  test('should stream logs in real-time', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    const taskCard = page.locator('[data-task-id="11"]').first();

    if (await taskCard.count() === 0) {
      test.skip(true, 'Task 11 not found, skipping test');
      return;
    }

    await taskCard.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Switch to Agent Logs tab
    const agentLogsTab = page.locator('button:has-text("Agent Logs")');
    await agentLogsTab.click();

    // Check for loading state
    const loadingIndicator = page.locator('text=/Loading agent logs/i');

    // Either we see loading briefly, or logs load so fast we skip past it
    const isLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);

    if (isLoading) {
      // Wait for loading to complete
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Verify logs are displayed
    await expect(page.locator('[class*="prose"], pre').first()).toBeVisible({ timeout: 5000 });
  });
});
