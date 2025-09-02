import { test, expect } from '@playwright/test';

test.describe('JC Apps Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display login page with correct elements', async ({ page }) => {
    // Check for JC Apps logo/title
    await expect(page.locator('h1.logo-text')).toHaveText('JC Apps');
    
    // Check for username field
    const usernameField = page.locator('input[placeholder="Usuário"]');
    await expect(usernameField).toBeVisible();
    
    // Check for password field
    const passwordField = page.locator('input[placeholder="Senha"]');
    await expect(passwordField).toBeVisible();
    
    // Check for Connect button
    const connectButton = page.locator('button[type="submit"]');
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toContainText('Conectar');
    
    // Check for modern design elements
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('.geometric-pattern')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="Usuário"]', 'wronguser');
    await page.fill('input[placeholder="Senha"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toHaveText('Credenciais inválidas');
  });

  test('should login with valid credentials and show dashboard', async ({ page }) => {
    await page.fill('input[placeholder="Usuário"]', 'admin');
    await page.fill('input[placeholder="Senha"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('.welcome-text')).toHaveText('Bem-vindo');
    
    // Check for app tiles
    await expect(page.locator('.app-name')).toHaveText('Prospecção Ativa');
    
    // Check for logout button
    await expect(page.locator('.logout-button')).toBeVisible();
  });

  test('should logout and return to login page', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder="Usuário"]', 'admin');
    await page.fill('input[placeholder="Senha"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('.welcome-text')).toBeVisible();
    
    // Click logout
    await page.click('.logout-button');
    
    // Should be back at login page
    await expect(page.locator('h1.logo-text')).toHaveText('JC Apps');
  });

  test('should have proper black and gold theme', async ({ page }) => {
    // Check background colors
    const loginContainer = page.locator('.login-container');
    await expect(loginContainer).toHaveCSS('background', /rgb\(0, 0, 0\)/);
    
    // Check gold accents
    const logoIcon = page.locator('.logo-icon');
    await expect(logoIcon).toHaveCSS('color', /rgb\(212, 175, 55\)/);
  });
});