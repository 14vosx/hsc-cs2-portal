import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { NewsArticle, NewsIndex } from '../domain/news.model';
import { NewsApiService, NewsContractError } from './news-api.service';

describe('NewsApiService', () => {
  let service: NewsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(NewsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('o serviço pode ser injetado', () => {
    expect(service).toBeTruthy();
  });

  describe('getNewsIndex()', () => {
    it('realiza exatamente uma requisição GET para cs2ApiPaths.newsIndex e não faz requisições extras', () => {
      service.getNewsIndex().subscribe();

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      expect(req.request.method).toBe('GET');
      req.flush({ ok: true, count: 0, items: [] });
    });

    it('retorna NewsIndex canônico para payload válido', () => {
      let result: NewsIndex | undefined;
      service.getNewsIndex().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush({
        ok: true,
        count: 1,
        items: [
          {
            slug: 'news-1',
            title: 'Title 1',
            excerpt: 'Excerpt 1',
            image_url: 'https://example.com/1.jpg',
            published_at: '2026-08-04T12:00:00Z',
          },
        ],
      });

      expect(result).toEqual({
        count: 1,
        items: [
          {
            slug: 'news-1',
            title: 'Title 1',
            excerpt: 'Excerpt 1',
            imageUrl: 'https://example.com/1.jpg',
            publishedAt: '2026-08-04T12:00:00Z',
          },
        ],
      });
    });

    it('preserva a ordem publicada dos itens', () => {
      let result: NewsIndex | undefined;
      service.getNewsIndex().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush({
        ok: true,
        count: 2,
        items: [
          { slug: 'second-published-first-in-list', title: 'A', excerpt: null, image_url: null, published_at: '2026-01-01' },
          { slug: 'first-published-second-in-list', title: 'B', excerpt: null, image_url: null, published_at: '2026-08-01' },
        ],
      });

      expect(result?.items.map((i) => i.slug)).toEqual([
        'second-published-first-in-list',
        'first-published-second-in-list',
      ]);
    });

    it('preserva o count remoto mesmo quando difere de items.length', () => {
      let result: NewsIndex | undefined;
      service.getNewsIndex().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush({
        ok: true,
        count: 42,
        items: [
          { slug: 'item-1', title: 'Title 1', excerpt: null, image_url: null, published_at: null },
        ],
      });

      expect(result?.count).toBe(42);
      expect(result?.items).toHaveLength(1);
    });

    it('payload inválido produz NewsContractError', () => {
      let errorReceived: unknown;
      service.getNewsIndex().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush({ ok: false, items: 'invalid' });

      expect(errorReceived).toBeInstanceOf(NewsContractError);
      expect((errorReceived as NewsContractError).message).toBe('Invalid NewsIndex payload received');
    });

    it('HTTP 500 propaga HttpErrorResponse intacto', () => {
      let errorReceived: unknown;
      service.getNewsIndex().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });

    it('HTTP 503 propaga HttpErrorResponse intacto', () => {
      let errorReceived: unknown;
      service.getNewsIndex().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsIndex);
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(503);
    });
  });

  describe('getNewsArticle()', () => {
    it('realiza exatamente uma requisição GET para cs2ApiPaths.newsItem(slug) codificando o slug', () => {
      const slugWithSpecialChars = 'complex/slug & name';
      service.getNewsArticle(slugWithSpecialChars).subscribe();

      const expectedUrl = cs2ApiPaths.newsItem(slugWithSpecialChars);
      expect(expectedUrl).toBe('/content/news/complex%2Fslug%20%26%20name/');

      const req = httpTesting.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        ok: true,
        item: {
          slug: slugWithSpecialChars,
          title: 'Title',
          excerpt: null,
          content: 'Body',
          image_url: null,
          published_at: null,
        },
      });
    });

    it('retorna NewsArticle canônico para payload válido', () => {
      let result: NewsArticle | undefined;
      service.getNewsArticle('my-news').subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.newsItem('my-news'));
      req.flush({
        ok: true,
        item: {
          slug: 'my-news',
          title: 'My News Title',
          excerpt: 'Excerpt text',
          content: '<p>Paragraph 1</p><p>Paragraph 2</p>',
          image_url: 'https://example.com/banner.png',
          published_at: '2026-08-04T12:00:00Z',
        },
      });

      expect(result).toEqual({
        slug: 'my-news',
        title: 'My News Title',
        excerpt: 'Excerpt text',
        contentHtml: '<p>Paragraph 1</p><p>Paragraph 2</p>',
        imageUrl: 'https://example.com/banner.png',
        publishedAt: '2026-08-04T12:00:00Z',
      });
    });

    it('preserva contentHtml exatamente como recebido', () => {
      let result: NewsArticle | undefined;
      const htmlBody = '<div>\n  <span>  Unsafe & untouched  </span>\n</div>';
      service.getNewsArticle('raw-html-news').subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.newsItem('raw-html-news'));
      req.flush({
        ok: true,
        item: {
          slug: 'raw-html-news',
          title: 'Title',
          excerpt: null,
          content: htmlBody,
          image_url: null,
          published_at: null,
        },
      });

      expect(result?.contentHtml).toBe(htmlBody);
    });

    it('payload inválido produz NewsContractError', () => {
      let errorReceived: unknown;
      service.getNewsArticle('invalid-article').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsItem('invalid-article'));
      req.flush({ ok: true, item: null });

      expect(errorReceived).toBeInstanceOf(NewsContractError);
      expect((errorReceived as NewsContractError).message).toBe(
        'Invalid NewsArticle payload received for slug: invalid-article'
      );
    });

    it('HTTP 404 propaga HttpErrorResponse sem converter para erro contratual', () => {
      let errorReceived: unknown;
      service.getNewsArticle('not-found-news').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsItem('not-found-news'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(404);
    });

    it('HTTP 500 propaga HttpErrorResponse intacto', () => {
      let errorReceived: unknown;
      service.getNewsArticle('server-error-news').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.newsItem('server-error-news'));
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });
  });
});
