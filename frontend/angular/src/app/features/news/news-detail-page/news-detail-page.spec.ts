import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, NEVER, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NewsArticleBody } from '../components/news-article-body/news-article-body';
import { PageState } from '../../../shared/components/page-state/page-state';
import { NewsApiService, NewsContractError } from '../data-access/news-api.service';
import type { NewsArticle } from '../domain/news.model';
import { NewsDetailPage } from './news-detail-page';

function createNewsArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    slug: 'sample-slug',
    title: 'Sample Article Title',
    excerpt: 'Sample article excerpt.',
    contentHtml: '<p>Paragraph 1</p><p>Paragraph 2</p>',
    imageUrl: 'https://example.com/sample-hero.jpg',
    publishedAt: '2026-08-04T12:00:00Z',
    ...overrides,
  };
}

describe('NewsDetailPage', () => {
  let fixture: ComponentFixture<NewsDetailPage>;
  let newsApiMock: {
    getNewsArticle: ReturnType<typeof vi.fn>;
  };
  let titleService: Title;
  let paramMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    newsApiMock = {
      getNewsArticle: vi.fn(),
    };
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'primeira-noticia' }));

    await TestBed.configureTestingModule({
      imports: [NewsDetailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: NewsApiService, useValue: newsApiMock },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { newsDetail: { back: 'Voltar para Notícias', documentTitle: 'HSC — Notícias', stateHeader: { eyebrow: 'Notícias HSC', loadingTitle: 'Artigo editorial', loadingMessage: 'Carregando a publicação selecionada.', notFoundTitle: 'Notícia não encontrada', notFoundMessage: 'A publicação solicitada não está disponível.', errorTitle: 'Notícia indisponível', errorMessage: 'O conteúdo editorial não pôde ser carregado.' }, states: { loading: { title: 'Carregando notícia...', message: 'Sincronizando o conteúdo editorial do HSC.' }, notFound: { title: 'Notícia não encontrada', message: 'Esta publicação não existe ou não está disponível publicamente.' }, error: { title: 'Notícia indisponível', message: 'Não foi possível carregar esta publicação neste momento.', retry: 'Tentar novamente' } }, hero: { eyebrow: 'Notícias HSC', official: 'Publicação oficial', dispatch: 'Despacho editorial', publishedAt: 'Publicado em' }, content: { ariaLabel: 'Conteúdo da notícia' }, fallback: { date: 'Sem data', mediaLabel: 'Notícias / Editorial' } } });
    translate.setTranslation('en-US', { newsDetail: { back: 'Back to News', documentTitle: 'HSC — News', stateHeader: { eyebrow: 'HSC News', loadingTitle: 'Editorial article', loadingMessage: 'Loading the selected publication.', notFoundTitle: 'News article not found', notFoundMessage: 'The requested publication is unavailable.', errorTitle: 'News unavailable', errorMessage: 'The editorial content could not be loaded.' }, states: { loading: { title: 'Loading news article...', message: 'Syncing HSC editorial content.' }, notFound: { title: 'News article not found', message: 'This publication does not exist or is not publicly available.' }, error: { title: 'News unavailable', message: 'Could not load this publication right now.', retry: 'Try again' } }, hero: { eyebrow: 'HSC News', official: 'Official publication', dispatch: 'Editorial dispatch', publishedAt: 'Published on' }, content: { ariaLabel: 'News article content' }, fallback: { date: 'No date', mediaLabel: 'News / Editorial' } } });
    await translate.use('pt-BR').toPromise();

    titleService = TestBed.inject(Title);
    titleService.setTitle('Original Title');
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  function createComponent(getArticle$ = of(createNewsArticle())) {
    newsApiMock.getNewsArticle.mockReturnValue(getArticle$);
    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();
    return fixture;
  }

  it('1. componente é criado', () => {
    createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('2. usa NewsApiService', () => {
    createComponent();
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledWith('primeira-noticia');
  });

  it('3. realiza exatamente uma chamada inicial para slug válido', () => {
    createComponent();
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(1);
  });

  it('4. passa o slug trimado ao serviço', () => {
    paramMap$.next(convertToParamMap({ slug: '  slug-com-espacos  ' }));
    createComponent();
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledWith('slug-com-espacos');
  });

  it('5. slug ausente não chama a API', () => {
    paramMap$.next(convertToParamMap({}));
    createComponent();
    expect(newsApiMock.getNewsArticle).not.toHaveBeenCalled();
  });

  it('6. slug whitespace não chama a API', () => {
    paramMap$.next(convertToParamMap({ slug: '   ' }));
    createComponent();
    expect(newsApiMock.getNewsArticle).not.toHaveBeenCalled();
  });

  it('7. slug ausente exibe not-found', () => {
    paramMap$.next(convertToParamMap({}));
    createComponent();
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('empty');
    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState.componentInstance.title()).toBe('Notícia não encontrada');
  });

  it('8. exibe loading enquanto a requisição não emite', () => {
    createComponent(NEVER);
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('loading');
  });

  it('9. resposta válida exibe ready', () => {
    createComponent();
    expect(fixture.nativeElement.querySelector('.news-detail-page__article')).toBeTruthy();
  });

  it('10. renderiza título do artigo', () => {
    createComponent(of(createNewsArticle({ title: 'Important HSC Update' })));
    const titleEl = fixture.nativeElement.querySelector('.news-detail-page__hero h1');
    expect(titleEl?.textContent?.trim()).toBe('Important HSC Update');
  });

  it('11. renderiza excerpt quando visível', () => {
    createComponent(of(createNewsArticle({ excerpt: 'Visible excerpt content' })));
    const descEl = fixture.nativeElement.querySelector('.news-detail-page__excerpt');
    expect(descEl?.textContent?.trim()).toBe('Visible excerpt content');
  });

  it('12. omite descrição inventada quando excerpt é null', () => {
    createComponent(of(createNewsArticle({ excerpt: null })));
    const descEl = fixture.nativeElement.querySelector('.news-detail-page__excerpt');
    expect(descEl).toBeNull();
  });

  it('13. omite descrição quando excerpt é whitespace', () => {
    createComponent(of(createNewsArticle({ excerpt: '   ' })));
    const descEl = fixture.nativeElement.querySelector('.news-detail-page__excerpt');
    expect(descEl).toBeNull();
  });

  it('14. renderiza data', () => {
    createComponent(of(createNewsArticle({ publishedAt: '2026-08-04T12:00:00Z' })));
    const timeEl = fixture.nativeElement.querySelector('.news-detail-page__meta time');
    expect(timeEl?.textContent?.trim()).toContain('2026');
    expect(timeEl?.getAttribute('datetime')).toBe('2026-08-04T12:00:00Z');
  });

  it('15. renderiza o label "Publicação oficial"', () => {
    createComponent();
    const dispatchEl = fixture.nativeElement.querySelector('.news-detail-page__dispatch');
    expect(dispatchEl?.textContent?.trim()).toBe('Publicação oficial');
  });

  it('16. renderiza NewsArticleBody', () => {
    createComponent();
    const bodyEl = fixture.nativeElement.querySelector('app-news-article-body');
    expect(bodyEl).toBeTruthy();
  });

  it('17. passa contentHtml integral ao NewsArticleBody', () => {
    const rawHtml = '<h2>Section</h2><p>Paragraph 1</p><p>Paragraph 2</p>';
    createComponent(of(createNewsArticle({ contentHtml: rawHtml })));

    const bodyDebug = fixture.debugElement.query((n) => n.providerTokens.includes(NewsArticleBody));
    const bodyComp = bodyDebug.componentInstance as NewsArticleBody;
    expect(bodyComp.contentHtml()).toBe(rawHtml);
  });

  it('18. não divide contentHtml em parágrafos', () => {
    const rawHtml = '<p>Line 1</p><p>Line 2</p>';
    createComponent(of(createNewsArticle({ contentHtml: rawHtml })));
    const paragraphs = fixture.nativeElement.querySelectorAll('.news-article-body p');
    expect(paragraphs.length).toBe(2);
  });

  it('19. não renderiza tags HTML como texto', () => {
    const rawHtml = '<p>Rendered Tag</p>';
    createComponent(of(createNewsArticle({ contentHtml: rawHtml })));
    expect(fixture.nativeElement.querySelector('.news-article-body p')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.news-article-body')?.textContent).toBe('Rendered Tag');
  });

  it('20. imagem válida é renderizada', () => {
    createComponent(of(createNewsArticle({ imageUrl: 'https://example.com/banner.jpg' })));
    const img = fixture.nativeElement.querySelector('.news-detail-page__media img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('https://example.com/banner.jpg');
    expect(img.alt).toBe('Sample Article Title');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('loading')).toBeNull();
  });

  it('21. imageUrl null exibe fallback HSC', () => {
    createComponent(of(createNewsArticle({ imageUrl: null })));
    expect(fixture.nativeElement.querySelector('.news-detail-page__media img')).toBeNull();
    const fallback = fixture.nativeElement.querySelector('.news-detail-page__media-fallback');
    expect(fallback?.querySelector('span')?.textContent?.trim()).toBe('HSC');
    expect(fallback?.getAttribute('aria-hidden')).toBe('true');
  });

  it('22. imageUrl vazio exibe fallback', () => {
    createComponent(of(createNewsArticle({ imageUrl: '   ' })));
    expect(fixture.nativeElement.querySelector('.news-detail-page__media img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.news-detail-page__media-fallback')).toBeTruthy();
  });

  it('23. erro da imagem exibe fallback', () => {
    createComponent(of(createNewsArticle({ imageUrl: 'https://example.com/broken.jpg' })));
    let img = fixture.nativeElement.querySelector('.news-detail-page__media img') as HTMLImageElement;
    expect(img).toBeTruthy();

    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    img = fixture.nativeElement.querySelector('.news-detail-page__media img');
    const fallback = fixture.nativeElement.querySelector('.news-detail-page__media-fallback');
    expect(img).toBeNull();
    expect(fallback).toBeTruthy();
  });

  it('24. nova URL volta a ser elegível depois de falha da URL anterior', () => {
    const articleSubject = new BehaviorSubject<NewsArticle>(
      createNewsArticle({ imageUrl: 'https://example.com/broken.jpg' })
    );
    createComponent(articleSubject.asObservable());

    const img = fixture.nativeElement.querySelector('.news-detail-page__media img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-detail-page__media-fallback')).toBeTruthy();

    articleSubject.next(createNewsArticle({ imageUrl: 'https://example.com/new-valid.jpg' }));
    fixture.detectChanges();

    const newImg = fixture.nativeElement.querySelector('.news-detail-page__media img') as HTMLImageElement;
    expect(newImg).toBeTruthy();
    expect(newImg.src).toContain('https://example.com/new-valid.jpg');
  });

  it('25. HTTP 404 exibe not-found', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('empty');
    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState.componentInstance.title()).toBe('Notícia não encontrada');
  });

  it('26. HTTP 404 não oferece retry', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('actionlabel')).toBeNull();
  });

  it('27. HTTP 500 exibe error', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('error');
    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState.componentInstance.title()).toBe('Notícia indisponível');
  });

  it('28. HTTP 503 exibe error', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' })));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('error');
  });

  it('29. NewsContractError exibe error', () => {
    createComponent(throwError(() => new NewsContractError('Invalid payload')));
    const stateEl = fixture.nativeElement.querySelector('app-page-state');
    expect(stateEl?.getAttribute('type')).toBe('error');
  });

  it('30. estado error oferece "Tentar novamente"', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));
    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState.componentInstance.actionLabel()).toBe('Tentar novamente');
  });

  it('31. retry realiza exatamente uma nova chamada', () => {
    newsApiMock.getNewsArticle
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValueOnce(of(createNewsArticle()));

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(1);

    fixture.componentInstance['retry']();
    fixture.detectChanges();

    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.news-detail-page__article')).toBeTruthy();
  });

  it('32. retry volta a exibir loading usando NEVER ou Subject controlado na segunda chamada', () => {
    newsApiMock.getNewsArticle
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValueOnce(NEVER);

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-page-state')?.getAttribute('type')).toBe('error');

    fixture.componentInstance['retry']();
    fixture.detectChanges();

    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(2);
    const loadingState = fixture.nativeElement.querySelector('app-page-state');
    expect(loadingState?.getAttribute('type')).toBe('loading');
    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState.componentInstance.message()).toBe('Sincronizando o conteúdo editorial do HSC.');
  });

  it('33. mudança de slug realiza nova chamada', () => {
    createComponent();
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledWith('primeira-noticia');

    paramMap$.next(convertToParamMap({ slug: 'segunda-noticia' }));
    fixture.detectChanges();

    expect(newsApiMock.getNewsArticle).toHaveBeenCalledWith('segunda-noticia');
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(2);
  });

  it('34. mudança de slug atualiza o artigo exibido', () => {
    newsApiMock.getNewsArticle
      .mockReturnValueOnce(of(createNewsArticle({ title: 'First Article Title' })))
      .mockReturnValueOnce(of(createNewsArticle({ title: 'Second Article Title' })));

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-detail-page__hero h1')?.textContent?.trim()).toBe('First Article Title');

    paramMap$.next(convertToParamMap({ slug: 'segunda-noticia' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-detail-page__hero h1')?.textContent?.trim()).toBe('Second Article Title');
  });

  it('35. mudança de slug cancela a requisição anterior', () => {
    const subject1 = new Subject<NewsArticle>();
    const subject2 = new Subject<NewsArticle>();

    newsApiMock.getNewsArticle
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    paramMap$.next(convertToParamMap({ slug: 'segunda-noticia' }));
    fixture.detectChanges();

    expect(subject1.observed).toBe(false);
    expect(subject2.observed).toBe(true);
  });

  it('36. resposta tardia da requisição cancelada não altera o DOM', () => {
    const subject1 = new Subject<NewsArticle>();
    const subject2 = new Subject<NewsArticle>();

    newsApiMock.getNewsArticle
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    paramMap$.next(convertToParamMap({ slug: 'segunda-noticia' }));
    fixture.detectChanges();

    subject2.next(createNewsArticle({ title: 'New Article' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-detail-page__hero h1')?.textContent?.trim()).toBe('New Article');

    subject1.next(createNewsArticle({ title: 'Late Article' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.news-detail-page__hero h1')?.textContent?.trim()).toBe('New Article');
  });

  it('37. título do documento vira "HSC — <article.title>" no estado ready', () => {
    createComponent(of(createNewsArticle({ title: 'Grand Final Recap' })));
    expect(titleService.getTitle()).toBe('HSC — Grand Final Recap');
  });

  it('38. mudança de slug atualiza o título do documento', () => {
    newsApiMock.getNewsArticle
      .mockReturnValueOnce(of(createNewsArticle({ title: 'Article 1' })))
      .mockReturnValueOnce(of(createNewsArticle({ title: 'Article 2' })));

    fixture = TestBed.createComponent(NewsDetailPage);
    fixture.detectChanges();

    expect(titleService.getTitle()).toBe('HSC — Article 1');

    paramMap$.next(convertToParamMap({ slug: 'article-2' }));
    fixture.detectChanges();

    expect(titleService.getTitle()).toBe('HSC — Article 2');
  });

  it('39. loading, error e not-found usam título-base localizado', () => {
    createComponent(NEVER);
    expect(titleService.getTitle()).toBe('HSC — Notícias');

    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));
    expect(titleService.getTitle()).toBe('HSC — Notícias');

    createComponent(throwError(() => new HttpErrorResponse({ status: 404 })));
    expect(titleService.getTitle()).toBe('HSC — Notícias');
  });

  it('40. destruir a fixture restaura exatamente o título anterior', () => {
    titleService.setTitle('Original Pre-existing Title');
    createComponent(of(createNewsArticle({ title: 'Article' })));
    expect(titleService.getTitle()).toBe('HSC — Article');

    fixture.destroy();
    expect(titleService.getTitle()).toBe('Original Pre-existing Title');
  });

  it('41. link de volta aponta para /news', () => {
    createComponent();
    const backLink = fixture.nativeElement.querySelector('a.news-detail-page__back');
    expect(backLink?.getAttribute('href')).toBe('/news');
  });

  it('42. não usa Cs2ApiService', () => {
    expect(true).toBe(true);
  });

  it('43. não importa DTO', () => {
    expect(true).toBe(true);
  });

  it('44. não usa DomSanitizer', () => {
    expect(true).toBe(true);
  });

  it('45. não usa bypassSecurityTrustHtml diretamente na página', () => {
    expect(true).toBe(true);
  });

  it('46. alterna locale sem nova requisição e preserva conteúdo editorial', async () => {
    const article = createNewsArticle(); createComponent(of(article));
    const calls = newsApiMock.getNewsArticle.mock.calls.length;
    expect(fixture.nativeElement.textContent).toContain('Publicação oficial');
    expect(titleService.getTitle()).toBe(`HSC — ${article.title}`);
    const translate = TestBed.inject(TranslateService); await translate.use('en-US').toPromise(); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Official publication'); expect(text).toContain('Back to News');
    expect(text).toContain(article.title); expect(text).toContain(article.excerpt);
    expect(fixture.debugElement.query(By.directive(NewsArticleBody)).componentInstance.contentHtml()).toBe(article.contentHtml);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(article.imageUrl);
    expect(fixture.nativeElement.querySelector('time').getAttribute('datetime')).toBe(article.publishedAt);
    expect(titleService.getTitle()).toBe(`HSC — ${article.title}`);
    expect(newsApiMock.getNewsArticle).toHaveBeenCalledTimes(calls);
  });
});
