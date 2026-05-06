import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { NewsDetailItemDto } from '../../../core/api/dto/news.dto';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

interface NewsDetailReadyVm {
  state: 'ready';
  item?: NewsDetailItemDto;
}

type NewsDetailVm = NewsDetailReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-news-detail-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './news-detail-page.html',
  styleUrl: './news-detail-page.css',
})
export class NewsDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<NewsDetailVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => {
      if (!slug) {
        return of({ state: 'error' } satisfies NewsDetailVm);
      }

      return this.cs2Api.getNewsItem(slug).pipe(
        map((payload): NewsDetailVm => ({ state: 'ready', item: payload.item ?? undefined })),
        startWith({ state: 'loading' } satisfies NewsDetailVm),
        catchError(() => of({ state: 'error' } satisfies NewsDetailVm)),
      );
    }),
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

  protected paragraphs(content?: string | null): string[] {
    return (content ?? '')
      .split(/\n{2,}|\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
}
