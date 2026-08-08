import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { UiCard } from '../../../shared/components/card/card';
import { MetricCard } from '../../../shared/components/metric-card/metric-card';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PageState } from '../../../shared/components/page-state/page-state';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { MatchesApiService } from '../data-access/matches-api.service';
import type { MatchDetail, MatchDetailMap, MatchHeader } from '../domain/match.model';
import { MatchPlayerTable } from '../match-player-table/match-player-table';

interface MatchDetailReadyVm {
  state: 'ready';
  detail: MatchDetail;
}

type MatchDetailVm =
  | MatchDetailReadyVm
  | { state: 'loading' }
  | { state: 'not-found' }
  | { state: 'error' };

@Component({
  selector: 'app-match-detail-page',
  imports: [
    AsyncPipe,
    RouterLink,
    MetricCard,
    PageHeader,
    PageState,
    SectionHeader,
    StatusBadge,
    UiCard,
    MatchPlayerTable,
  ],
  templateUrl: './match-detail-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './match-detail-page.css',
})
export class MatchDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly vm$: Observable<MatchDetailVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.route.paramMap.pipe(
        map((params) => params.get('matchId') ?? ''),
        switchMap((matchIdRaw) => {
          const trimmed = matchIdRaw.trim();
          if (!trimmed || !/^\d+$/.test(trimmed)) {
            return of({ state: 'not-found' } satisfies MatchDetailVm);
          }

          const matchId = Number(trimmed);
          if (!Number.isInteger(matchId) || matchId <= 0) {
            return of({ state: 'not-found' } satisfies MatchDetailVm);
          }

          return this.matchesApi.getMatch(matchId).pipe(
            map((detail) => ({ state: 'ready', detail }) satisfies MatchDetailVm),
            startWith({ state: 'loading' } satisfies MatchDetailVm),
            catchError((err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                return of({ state: 'not-found' } satisfies MatchDetailVm);
              }
              return of({ state: 'error' } satisfies MatchDetailVm);
            })
          );
        })
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected goBack(): void {
    this.router.navigate(['/matches']);
  }

  protected matchTitle(detail: MatchDetail): string {
    const t1 = detail.match.team1.name || 'Time não informado';
    const t2 = detail.match.team2.name || 'Time não informado';
    return `${t1} vs ${t2}`;
  }

  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Sem data disponível';
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

  protected formatSeriesScore(header: MatchHeader): string {
    const t1 = header.team1.score;
    const t2 = header.team2.score;
    if (t1 !== null && t2 !== null) {
      return `${t1} x ${t2}`;
    }
    return '— x —';
  }

  protected formatMapScore(mapDetail: MatchDetailMap): string {
    const t1 = mapDetail.team1Score;
    const t2 = mapDetail.team2Score;
    if (t1 !== null && t2 !== null) {
      return `${t1} x ${t2}`;
    }
    return '— x —';
  }

  protected winnerLabel(value?: string | null): string {
    return value || 'Sem vencedor';
  }

  protected isWinner(winner: string | null, teamName: string | null): boolean {
    if (!winner || !teamName) {
      return false;
    }
    return winner === teamName;
  }

  protected roundCount(mapDetail: MatchDetailMap): number {
    if (mapDetail.team1Score !== null && mapDetail.team2Score !== null) {
      return mapDetail.team1Score + mapDetail.team2Score;
    }
    return 0;
  }

  protected limitations(detail: MatchDetail): readonly string[] {
    return detail.limitations ?? [];
  }
}