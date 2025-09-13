import { test, expect } from '@playwright/test'

const POMODORO_TIMER_SETTINGS_LABEL = 'label:has-text("Pomodoro Timer") input[type="checkbox"]';

test.describe('Pomodoro Timer', () => {
  test('Session start and timer display', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+,');
    await page.locator(POMODORO_TIMER_SETTINGS_LABEL).check();
    await page.click('.modal-close');
    // Start session
    await page.locator('#cursor').fill('Hello world');
    await expect(page.locator('#pomodoro-timer')).toBeVisible();
    await expect(page.locator('#pomodoro-timer')).toContainText('⏱️ 24:');
  });

  test('Session expiry and input blocking', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.keyboard.press('Control+,');
    await page.locator(POMODORO_TIMER_SETTINGS_LABEL).check();
    await page.click('.modal-close');
    await page.locator('#cursor').fill('Hello world\n');
    await page.clock.fastForward('24:54');
    await expect(page.locator('#pomodoro-timer')).toBeVisible();
    await expect(page.locator('#pomodoro-timer')).toContainText(' 0:05');
    await page.locator('#cursor').pressSequentially('Hello world');
    await expect(page.locator('#pomodoro-timer')).toContainText(' 0:01');
    await page.clock.fastForward('2');
    await expect(page.locator('#pomodoro-timer')).toContainText('Session Complete');
    // Try to type
    await page.locator('#cursor').pressSequentially('Should not be allowed');
    // Input should be blocked (text not updated)
    await expect(page.locator('#text')).not.toContainText('Should not be allowed');
  });

  test('Session reset', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.keyboard.press('Control+,');
    await page.locator(POMODORO_TIMER_SETTINGS_LABEL).check();
    // TODO: There is a known bug with this dropdown
    // await page.locator('select').selectOption({ label: '15 minutes' });
    await page.click('.modal-close');
    // Start session
    await page.locator('#cursor').pressSequentially('Hello world');
    await page.clock.fastForward('25:01');
    await expect(page.locator('#pomodoro-timer')).toContainText('Session Complete');
    // Reset document
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure you want to clear the text?');
      await dialog.accept();
    });
    await page.click('#clear');
    await page.locator('#cursor').pressSequentially('New session');
    await expect(page.locator('#pomodoro-timer')).toContainText('⏱️ 24:');
    await expect(page.locator('#text')).toContainText('New session');
  });
});
