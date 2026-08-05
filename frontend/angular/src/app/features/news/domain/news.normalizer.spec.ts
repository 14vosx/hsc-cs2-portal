import { describe, expect, it } from 'vitest';

import { normalizeNewsArticle, normalizeNewsIndex } from './news.normalizer';

describe('news.normalizer', () => {
  describe('normalizeNewsIndex', () => {
    it('1. null, undefined, primitivos e array como root retornam null', () => {
      expect(normalizeNewsIndex(null)).toBeNull();
      expect(normalizeNewsIndex(undefined)).toBeNull();
      expect(normalizeNewsIndex(123)).toBeNull();
      expect(normalizeNewsIndex('string')).toBeNull();
      expect(normalizeNewsIndex(true)).toBeNull();
      expect(normalizeNewsIndex([])).toBeNull();
    });

    it('2. ok ausente, false ou tipo inválido retorna null', () => {
      expect(normalizeNewsIndex({ count: 0, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: false, count: 0, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: 'true', count: 0, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: 1, count: 0, items: [] })).toBeNull();
    });

    it('3. count ausente, negativo, fracionário ou tipo inválido retorna null', () => {
      expect(normalizeNewsIndex({ ok: true, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: -1, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: 1.5, items: [] })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: '10', items: [] })).toBeNull();
    });

    it('4. items ausente ou não array retorna null', () => {
      expect(normalizeNewsIndex({ ok: true, count: 0 })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: 0, items: null })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: 0, items: {} })).toBeNull();
      expect(normalizeNewsIndex({ ok: true, count: 0, items: 'not-an-array' })).toBeNull();
    });

    it('5. items vazio é válido', () => {
      const result = normalizeNewsIndex({ ok: true, count: 0, items: [] });
      expect(result).toEqual({ count: 0, items: [] });
    });

    it('6. payload completo é mapeado para camelCase', () => {
      const payload = {
        ok: true,
        count: 1,
        items: [
          {
            slug: '  news-slug  ',
            title: '  News Title  ',
            excerpt: 'News Excerpt',
            image_url: 'https://example.com/img.jpg',
            published_at: '2026-08-04T12:00:00Z',
          },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result).toEqual({
        count: 1,
        items: [
          {
            slug: 'news-slug',
            title: 'News Title',
            excerpt: 'News Excerpt',
            imageUrl: 'https://example.com/img.jpg',
            publishedAt: '2026-08-04T12:00:00Z',
          },
        ],
      });
    });

    it('7. ordem publicada é preservada', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          { slug: 'first', title: 'First', excerpt: null, image_url: null, published_at: '2026-01-01' },
          { slug: 'second', title: 'Second', excerpt: null, image_url: null, published_at: '2026-03-01' },
          { slug: 'third', title: 'Third', excerpt: null, image_url: null, published_at: '2026-02-01' },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items.map((i) => i.slug)).toEqual(['first', 'second', 'third']);
    });

    it('8. count remoto é preservado e não substituído por items.length', () => {
      const payload = {
        ok: true,
        count: 100,
        items: [
          { slug: 'item-1', title: 'Title 1', excerpt: null, image_url: null, published_at: null },
          { slug: 'invalid', title: '', excerpt: null, image_url: null, published_at: null },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.count).toBe(100);
      expect(result?.items.length).toBe(1);
    });

    it('9. slug ou title vazio invalida somente o item', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          { slug: '   ', title: 'Valid Title', excerpt: null, image_url: null, published_at: null },
          { slug: 'valid-slug', title: '  ', excerpt: null, image_url: null, published_at: null },
          { slug: 'valid-slug-2', title: 'Valid Title 2', excerpt: null, image_url: null, published_at: null },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].slug).toBe('valid-slug-2');
    });

    it('10. propriedades nullable com null explícito são preservadas', () => {
      const payload = {
        ok: true,
        count: 1,
        items: [
          { slug: 'slug-1', title: 'Title 1', excerpt: null, image_url: null, published_at: null },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items[0]).toEqual({
        slug: 'slug-1',
        title: 'Title 1',
        excerpt: null,
        imageUrl: null,
        publishedAt: null,
      });
    });

    it('11. propriedade nullable ausente invalida o item', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          { slug: 'slug-1', title: 'Title 1', image_url: null, published_at: null }, // missing excerpt
          { slug: 'slug-2', title: 'Title 2', excerpt: null, published_at: null }, // missing image_url
          { slug: 'slug-3', title: 'Title 3', excerpt: null, image_url: null }, // missing published_at
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items).toEqual([]);
    });

    it('12. propriedade nullable com tipo inválido invalida o item', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          { slug: 'slug-1', title: 'Title 1', excerpt: 123, image_url: null, published_at: null },
          { slug: 'slug-2', title: 'Title 2', excerpt: null, image_url: true, published_at: null },
          { slug: 'slug-3', title: 'Title 3', excerpt: null, image_url: null, published_at: ['date'] },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items).toEqual([]);
    });

    it('13. item array ou primitivo é ignorado', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          'just-a-string',
          12345,
          null,
          ['array-item'],
          { slug: 'valid', title: 'Valid Item', excerpt: null, image_url: null, published_at: null },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].slug).toBe('valid');
    });

    it('14. mistura de itens válidos e inválidos preserva somente os válidos na ordem original', () => {
      const payload = {
        ok: true,
        count: 4,
        items: [
          { slug: 'item-1', title: 'Item 1', excerpt: null, image_url: null, published_at: null },
          { slug: 'invalid-1', title: 'Invalid' }, // missing properties
          { slug: 'item-2', title: 'Item 2', excerpt: 'Excerpt 2', image_url: null, published_at: null },
          null,
          { slug: 'item-3', title: 'Item 3', excerpt: null, image_url: 'http://img', published_at: null },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items.map((i) => i.slug)).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('15. não há ordenação por publishedAt', () => {
      const payload = {
        ok: true,
        count: 3,
        items: [
          { slug: 'oldest', title: 'Oldest', excerpt: null, image_url: null, published_at: '2020-01-01' },
          { slug: 'newest', title: 'Newest', excerpt: null, image_url: null, published_at: '2026-08-04' },
          { slug: 'middle', title: 'Middle', excerpt: null, image_url: null, published_at: '2023-05-05' },
        ],
      };

      const result = normalizeNewsIndex(payload);

      expect(result?.items.map((i) => i.slug)).toEqual(['oldest', 'newest', 'middle']);
    });
  });

  describe('normalizeNewsArticle', () => {
    it('1. root inválido retorna null', () => {
      expect(normalizeNewsArticle(null)).toBeNull();
      expect(normalizeNewsArticle(undefined)).toBeNull();
      expect(normalizeNewsArticle(123)).toBeNull();
      expect(normalizeNewsArticle('string')).toBeNull();
      expect(normalizeNewsArticle([])).toBeNull();
    });

    it('2. ok diferente de true retorna null', () => {
      const payload = {
        ok: false,
        item: {
          slug: 'slug',
          title: 'title',
          excerpt: null,
          content: '<p>Body</p>',
          image_url: null,
          published_at: null,
        },
      };

      expect(normalizeNewsArticle(payload)).toBeNull();
      expect(normalizeNewsArticle({ ...payload, ok: 'true' })).toBeNull();
    });

    it('3. item ausente, null, array ou primitivo retorna null', () => {
      expect(normalizeNewsArticle({ ok: true })).toBeNull();
      expect(normalizeNewsArticle({ ok: true, item: null })).toBeNull();
      expect(normalizeNewsArticle({ ok: true, item: [] })).toBeNull();
      expect(normalizeNewsArticle({ ok: true, item: 'string' })).toBeNull();
    });

    it('4. payload completo é normalizado', () => {
      const payload = {
        ok: true,
        item: {
          slug: 'article-slug',
          title: 'Article Title',
          excerpt: 'Short excerpt',
          content: '<article><h1>Title</h1><p>Content body</p></article>',
          image_url: 'https://example.com/hero.jpg',
          published_at: '2026-08-04T12:00:00Z',
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result).toEqual({
        slug: 'article-slug',
        title: 'Article Title',
        excerpt: 'Short excerpt',
        contentHtml: '<article><h1>Title</h1><p>Content body</p></article>',
        imageUrl: 'https://example.com/hero.jpg',
        publishedAt: '2026-08-04T12:00:00Z',
      });
    });

    it('5. slug e title são trimados', () => {
      const payload = {
        ok: true,
        item: {
          slug: '  trimmed-slug  ',
          title: '  Trimmed Title  ',
          excerpt: null,
          content: 'Content',
          image_url: null,
          published_at: null,
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result?.slug).toBe('trimmed-slug');
      expect(result?.title).toBe('Trimmed Title');
    });

    it('6. nullable null é preservado', () => {
      const payload = {
        ok: true,
        item: {
          slug: 'slug',
          title: 'Title',
          excerpt: null,
          content: 'Content',
          image_url: null,
          published_at: null,
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result?.excerpt).toBeNull();
      expect(result?.imageUrl).toBeNull();
      expect(result?.publishedAt).toBeNull();
    });

    it('7. propriedades nullable ausentes invalidam o detalhe', () => {
      expect(
        normalizeNewsArticle({
          ok: true,
          item: { slug: 's', title: 't', content: 'c', image_url: null, published_at: null },
        })
      ).toBeNull();

      expect(
        normalizeNewsArticle({
          ok: true,
          item: { slug: 's', title: 't', excerpt: null, content: 'c', published_at: null },
        })
      ).toBeNull();

      expect(
        normalizeNewsArticle({
          ok: true,
          item: { slug: 's', title: 't', excerpt: null, content: 'c', image_url: null },
        })
      ).toBeNull();
    });

    it('8. content ausente ou não string invalida o detalhe', () => {
      expect(
        normalizeNewsArticle({
          ok: true,
          item: { slug: 's', title: 't', excerpt: null, image_url: null, published_at: null },
        })
      ).toBeNull();

      expect(
        normalizeNewsArticle({
          ok: true,
          item: { slug: 's', title: 't', excerpt: null, content: 123, image_url: null, published_at: null },
        })
      ).toBeNull();
    });

    it('9. contentHtml preserva exatamente HTML, espaços e quebras de linha', () => {
      const rawContent = '  <div class="test">\n  <p>  Line 1  </p>\n</div>  ';
      const payload = {
        ok: true,
        item: {
          slug: 'slug',
          title: 'Title',
          excerpt: null,
          content: rawContent,
          image_url: null,
          published_at: null,
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result?.contentHtml).toBe(rawContent);
    });

    it('10. content string vazia continua válida', () => {
      const payload = {
        ok: true,
        item: {
          slug: 'slug',
          title: 'Title',
          excerpt: null,
          content: '',
          image_url: null,
          published_at: null,
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result).not.toBeNull();
      expect(result?.contentHtml).toBe('');
    });

    it('11. nenhuma tag HTML é removida ou transformada pelo normalizador', () => {
      const rawHtml = '<script>alert("xss")</script><iframe src="dangerous"></iframe><style>body{color:red}</style>';
      const payload = {
        ok: true,
        item: {
          slug: 'slug',
          title: 'Title',
          excerpt: null,
          content: rawHtml,
          image_url: null,
          published_at: null,
        },
      };

      const result = normalizeNewsArticle(payload);

      expect(result?.contentHtml).toBe(rawHtml);
    });
  });
});
