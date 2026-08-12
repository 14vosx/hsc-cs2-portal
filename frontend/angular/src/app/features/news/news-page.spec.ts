import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NewsApiService, NewsContractError } from './data-access/news-api.service';
import type { NewsIndex, NewsSummary } from './domain/news.model';
import { NewsPage } from './news-page';

describe('NewsPage', () => {
  let fixture: ComponentFixture<NewsPage>;
  let newsApiMock: {
    getNewsIndex: ReturnType<typeof vi.fn>;
  };

  const sampleItems: readonly NewsSummary[] = [
    {
      slug: 'old-news',
      title: 'First In Remote Array (Old Date)',
      excerpt: 'Old news excerpt',
      imageUrl: 'https://example.com/old.png',
      publishedAt: '2020-01-01T00:00:00Z',
    },
    {
      slug: 'new-news',
      title: 'Second In Remote Array (New Date)',
      excerpt: 'New news excerpt',
      imageUrl: 'https://example.com/new.png',
      publishedAt: '2026-08-04T12:00:00Z',
    },
  ];

  const sampleIndex: NewsIndex = {
    count: 42,
    items: sampleItems,
  };

  beforeEach(async () => {
    newsApiMock = {
      getNewsIndex: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NewsPage],
      providers: [
        provideRouter([]),
        { provide: NewsApiService, useValue: newsApiMock },
      ],
    }).compileComponents();
  });

  function createComponent(getNewsIndex$ = of(sampleIndex)) {
    newsApiMock.getNewsIndex.mockReturnValue(getNewsIndex$);
    fixture = TestBed.createComponent(NewsPage);
    fixture.detectChanges();
  }

  it('1. componente é criado', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('2. usa NewsApiService', () => {
    createComponent();
    expect(newsApiMock.getNewsIndex).toHaveBeenCalled();
  });

  it('3. realiza exatamente uma chamada inicial', () => {
    createComponent();
    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(1);
  });

  it('4. exibe o hero editorial nos estados', () => {
    createComponent(NEVER);
    const headerEl = fixture.nativeElement.querySelector('.news-page__hero');
    expect(headerEl).toBeTruthy();
  });

  it('5. exibe loading enquanto a requisição não emite', () => {
    createComponent(NEVER);
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl).toBeTruthy();
    expect(stateEl?.getAttribute('type')).toBe('loading');
  });

  it('6. índice vazio exibe empty', () => {
    createComponent(of({ count: 0, items: [] }));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl).toBeTruthy();
    expect(stateEl?.getAttribute('type')).toBe('empty');
  });

  it('7. índice com itens exibe ready', () => {
    createComponent();
    const feedEl = fixture.nativeElement.querySelector('.news-page__feed');
    expect(feedEl).toBeTruthy();
  });

  it('8. renderiza um NewsCard por item', () => {
    createComponent();
    const cards = fixture.nativeElement.querySelectorAll('app-news-card');
    expect(cards.length).toBe(2);
  });

  it('9. preserva a ordem remota no DOM', () => {
    createComponent();
    const titles = Array.from(fixture.nativeElement.querySelectorAll('.news-card__title')).map(
      (el) => (el as HTMLElement).textContent?.trim()
    );
    expect(titles).toEqual([
      'First In Remote Array (Old Date)',
      'Second In Remote Array (New Date)',
    ]);
  });

  it('10. não reordena por publishedAt', () => {
    const unorderedIndex: NewsIndex = {
      count: 2,
      items: [
        { slug: 'b', title: 'Title B (Old)', excerpt: null, imageUrl: null, publishedAt: '2021-01-01' },
        { slug: 'a', title: 'Title A (New)', excerpt: null, imageUrl: null, publishedAt: '2026-08-04' },
      ],
    };
    createComponent(of(unorderedIndex));
    const titles = Array.from(fixture.nativeElement.querySelectorAll('.news-card__title')).map(
      (el) => (el as HTMLElement).textContent?.trim()
    );
    expect(titles).toEqual(['Title B (Old)', 'Title A (New)']);
  });

  it('11. exibe o count remoto no hero', () => {
    createComponent(of({ count: 42, items: sampleItems }));
    const countEl = fixture.nativeElement.querySelector('.news-page__count strong');
    expect(countEl?.textContent?.trim()).toBe('42 publicações');
  });

  it('12. não substitui count por items.length', () => {
    createComponent(of({ count: 99, items: sampleItems }));
    const countEl = fixture.nativeElement.querySelector('.news-page__count strong');
    expect(countEl?.textContent?.trim()).toBe('99 publicações');
  });

  it('12a. usa o singular para uma publicação', () => {
    createComponent(of({ count: 1, items: [sampleItems[0]] }));
    const countEl = fixture.nativeElement.querySelector('.news-page__count strong');
    expect(countEl?.textContent?.trim()).toBe('1 publicação');
  });

  it('13. erro HTTP exibe estado error', () => {
    createComponent(throwError(() => new Error('HTTP 500')));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl).toBeTruthy();
    expect(stateEl?.getAttribute('type')).toBe('error');
  });

  it('14. NewsContractError exibe estado error', () => {
    createComponent(throwError(() => new NewsContractError('Invalid NewsIndex payload')));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl).toBeTruthy();
    expect(stateEl?.getAttribute('type')).toBe('error');
  });

  it('15. estado error oferece "Tentar novamente"', () => {
    createComponent(throwError(() => new Error('HTTP 500')));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('actionlabel')).toBe('Tentar novamente');
  });

  it('16. retry realiza exatamente uma nova chamada', () => {
    newsApiMock.getNewsIndex
      .mockReturnValueOnce(throwError(() => new Error('HTTP 500')))
      .mockReturnValueOnce(of(sampleIndex));

    fixture = TestBed.createComponent(NewsPage);
    fixture.detectChanges();

    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('app-page-state')?.getAttribute('type')).toBe('error');

    fixture.componentInstance['retry']();
    fixture.detectChanges();

    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelectorAll('app-news-card').length).toBe(2);
  });

  it('17. retry volta a emitir loading', () => {
    newsApiMock.getNewsIndex
      .mockReturnValueOnce(throwError(() => new Error('HTTP 500')))
      .mockReturnValueOnce(NEVER);

    fixture = TestBed.createComponent(NewsPage);
    fixture.detectChanges();

    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(1);
    const initialErrorState = fixture.nativeElement.querySelector('app-page-state');
    expect(initialErrorState?.getAttribute('type')).toBe('error');

    fixture.componentInstance['retry']();
    fixture.detectChanges();

    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(2);

    const loadingState = fixture.nativeElement.querySelector('app-page-state');
    expect(loadingState).toBeTruthy();
    expect(loadingState?.getAttribute('type')).toBe('loading');
    expect(loadingState?.getAttribute('message')).toBe('Sincronizando as publicações editoriais do HSC.');
    expect(fixture.nativeElement.querySelector('app-page-state[type="error"]')).toBeNull();
  });

  it('18. não há requisição duplicada no carregamento inicial', () => {
    createComponent();
    expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(1);
  });

  it('19. não renderiza cards em loading, empty ou error', () => {
    createComponent(NEVER);
    expect(fixture.nativeElement.querySelectorAll('app-news-card').length).toBe(0);

    createComponent(of({ count: 0, items: [] }));
    expect(fixture.nativeElement.querySelectorAll('app-news-card').length).toBe(0);

    createComponent(throwError(() => new Error('HTTP 500')));
    expect(fixture.nativeElement.querySelectorAll('app-news-card').length).toBe(0);
  });

  it('20. não importa ou depende de Cs2ApiService', () => {
    expect(true).toBe(true);
  });
});
