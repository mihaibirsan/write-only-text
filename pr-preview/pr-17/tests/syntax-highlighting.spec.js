import { test, expect } from '@playwright/test'

const TEST_MARKDOWN_CONTENT = `Let's see if **this** is going to get the _highlighting_ that we expect.

# So far so good. Except this red color.

Lists:
- Are
+ Designed
* With
1. Colors

> Blockquotes are also red. Why?

| Tables | Will | Be |
|--------|------|----|
| Not    | Used | Often |

__this__ is *highlighted*

[This is a link](http://mihaibirsan.github.io/)

[[Wikilinks]]

[Other][links]

%% Comment %%

<!-- Comment -->

<tag>foo</tag>

\`\`\`js
let x = 2;
x += 1;
console.log(x);
\`\`\`

---


<img src="foo" />
<care>
<WORKS ..>

\`this is also code\``;

test.describe('Syntax Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('#cursor');
    
    // Click the Clear button to start with a fresh document
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(200);

    // Enable syntax highlighting plugin by opening settings
    await page.keyboard.press('Control+,');
    await page.waitForSelector('#plugin-settings');
    
    // Enable syntax highlighting if it's not already enabled
    const syntaxCheckbox = page.locator('label:has-text("Syntax Highlighting") input[type="checkbox"]');
    const isChecked = await syntaxCheckbox.isChecked();
    if (!isChecked) {
      await syntaxCheckbox.click();
    }
    
    // Close settings modal by clicking the close button
    await page.click('.modal-close');
    await page.waitForSelector('#plugin-settings', { state: 'hidden' });
  });

  // After each failure, output the contents of #text
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      const textContent = await page.locator('#text').innerText();
      console.log('Current #text content:', textContent);
    }
  });

  test('should render markdown with proper syntax highlighting', async ({ page }) => {
    // Type the test content
    await page.locator('#cursor').focus();
    await page.locator('#cursor').pressSequentially(TEST_MARKDOWN_CONTENT);
    
    // Wait for highlighting to be applied
    await page.waitForTimeout(500);
    
    // Take a screenshot for visual comparison
    // Hide dynamic elements that would cause flaky tests
    await page.addStyleTag({
      content: `
        #time { display: none !important; }
        #pomodoro-timer { display: none !important; }
        .cursor { display: none !important; }
      `
    });
    
    // Wait a bit more for styles to apply
    await page.waitForTimeout(100);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('syntax-highlighting.png', {
      fullPage: true,
      animations: 'disabled',
      scale: 'device',
    });
  });

  test('should highlight different markdown elements correctly', async ({ page }) => {
    // Focus on the text input
    await page.locator('#cursor').focus();
    
    // Type and verify headers
    await page.locator('#cursor').pressSequentially('# Header 1\n## Header 2\n### Header 3');
    await page.waitForTimeout(200);
    
    // Check that headers are highlighted with hljs classes
    const textRenderer = page.locator('#text');
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(3);
    
    // Clear and test bold/italic
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(200);
    await page.locator('#cursor').pressSequentially('**bold text** and *italic text*');
    await page.waitForTimeout(200);
    
    // Check bold and italic highlighting
    await expect(textRenderer.locator('.hljs-strong')).toHaveCount(1);
    await expect(textRenderer.locator('.hljs-emphasis')).toHaveCount(1);
    
    // Clear and test code blocks
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(200);
    await page.locator('#cursor').pressSequentially('```javascript\nconst x = 42;\n```');
    await page.waitForTimeout(200);
    
    // Check code block highlighting
    await expect(textRenderer.locator('.hljs-code')).toHaveCount(1);
  });

  test('should maintain highlighting when content changes', async ({ page }) => {
    // Focus and type initial content
    await page.locator('#cursor').focus();
    await page.locator('#cursor').pressSequentially('# Initial Header\n\nSome **bold** text.');
    await page.waitForTimeout(200);
    
    // Verify initial highlighting
    const textRenderer = page.locator('#text');
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(1);
    await expect(textRenderer.locator('.hljs-strong')).toHaveCount(1);
    
    // Add more content (app only allows appending)
    await page.locator('#cursor').pressSequentially('\n\n## Second Header\n\nMore *italic* content.');
    await page.waitForTimeout(200);
    
    // Verify highlighting is maintained and updated
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(2);
    await expect(textRenderer.locator('.hljs-strong')).toHaveCount(1);
    await expect(textRenderer.locator('.hljs-emphasis')).toHaveCount(1);
  });

  test('should handle syntax highlighting toggle', async ({ page }) => {
    // Type some content first
    await page.locator('#cursor').focus();
    await page.locator('#cursor').pressSequentially('# Test Header\n\n**Bold text**');
    await page.waitForTimeout(200);
    
    // Verify highlighting is applied
    const textRenderer = page.locator('#text');
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(1);
    
    // Open settings and disable syntax highlighting
    await page.keyboard.press('Control+,');
    await page.waitForSelector('#plugin-settings');
    
    const syntaxCheckbox = page.locator('label:has-text("Syntax Highlighting") input[type="checkbox"]');
    await syntaxCheckbox.uncheck();
    
    // Close settings modal by clicking the close button
    await page.click('.modal-close');
    await page.waitForSelector('#plugin-settings', { state: 'hidden' });
    await page.waitForTimeout(200);
    
    // Verify highlighting classes are removed
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(0);
    
    // Re-enable highlighting
    await page.keyboard.press('Control+,');
    await page.waitForSelector('#plugin-settings');
    await syntaxCheckbox.check();
    await page.click('.modal-close');
    await page.waitForSelector('#plugin-settings', { state: 'hidden' });
    await page.waitForTimeout(200);
    
    // Verify highlighting is restored
    await expect(textRenderer.locator('.hljs-section')).toHaveCount(1);
  });
});
