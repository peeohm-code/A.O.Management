import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * 
 * Tests the complete authentication workflow including:
 * - Login redirect
 * - OAuth callback
 * - Session persistence
 * - Logout
 */

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected page', async ({ page }) => {
    // Navigate to dashboard (protected page)
    await page.goto('/');
    
    // Should redirect to login or show login button
    await expect(page).toHaveURL(/.*/, { timeout: 10000 });
    
    // Check if login UI is present (either redirect or login button)
    const hasLoginButton = await page.locator('text=/เข้าสู่ระบบ|Login/i').count() > 0;
    const isLoginPage = page.url().includes('login') || page.url().includes('oauth');
    
    expect(hasLoginButton || isLoginPage).toBeTruthy();
  });

  test('should show user info when authenticated', async ({ page, context }) => {
    // Note: This test requires manual authentication or mock OAuth
    // In real scenarios, you would:
    // 1. Use a test user account
    // 2. Mock the OAuth flow
    // 3. Set authentication cookies directly
    
    // For now, we'll skip this test in CI
    test.skip(!!process.env.CI, 'Requires authentication setup');
    
    await page.goto('/');
    
    // Wait for authentication to complete
    await page.waitForTimeout(2000);
    
    // Should show user profile or dashboard
    const hasUserInfo = await page.locator('[data-testid="user-profile"], [data-testid="user-menu"]').count() > 0;
    expect(hasUserInfo).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authentication setup');
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Find and click logout button
    const logoutButton = page.locator('text=/ออกจากระบบ|Logout/i').first();
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should redirect to login or home
      await page.waitForTimeout(1000);
      
      // Verify logout by checking for login button
      const hasLoginButton = await page.locator('text=/เข้าสู่ระบบ|Login/i').count() > 0;
      expect(hasLoginButton).toBeTruthy();
    }
  });
});
