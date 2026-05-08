import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  SeasonMatchesDto,
  SeasonMatchMapDto,
  SeasonMatchSummaryDto,
} from '../../../core/api/dto/season-matches.dto';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { formatInteger, seasonCoverImage } from '../season-ui';

type SeasonMatchesVm =
  | ({ state: 'ready'; isCurrent: boolean; matches: SeasonMatchSummaryDto[] } & SeasonMatchesDto)
  | { state: 'loading' }
  | { state: 'error' };

@Component({
  selector: 'app-season-matches-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './season-matches-page.html',
  styleUrl: './season-matches-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class SeasonMatchesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly formatInteger = formatInteger;
  protected readonly seasonCoverImage = seasonCoverImage;

  protected readonly vm$: Observable<SeasonMatchesVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => this.loadSeasonMatches(slug)),
    startWith({ state: 'loading' } satisfies SeasonMatchesVm),
    catchError(() => of({ state: 'error' } satisfies SeasonMatchesVm)),
  );

  protected formatDate(value?: string | null, includeTime = true): string {
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
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected tabLink(
    isCurrent: boolean,
    slug: string | undefined,
    target: 'overview' | 'ranking' | 'matches' | 'maps',
  ): string {
    const base = isCurrent || !slug ? '/seasons/current' : `/seasons/${slug}`;

    return target === 'overview' ? base : `${base}/${target}`;
  }

  protected matchEndedAt(match: SeasonMatchSummaryDto): string | undefined {
    return match.seasonLastMapEndedAt || match.end_time || match.start_time;
  }

  protected firstMapStartedAt(match: SeasonMatchSummaryDto): string | undefined {
    return match.seasonFirstMapStartedAt || match.start_time;
  }

  protected formatSeriesScore(match: SeasonMatchSummaryDto): string {
    return `${match.team1_score} x ${match.team2_score}`;
  }

  protected winnerLabel(match: SeasonMatchSummaryDto): string {
    return match.winner || 'Sem vencedor';
  }

  protected winnerSide(match: SeasonMatchSummaryDto): 'team1' | 'team2' | 'unknown' {
    if (match.winner === match.team1_name) {
      return 'team1';
    }

    if (match.winner === match.team2_name) {
      return 'team2';
    }

    return 'unknown';
  }

  protected mapRounds(mapSummary: SeasonMatchMapDto): string {
    return formatInteger(mapSummary.rounds);
  }

  protected mapScore(mapSummary: SeasonMatchMapDto): string {
    const team1Score = mapSummary.team1_score;
    const team2Score = mapSummary.team2_score;

    if (typeof team1Score !== 'number' || typeof team2Score !== 'number') {
      return '-';
    }

    return `${team1Score} x ${team2Score}`;
  }

  private loadSeasonMatches(slug: string): Observable<SeasonMatchesVm> {
    if (slug) {
      return this.cs2Api.getSeasonMatches(slug).pipe(
        map((payload): SeasonMatchesVm => ({
          ...payload,
          matches: this.sortedMatches(payload.matches),
          state: 'ready',
          isCurrent: false,
        })),
      );
    }

    return this.cs2Api.getSeasons().pipe(
      switchMap((index) => {
        const activeSeasonSlug = index.activeSeasonSlug?.trim();

        if (!activeSeasonSlug) {
          return of({ state: 'error' } satisfies SeasonMatchesVm);
        }

        return this.cs2Api.getSeasonMatches(activeSeasonSlug).pipe(
          map((payload): SeasonMatchesVm => ({
            ...payload,
            matches: this.sortedMatches(payload.matches),
            state: 'ready',
            isCurrent: true,
          })),
        );
      }),
    );
  }

  private sortedMatches(matches?: SeasonMatchSummaryDto[]): SeasonMatchSummaryDto[] {
    return [...(matches ?? [])].sort((current, next) => {
      const nextTime = this.matchTimestamp(next);
      const currentTime = this.matchTimestamp(current);

      if (nextTime !== currentTime) {
        return nextTime - currentTime;
      }

      return next.matchid - current.matchid;
    });
  }

  private matchTimestamp(match: SeasonMatchSummaryDto): number {
    const timestamp = new Date(
      match.seasonLastMapEndedAt || match.end_time || match.seasonFirstMapStartedAt || match.start_time,
    ).getTime();

    if (Number.isNaN(timestamp)) {
      return match.matchid;
    }

    return timestamp;
  }
}
