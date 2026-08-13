import { AsyncPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { LocaleService } from '../../../core/i18n/locale.service';
import { PageState } from '../../../shared/components/page-state/page-state';
import { SeasonTabs } from '../../../shared/components/season-tabs/season-tabs';
import { StatusBadge, type StatusBadgeVariant } from '../../../shared/components/status-badge/status-badge';
import { formatSeasonBoundaryDate, seasonStatusLabel } from '../season-ui';
import { SeasonMatchesApiService } from '../data-access/season-matches-api.service';
import type { SeasonMatches } from '../domain/season-matches.model';

interface SeasonMatchesReadyVm {
  state: 'ready';
  data: SeasonMatches;
}

interface SeasonMatchesEmptyVm {
  state: 'empty';
  data: SeasonMatches;
}

type SeasonMatchesVm =
  | SeasonMatchesReadyVm
  | SeasonMatchesEmptyVm
  | { state: 'loading' }
  | { state: 'season-unavailable' }
  | { state: 'error' };

@Component({
  selector: 'app-season-matches-page',
  imports: [
    AsyncPipe,
    RouterLink,
    PageState,
    SeasonTabs,
    StatusBadge,
    TranslatePipe,
  ],
  templateUrl: './season-matches-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-matches-page.css',
})
export class SeasonMatchesPage {
  private readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seasonMatchesApi = inject(SeasonMatchesApiService);
  private readonly reload$ = new Subject<void>();
  protected readonly formatSeasonBoundaryDate = formatSeasonBoundaryDate;

  protected readonly vm$: Observable<SeasonMatchesVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.route.paramMap.pipe(
        map((params) => params.get('slug')?.trim() || null),
        switchMap((slug) =>
          this.seasonMatchesApi.getMatches(slug).pipe(
            map((result): SeasonMatchesVm => {
              if (result.kind === 'season-unavailable') {
                return { state: 'season-unavailable' };
              }

              if (result.matches.matches.length === 0) {
                return { state: 'empty', data: result.matches };
              }

              return { state: 'ready', data: result.matches };
            }),
            startWith({ state: 'loading' } satisfies SeasonMatchesVm),
            catchError(() => of({ state: 'error' } satisfies SeasonMatchesVm))
          )
        )
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected goBack(): void {
    this.router.navigate(['/seasons']);
  }

  protected seasonCoverStyle(url?: string | null): string {
    if (!url) {
      return 'none';
    }
    return `url("${url}")`;
  }

  protected formatDate(value?: string | null, includeTime = true): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected readonly seasonStatusLabel = seasonStatusLabel;

  protected seasonStatusTone(status?: string | null): StatusBadgeVariant {
    if (status === 'active') {
      return 'active';
    }

    if (status === 'closed') {
      return 'closed';
    }

    return 'neutral';
  }
}
