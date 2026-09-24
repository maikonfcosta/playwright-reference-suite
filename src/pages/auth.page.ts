import type { Locator, Page } from '@playwright/test';

export class AuthPage {
  readonly username: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly errors: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.email = page.getByPlaceholder('Email');
    this.password = page.getByPlaceholder('Password');
    this.errors = page.locator('.error-messages');
  }

  async signUp(user: { username: string; email: string; password: string }) {
    await this.page.goto('/register');
    await this.username.fill(user.username);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
  }

  async signIn(email: string, password: string) {
    await this.page.goto('/login');
    await this.email.fill(email);
    await this.password.fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
