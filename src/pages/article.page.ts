import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
  readonly heading: Locator;
  readonly commentBox: Locator;
  readonly comments: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.commentBox = page.getByPlaceholder('Write a comment...');
    this.comments = page.locator('app-article-comment .card-text');
    this.editButton = page.getByRole('link', { name: 'Edit Article' }).first();
    this.deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
  }

  async open(slug: string) {
    const loaded = this.page.waitForResponse((res) => res.url().endsWith(`/api/articles/${slug}`) && res.ok());
    await this.page.goto(`/article/${slug}`);
    await loaded;
  }

  async postComment(body: string) {
    const saved = this.page.waitForResponse(
      (res) => res.url().includes('/comments') && res.request().method() === 'POST',
    );
    await this.commentBox.fill(body);
    await this.page.getByRole('button', { name: 'Post Comment' }).click();
    return saved;
  }
}
