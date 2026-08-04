import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { UiCard } from '../../../shared/components/card/card';
import { NewsArticleBody } from '../components/news-article-body/news-article-body';
import { NewsApiService } from '../data-access/news-api.service';
import type { NewsArticle } from '../domain/news.model';

interface NewsDetailReadyVm {
  readonly state: 'ready';
  readonly article: NewsArticle;
}

type NewsDetailVm =
  | NewsDetailReadyVm
  | { readonly state: 'loading' }
  | { readonly state: 'not-found' }
  | { readonly state: 'error' };

@Component({
  selector: 'app-news-detail-page',
  imports: [
    AsyncPipe,
    RouterLink,
    NewsArticleBody,
    PageHeader,
    PageState,
    StatusBadge,
    UiCard,
  ],
  templateUrl: './news-detail-page.html',
  styleUrl: './news-detail-page.css',
})
export class NewsDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly newsApi = inject(NewsApiService);
  private readonly title = inject(Title);
  private readonly reload$ = new Subject<void>();

  private readonly previousDocumentTitle = this.title.getTitle();
  private readonly newsDocumentTitle = 'HSC — News';

  private readonly failedImageUrl = signal<string | null>(null);

  protected readonly vm$: Observable<NewsDetailVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.route.paramMap.pipe(
        map((params) => params.get('slug')?.trim() ?? ''),
        distinctUntilChanged(),
        tap(() => this.title.setTitle(this.newsDocumentTitle)),
        switchMap((slug) => {
          if (!slug) {
            return of({ state: 'not-found' } satisfies NewsDetailVm);
          }

          return this.newsApi.getNewsArticle(slug).pipe(
            map((article): NewsDetailVm => {
              this.title.setTitle(`HSC — ${article.title}`);
              return { state: 'ready', article };
            }),
            startWith({ state: 'loading' } satisfies NewsDetailVm),
            catchError((error: unknown) => {
              if (error instanceof HttpErrorResponse && error.status === 404) {
                return of({ state: 'not-found' } satisfies NewsDetailVm);
              }

              return of({ state: 'error' } satisfies NewsDetailVm);
            }),
          );
        }),
      ),
    ),
  );

  protected retry(): void {
    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.title.setTitle(this.previousDocumentTitle);
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'Sem data';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected articleDescription(excerpt: string | null): string | undefined {
    if (!excerpt || excerpt.trim().length === 0) {
      return undefined;
    }
    return excerpt;
  }

  protected showHeroImage(imageUrl: string | null): boolean {
    if (!imageUrl || imageUrl.trim().length === 0) {
      return false;
    }
    return this.failedImageUrl() !== imageUrl;
  }

  protected onHeroImageError(imageUrl: string | null): void {
    if (imageUrl && imageUrl.trim().length > 0) {
      this.failedImageUrl.set(imageUrl);
    }
  }
}
