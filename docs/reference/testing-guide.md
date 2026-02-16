# Testing and Verification Guide

## Philosophy: Pragmatic Testing

**Tests are a smoke alarm, not a comprehensive safety inspection.**

Goals:
- ✅ Catch obvious breakage before PR
- ✅ Build cumulative test suite over time
- ✅ Fast to write, fast to run
- ❌ NOT aiming for 100% coverage
- ❌ NOT testing every edge case

## Repository Eval Suite Pattern

**Every repo should have a growing eval suite that runs before every PR.**

### Location
- `tests/eval.spec.ts` (Playwright for frontend)
- `tests/test_eval.py` (pytest for backend)
- Or repo-specific test framework

### Lifecycle
1. **First task in repo:** Create eval suite with smoke test + feature test
2. **Every subsequent task:** Run existing suite + add new test for current feature
3. **Before PR:** Always run full suite, report results

### Benefits
- Suite grows with each task (compounds over time)
- Regressions caught early
- New features verified against existing functionality
- Clear history of what works

## When to Use Testing

**ALWAYS test before creating PR:**
- Run repository eval suite (if exists)
- Add test for current feature to suite
- Create eval suite if first task in repo

## Tiered Testing Approach

### Tier 1: Smoke Test (ALWAYS)
**Time: 2-3 minutes**

Basic sanity check that app works:
```javascript
// Start app, load page, check for errors
await page.goto('http://localhost:3000');
await page.waitForLoadState('networkidle');

// Capture console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// Screenshot for visual verification
await page.screenshot({ path: 'screenshots/smoke-test.png' });

// Basic assertion
const hasMainUI = await page.locator('h1').count() > 0;
console.log(hasMainUI ? '✅ Smoke test passed' : '❌ App broken');
```

**Catches:** Build failures, import errors, basic rendering issues

### Tier 2: Feature Test (for non-trivial features)
**Time: 5-10 minutes**

Test the specific feature implemented:
```javascript
// Example: Testing search functionality
await page.goto('http://localhost:3000');

// Verify feature exists
const searchButton = page.locator('button:has-text("Search")');
await expect(searchButton).toBeVisible();

// Test interaction
await searchButton.click();
await page.waitForTimeout(1000);

// Verify expected behavior
const results = page.locator('[data-testid="results"]');
console.log(await results.count() > 0 ? '✅ Feature works' : '⚠️ Feature issue');
```

**Catches:** Feature missing, basic functionality broken

### Tier 3: Integration Test (complex features only)
**Time: 15-20 minutes**

Only for multi-system features. Skip for most tasks.

### Decision Matrix

| Feature Type | Test Level | Example |
|--------------|------------|---------|
| Simple UI change | Smoke only | "Change button color" |
| New component | Smoke + Feature | "Add loading spinner" |
| User interaction | Smoke + Feature | "Add search" |
| Multi-step flow | Smoke + Feature + Integration | "Authentication flow" |
| Backend change | Run existing suite | "Update API" |
| Bug fix | Smoke + Reproduce | "Fix crash on click" |

## Playwright Testing Workflow

### 1. Write a Test Script
Create a focused test that:
- Navigates to the application
- Interacts with the UI (click, type, etc.)
- Captures console logs and network requests
- Takes screenshots for debugging
- Verifies expected behavior

**Example test structure:**
```javascript
const { chromium } = require('playwright');

async function testFeature() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture logs and errors
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  // Test the feature
  await page.goto('http://localhost:3000');
  await page.locator('input').fill('test message');
  await page.locator('button').click();

  // Wait and verify
  await page.waitForTimeout(5000);
  const hasResult = await page.locator('text=/expected/i').count() > 0;

  // Screenshot
  await page.screenshot({ path: '/tmp/test-result.png' });

  await browser.close();
  return hasResult;
}
```

### 2. Run Tests for Bug Reports
When a user reports something "not working":
- Ask them to describe the issue
- Write a Playwright test that reproduces the problem
- Run the test to confirm the bug
- Use test output to diagnose the root cause
- Fix the issue
- Re-run the test to verify the fix

### 3. Verify Before Approval
Before approving a task (moving from staging to completed):
- Write tests for core functionality
- Verify all features work as expected
- Check for console errors or warnings
- Ensure UI displays correctly
- Test edge cases

## Test Output Analysis

Playwright tests provide critical debugging information:
- **Console logs** - Shows JS errors, API calls, state updates
- **Network logs** - Reveals failed requests, response data
- **Screenshots** - Visual verification of UI state
- **DOM queries** - Confirms elements are rendered

Use this information to:
1. **Identify root cause** - Console errors, failed network requests
2. **Verify fixes** - Elements that were missing now appear
3. **Document issues** - Screenshot evidence for refinements

## Installing Playwright

When first using Playwright in a session:
```bash
cd /tmp
npm init -y
npm install playwright
npx playwright install chromium
```

Then run tests:
```bash
node test-script.js
```

## Best Practices for Testing

1. **Test early** - Don't wait for user complaints, test proactively
2. **Test thoroughly** - Cover happy path and edge cases
3. **Capture everything** - Console logs, network, screenshots
4. **Non-headless first** - Use `headless: false` to watch behavior
5. **Generous timeouts** - Wait long enough for async operations
6. **Close the loop** - Always verify fixes with a re-test

## Example: Bug Fix Workflow

```
1. User reports: "Messages not appearing"
2. Write Playwright test that sends a message
3. Run test → Confirms bug (no messages visible)
4. Analyze test output:
   - Console: "✅ Event parsed"
   - Network: "200 OK"
   - DOM: Text found but not visible
   - Diagnosis: CSS/rendering issue
5. Spawn refinement agent with detailed findings
6. Agent fixes the issue
7. Re-run Playwright test → Confirms fix works
8. Approve and merge with confidence
```

## Integration with Refinement Workflow

When refining tasks:
1. **Before refinement**: Run Playwright test to reproduce the issue
2. **Document findings**: Include test output in refinement prompt
3. **After refinement**: Re-run test to verify the fix
4. **Approve only if**: Tests pass and functionality is confirmed

This closes the loop and ensures high-quality implementations.
