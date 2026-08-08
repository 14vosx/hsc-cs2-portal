import { AsyncPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, shareReplay } from 'rxjs';

import { UiCard } from '../../shared/components/card/card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PageState } from '../../shared/components/page-state/page-state';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { HomeApiService } from './data-access/home-api.service';
import { HomeEditorialItem, HomeSeasonContextMode, HomeSeasonState } from './domain/home-season.model';

@Component({
  selector: 'app-home-page',
  imports: [
    AsyncPipe,
    RouterLink,
    PageHeader,
    SectionHeader,
    UiCard,
    StatusBadge,
    PageState,
  ],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly homeApi = inject(HomeApiService);

  protected readonly seasonState$: Observable<HomeSeasonState> = this.homeApi
    .getHomeSeasonMetrics()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly editorialHighlight$: Observable<HomeEditorialItem | null> = this.homeApi
    .getEditorialHighlight()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected seasonOverviewLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current' : `/seasons/${seasonSlug}`;
  }

  protected seasonRankingLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current/ranking' : `/seasons/${seasonSlug}/ranking`;
  }
}
