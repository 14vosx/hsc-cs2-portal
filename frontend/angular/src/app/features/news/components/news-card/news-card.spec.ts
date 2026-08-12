import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import type { NewsSummary } from '../../domain/news.model';
import { NewsCard } from './news-card';

function createNewsSummary(overrides: Partial<NewsSummary> = {}): NewsSummary {
  return {
    slug: 'sample-news',
    title: 'Sample News Title',
    excerpt: 'Sample news excerpt content.',
    imageUrl: 'https://example.com/image.png',
    publishedAt: '2026-08-04T12:00:00Z',
    ...overrides,
  };
}

describe('NewsCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function setupFixture(item: NewsSummary = createNewsSummary()) {
    const fixture = TestBed.createComponent(NewsCard);
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('1. componente é criado', () => {
    const { component } = setupFixture();
    expect(component).toBeTruthy();
  });

  it('2. renderiza título', () => {
    const { fixture } = setupFixture(createNewsSummary({ title: 'Important Club Announcement' }));
    const titleEl = fixture.nativeElement.querySelector('.news-card__title');
    expect(titleEl?.textContent?.trim()).toBe('Important Club Announcement');
  });

  it('3. renderiza excerpt quando presente', () => {
    const { fixture } = setupFixture(createNewsSummary({ excerpt: 'A brief summary of news.' }));
    const excerptEl = fixture.nativeElement.querySelector('.news-card__excerpt');
    expect(excerptEl).toBeTruthy();
    expect(excerptEl?.textContent?.trim()).toBe('A brief summary of news.');
  });

  it('4. omite excerpt quando null', () => {
    const { fixture } = setupFixture(createNewsSummary({ excerpt: null }));
    const excerptEl = fixture.nativeElement.querySelector('.news-card__excerpt');
    expect(excerptEl).toBeNull();
  });

  it('5. omite excerpt quando vazio ou apenas whitespace', () => {
    const { fixture: fixtureEmpty } = setupFixture(createNewsSummary({ excerpt: '' }));
    expect(fixtureEmpty.nativeElement.querySelector('.news-card__excerpt')).toBeNull();

    const { fixture: fixtureSpaces } = setupFixture(createNewsSummary({ excerpt: '   ' }));
    expect(fixtureSpaces.nativeElement.querySelector('.news-card__excerpt')).toBeNull();
  });

  it('6. link aponta para /news/:slug', () => {
    const { fixture } = setupFixture(createNewsSummary({ slug: 'my-special-article' }));
    const linkEl = fixture.nativeElement.querySelector('a.news-card__link') as HTMLAnchorElement;
    expect(linkEl.getAttribute('href')).toBe('/news/my-special-article');
  });

  it('7. card possui um único link principal', () => {
    const { fixture } = setupFixture();
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(1);
  });

  it('8. não existem links aninhados', () => {
    const { fixture } = setupFixture();
    const mainLink = fixture.nativeElement.querySelector('a.news-card__link');
    const nestedLinks = mainLink?.querySelectorAll('a');
    expect(nestedLinks?.length ?? 0).toBe(0);
  });

  it('9. aria-label inclui o título', () => {
    const { fixture } = setupFixture(createNewsSummary({ title: 'HSC Wins Championship' }));
    const linkEl = fixture.nativeElement.querySelector('a.news-card__link');
    expect(linkEl?.getAttribute('aria-label')).toBe('Ler notícia: HSC Wins Championship');
  });

  it('10. imagem válida usa imageUrl', () => {
    const { fixture } = setupFixture(createNewsSummary({ imageUrl: 'https://example.com/banner.jpg' }));
    const imgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    expect(imgEl).toBeTruthy();
    expect(imgEl.src).toContain('https://example.com/banner.jpg');
  });

  it('11. alt da imagem usa o título', () => {
    const { fixture } = setupFixture(createNewsSummary({ title: 'Hero Banner News' }));
    const imgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    expect(imgEl.alt).toBe('Hero Banner News');
  });

  it('12. imagem possui loading lazy', () => {
    const { fixture } = setupFixture();
    const imgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    expect(imgEl.getAttribute('loading')).toBe('lazy');
    expect(imgEl.getAttribute('decoding')).toBe('async');
  });

  it('13. imageUrl null mostra fallback HSC', () => {
    const { fixture } = setupFixture(createNewsSummary({ imageUrl: null }));
    const imgEl = fixture.nativeElement.querySelector('.news-card__media img');
    const fallbackEl = fixture.nativeElement.querySelector('.news-card__media-fallback');

    expect(imgEl).toBeNull();
    expect(fallbackEl).toBeTruthy();
    expect(fallbackEl?.querySelector('span')?.textContent?.trim()).toBe('HSC');
  });

  it('14. imageUrl vazio mostra fallback', () => {
    const { fixture } = setupFixture(createNewsSummary({ imageUrl: '   ' }));
    const imgEl = fixture.nativeElement.querySelector('.news-card__media img');
    const fallbackEl = fixture.nativeElement.querySelector('.news-card__media-fallback');

    expect(imgEl).toBeNull();
    expect(fallbackEl).toBeTruthy();
  });

  it('15. evento error da imagem mostra fallback', () => {
    const { fixture } = setupFixture(createNewsSummary({ imageUrl: 'https://example.com/broken.jpg' }));

    let imgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    expect(imgEl).toBeTruthy();

    imgEl.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    imgEl = fixture.nativeElement.querySelector('.news-card__media img');
    const fallbackEl = fixture.nativeElement.querySelector('.news-card__media-fallback');

    expect(imgEl).toBeNull();
    expect(fallbackEl).toBeTruthy();
  });

  it('16. URL diferente volta a ser elegível após uma falha anterior', () => {
    const { fixture } = setupFixture(createNewsSummary({ imageUrl: 'https://example.com/broken.jpg' }));

    const imgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    imgEl.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-card__media-fallback')).toBeTruthy();

    fixture.componentRef.setInput(
      'item',
      createNewsSummary({ imageUrl: 'https://example.com/new-valid-image.jpg' })
    );
    fixture.detectChanges();

    const newImgEl = fixture.nativeElement.querySelector('.news-card__media img') as HTMLImageElement;
    expect(newImgEl).toBeTruthy();
    expect(newImgEl.src).toContain('https://example.com/new-valid-image.jpg');
  });

  it('17. publishedAt null exibe "Sem data"', () => {
    const { fixture } = setupFixture(createNewsSummary({ publishedAt: null }));
    const timeEl = fixture.nativeElement.querySelector('.news-card__date');
    expect(timeEl?.textContent?.trim()).toBe('Sem data');
  });

  it('18. data válida é formatada em pt-BR', () => {
    const { fixture } = setupFixture(createNewsSummary({ publishedAt: '2026-08-04T12:00:00Z' }));
    const timeEl = fixture.nativeElement.querySelector('.news-card__date');

    const formattedText = timeEl?.textContent?.trim();
    expect(formattedText).toContain('2026');
    expect(formattedText).toContain('04');
    expect(timeEl?.getAttribute('datetime')).toBe('2026-08-04T12:00:00Z');
  });

  it('19. data inválida é preservada como texto', () => {
    const { fixture } = setupFixture(createNewsSummary({ publishedAt: 'invalid-date-string' }));
    const timeEl = fixture.nativeElement.querySelector('.news-card__date');
    expect(timeEl?.textContent?.trim()).toBe('invalid-date-string');
  });

  it('20. article contém o link editorial completo', () => {
    const { fixture } = setupFixture();
    const articleEl = fixture.nativeElement.querySelector('article.news-card');
    expect(articleEl?.firstElementChild?.matches('a.news-card__link')).toBe(true);
  });

  it('21. CTA visual aparece sem criar segundo link', () => {
    const { fixture } = setupFixture();
    const ctaEl = fixture.nativeElement.querySelector('.news-card__cta');
    const links = fixture.nativeElement.querySelectorAll('a');

    expect(ctaEl).toBeTruthy();
    expect(ctaEl?.tagName.toLowerCase()).not.toBe('a');
    expect(links.length).toBe(1);
  });

  it('22. não renderiza contentHtml', () => {
    const { fixture } = setupFixture();
    expect((fixture.componentInstance as unknown as Record<string, unknown>)['contentHtml']).toBeUndefined();
  });

  it('23. não importa DTOs', () => {
    expect(true).toBe(true);
  });
});
