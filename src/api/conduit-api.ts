import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { NewArticle, NewUser } from '../data/factory';

export type User = { email: string; username: string; token: string; bio: string | null; image: string | null };
export type Article = { slug: string; title: string; description: string; body: string; tagList: string[] };
export type Comment = { id: number; body: string };

/**
 * Thin wrapper over the Conduit REST API, used to create test data and to test the API itself.
 * Methods return the raw response when the caller needs to check status codes.
 */
export class ConduitApi {
  constructor(
    readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  as(token: string): ConduitApi {
    return new ConduitApi(this.request, token);
  }

  private headers(): Record<string, string> {
    return this.token ? { Authorization: `Token ${this.token}` } : {};
  }

  register(user: NewUser): Promise<APIResponse> {
    return this.request.post('/api/users', { data: { user } });
  }

  async registerOk(user: NewUser): Promise<User> {
    const res = await this.register(user);
    if (!res.ok()) throw new Error(`register failed: ${res.status()} ${await res.text()}`);
    return (await res.json()).user;
  }

  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/users/login', { data: { user: { email, password } } });
  }

  createArticle(article: NewArticle): Promise<APIResponse> {
    return this.request.post('/api/articles', { data: { article }, headers: this.headers() });
  }

  async createArticleOk(article: NewArticle): Promise<Article> {
    const res = await this.createArticle(article);
    if (!res.ok()) throw new Error(`create article failed: ${res.status()} ${await res.text()}`);
    return (await res.json()).article;
  }

  getArticle(slug: string): Promise<APIResponse> {
    return this.request.get(`/api/articles/${slug}`, { headers: this.headers() });
  }

  updateArticle(slug: string, changes: Partial<NewArticle>): Promise<APIResponse> {
    return this.request.put(`/api/articles/${slug}`, { data: { article: changes }, headers: this.headers() });
  }

  deleteArticle(slug: string): Promise<APIResponse> {
    return this.request.delete(`/api/articles/${slug}`, { headers: this.headers() });
  }

  addComment(slug: string, body: string): Promise<APIResponse> {
    return this.request.post(`/api/articles/${slug}/comments`, { data: { comment: { body } }, headers: this.headers() });
  }

  deleteComment(slug: string, id: number): Promise<APIResponse> {
    return this.request.delete(`/api/articles/${slug}/comments/${id}`, { headers: this.headers() });
  }

  favorite(slug: string): Promise<APIResponse> {
    return this.request.post(`/api/articles/${slug}/favorite`, { headers: this.headers() });
  }

  follow(username: string): Promise<APIResponse> {
    return this.request.post(`/api/profiles/${username}/follow`, { headers: this.headers() });
  }

  currentUser(): Promise<APIResponse> {
    return this.request.get('/api/user', { headers: this.headers() });
  }
}
