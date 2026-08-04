import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { NewsArticle, NewsIndex } from '../domain/news.model';
import { normalizeNewsArticle, normalizeNewsIndex } from '../domain/news.normalizer';

export class NewsContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NewsContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class NewsApiService {
  private readonly http = inject(HttpClient);

  getNewsIndex(): Observable<NewsIndex> {
    return this.http.get<unknown>(cs2ApiPaths.newsIndex).pipe(
      map((payload) => {
        const normalized = normalizeNewsIndex(payload);
        if (!normalized) {
          throw new NewsContractError('Invalid NewsIndex payload received');
        }
        return normalized;
      }),
    );
  }

  getNewsArticle(slug: string): Observable<NewsArticle> {
    return this.http.get<unknown>(cs2ApiPaths.newsItem(slug)).pipe(
      map((payload) => {
        const normalized = normalizeNewsArticle(payload);
        if (!normalized) {
          throw new NewsContractError(`Invalid NewsArticle payload received for slug: ${slug}`);
        }
        return normalized;
      }),
    );
  }
}
