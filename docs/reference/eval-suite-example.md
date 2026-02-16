# Eval Suite Example

## Purpose

Every repository should have a cumulative eval suite that:
1. Runs before every PR
2. Grows with each feature
3. Catches regressions
4. Stays fast (< 2 minutes to run)

## Location

**Frontend:**
- `tests/eval.spec.ts` (Playwright)

**Backend:**
- `tests/test_eval.py` (pytest)
- `tests/eval.test.js` (Jest)

## Example: Frontend Eval Suite

**File:** `tests/eval.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// ============================================
// TIER 1: SMOKE TEST (Always run first)
// ============================================

test('smoke test: app loads without errors', async ({ page }) => {
  const errors: string[] = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Load app
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Take screenshot for visual verification
  await page.screenshot({
    path: 'test-results/smoke-test.png',
    fullPage: true
  });

  // Verify basic structure exists
  const hasHeader = await page.locator('h1').count() > 0;
  expect(hasHeader).toBeTruthy();

  // No console errors
  expect(errors.length).toBe(0);
});

// ============================================
// TIER 2: FEATURE TESTS (Add one per task)
// ============================================

// Task 1: Search functionality
test('search button renders and responds to click', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const searchButton = page.locator('button:has-text("Search")');
  await expect(searchButton).toBeVisible();

  await searchButton.click();

  // Verify something happens (loading state, results, etc.)
  const searchActive = page.locator('[data-search-active="true"]');
  await expect(searchActive).toBeVisible({ timeout: 5000 });
});

// Task 2: Message sending
test('can send message and receive response', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const input = page.locator('input[type="text"]');
  await input.fill('Hello');

  const sendButton = page.locator('button:has-text("Send")');
  await sendButton.click();

  // Wait for response
  const messages = page.locator('[data-role="assistant"]');
  await expect(messages.first()).toBeVisible({ timeout: 10000 });
});

// Task 3: Dark mode toggle
test('dark mode toggle switches theme', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const toggle = page.locator('[data-theme-toggle]');
  await toggle.click();

  // Verify theme changed (check for dark class or data attribute)
  const isDark = await page.locator('html').getAttribute('class');
  expect(isDark).toContain('dark');
});

// ============================================
// Add more feature tests as tasks complete
// ============================================
```

## Example: Backend Eval Suite

**File:** `tests/test_eval.py`

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ============================================
# TIER 1: SMOKE TEST
# ============================================

def test_smoke_app_starts():
    """Verify app starts and health check works"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# ============================================
# TIER 2: FEATURE TESTS
# ============================================

# Task 1: Chat endpoint
def test_chat_endpoint_responds():
    """Verify chat endpoint accepts messages and returns response"""
    response = client.post("/chat", json={
        "message": "Hello"
    })
    assert response.status_code == 200
    assert "response" in response.json()

# Task 2: Tool execution
def test_tool_execution_works():
    """Verify tools can be called and return results"""
    response = client.post("/chat", json={
        "message": "Search for Python",
        "enable_tools": True
    })
    assert response.status_code == 200
    data = response.json()
    assert "tool_calls" in data
    assert len(data["tool_calls"]) > 0

# Task 3: Parallel tool calling
def test_parallel_tools():
    """Verify multiple tools execute in parallel"""
    import time
    start = time.time()

    response = client.post("/chat", json={
        "message": "Search for both Python and JavaScript"
    })

    duration = time.time() - start

    # Should be < 5 seconds (parallel) not > 8 seconds (sequential)
    assert duration < 5
    assert response.status_code == 200
```

## Growth Pattern

**Week 1:**
```
tests/eval.spec.ts
├── smoke test (1 test)
└── feature test: search (1 test)
Total: 2 tests, ~30 seconds
```

**Week 2:**
```
tests/eval.spec.ts
├── smoke test (1 test)
├── feature test: search (1 test)
└── feature test: messaging (1 test)
Total: 3 tests, ~45 seconds
```

**Week 4:**
```
tests/eval.spec.ts
├── smoke test (1 test)
├── feature test: search (1 test)
├── feature test: messaging (1 test)
├── feature test: dark mode (1 test)
├── feature test: file upload (1 test)
└── feature test: settings (1 test)
Total: 6 tests, ~90 seconds
```

## Best Practices

1. **Keep tests fast** - Each feature test < 15 seconds
2. **One test per feature** - Don't test every edge case
3. **Clear test names** - Should read like documentation
4. **Screenshot on smoke test** - Visual verification
5. **Fail fast** - Smoke test first, stop if it fails
6. **Accumulate, don't replace** - Never delete old tests
7. **Run locally** - Should work without special setup

## PR Report Template

Include in PR description:

```markdown
## Automated Tests

Ran cumulative eval suite: `tests/eval.spec.ts`

✅ **6/6 tests passing** (~90 seconds)

- ✅ Smoke test: App loads
- ✅ Search functionality
- ✅ Message sending
- ✅ Dark mode toggle
- ✅ File upload
- ✅ Settings page (new)

**New test added:** Settings page navigation and form submission

🖼️ Screenshot: [smoke-test.png]
```

## When Tests Fail

```markdown
## Automated Tests

Ran cumulative eval suite: `tests/eval.spec.ts`

⚠️ **5/6 tests passing** (~85 seconds)

- ✅ Smoke test: App loads
- ✅ Search functionality
- ✅ Message sending
- ✅ Dark mode toggle
- ❌ File upload (regression detected)
- ✅ Settings page (new)

**Issue:** File upload broke due to API change. Will fix in refinement.

**New test added:** Settings page navigation
```

## Philosophy

- **Pragmatic > Perfect** - Smoke alarm, not comprehensive QA
- **Cumulative > Comprehensive** - Build up over time
- **Fast > Thorough** - Catch obvious issues quickly
- **Automated > Manual** - Run every time, no exceptions
