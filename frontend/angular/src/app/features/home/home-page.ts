import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, shareReplay } from 'rxjs';

import { UiCard } from '../../shared/components/card/card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PageState } from '../../shared/components/page-state/page-state';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { HomeApiService } from './data-access/home-api.service';
import { HomeEditorialItem, HomeSeasonState } from './domain/home-season.model';

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
}
