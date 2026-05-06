import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { NewsIndexItemDto } from '../../core/api/dto/news.dto';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface NewsReadyVm {
  state: 'ready';
  items: NewsIndexItemDto[];
}

type NewsVm = NewsReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-news-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './news-page.html',
  styleUrl: './news-page.css',
})
export class NewsPage {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<NewsVm> = this.cs2Api.getNewsIndex().pipe(
    map((payload): NewsVm => ({ state: 'ready', items: this.sortedItems(payload.items) })),
    startWith({ state: 'loading' } satisfies NewsVm),
    catchError(() => of({ state: 'error' } satisfies NewsVm)),
  );

  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Sem data';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected newsLink(item: NewsIndexItemDto): string {
    return item.slug ? `/news/${item.slug}` : '/news';
  }

  private sortedItems(items?: NewsIndexItemDto[]): NewsIndexItemDto[] {
    return (items ?? []).filter((item) => item.title?.trim()).sort((current, next) => {
      const nextTime = new Date(next.published_at ?? '').getTime();
      const currentTime = new Date(current.published_at ?? '').getTime();

      if (Number.isNaN(nextTime) && Number.isNaN(currentTime)) {
        return 0;
      }

      if (Number.isNaN(nextTime)) {
        return 1;
      }

      if (Number.isNaN(currentTime)) {
        return -1;
      }

      return nextTime - currentTime;
    });
  }
}
