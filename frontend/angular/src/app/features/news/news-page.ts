import { AsyncPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageState } from '../../shared/components/page-state/page-state';
import { NewsCard } from './components/news-card/news-card';
import { NewsApiService } from './data-access/news-api.service';
import type { NewsSummary } from './domain/news.model';

interface NewsReadyVm {
  readonly state: 'ready';
  readonly count: number;
  readonly items: readonly NewsSummary[];
}

type NewsVm =
  | NewsReadyVm
  | { readonly state: 'loading' }
  | { readonly state: 'empty' }
  | { readonly state: 'error' };

@Component({
  selector: 'app-news-page',
  imports: [AsyncPipe, PageState, NewsCard],
  templateUrl: './news-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './news-page.css',
})
export class NewsPage {
  private readonly newsApi = inject(NewsApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly vm$: Observable<NewsVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.newsApi.getNewsIndex().pipe(
        map((index): NewsVm => {
          if (index.items.length === 0) {
            return { state: 'empty' };
          }
          return {
            state: 'ready',
            count: index.count,
            items: index.items,
          };
        }),
        startWith({ state: 'loading' } satisfies NewsVm),
        catchError(() => of({ state: 'error' } satisfies NewsVm))
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected publicationCountLabel(count: number): string {
    return count === 1 ? '1 publicação' : `${count} publicações`;
  }
}
