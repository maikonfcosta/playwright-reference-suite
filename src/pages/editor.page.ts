import type { Locator, Page } from '@playwright/test';
import type { NewArticle } from '../data/factory';

export class EditorPage {
  readonly title: Locator;
  readonly description: Locator;
  readonly body: Locator;
  readonly tags: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByPlaceholder('Article Title');
    this.description = page.getByPlaceholder("What's this article about?");
    this.body = page.getByPlaceholder('Write your article (in markdown)');
    this.tags = page.getByPlaceholder('Enter tags');
  }

  async open(slug?: string) {
    await this.page.goto(slug ? `/editor/${slug}` : '/editor');
  }

  async fillForm(article: Partial<NewArticle>) {
    if (article.title !== undefined) await this.title.fill(article.title);
    if (article.description !== undefined) await this.description.fill(article.description);
    if (article.body !== undefined) await this.body.fill(article.body);
    for (const tag of article.tagList ?? []) {
      await this.tags.fill(tag);
      await this.tags.press('Enter');
    }
  }

  /** Clicks publish and resolves with the article the API saved. */
  async publish() {
    const saved = this.page.waitForResponse(
      (res) =>
        /\/api\/articles(\/[^/]+)?$/.test(new URL(res.url()).pathname) &&
        ['POST', 'PUT'].includes(res.request().method()),
    );
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
    return saved;
  }
}
