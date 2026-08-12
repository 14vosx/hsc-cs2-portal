import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageState } from '../../../shared/components/page-state/page-state';
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
  imports: [AsyncPipe, MatchPlayerTable, PageState, RouterLink],
  templateUrl: './match-detail-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './match-detail-page.css',
})
export class MatchDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly reload$ = new Subject<void>();
  private readonly knownMapImages = new Set([
    'de_ancient',
    'de_anubis',
    'de_dust2',
    'de_inferno',
    'de_mirage',
    'de_nuke',
    'de_overpass',
    'de_train',
  ]);

  protected readonly selectedMapIndex = signal(0);

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

          this.selectedMapIndex.set(0);
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

  protected selectMap(index: number): void {
    this.selectedMapIndex.set(index);
  }

  protected selectedMap(detail: MatchDetail): MatchDetailMap | undefined {
    return detail.maps[this.selectedMapIndex()];
  }

  protected teamName(name: string | null): string {
    return name || 'Time não informado';
  }

  protected scoreLabel(score: number | null): number | string {
    return score ?? '—';
  }

  protected mapName(mapDetail: MatchDetailMap): string {
    return mapDetail.name || 'Mapa sem nome';
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
    return `${this.scoreLabel(header.team1.score)} × ${this.scoreLabel(header.team2.score)}`;
  }

  protected formatMapScore(mapDetail: MatchDetailMap): string {
    return `${this.scoreLabel(mapDetail.team1Score)}–${this.scoreLabel(mapDetail.team2Score)}`;
  }

  protected winnerLabel(value?: string | null): string {
    return value || 'Sem vencedor';
  }

  protected isWinner(winner: string | null, teamName: string | null): boolean {
    return Boolean(winner && teamName && winner === teamName);
  }

  protected roundCount(mapDetail: MatchDetailMap): number {
    if (mapDetail.team1Score !== null && mapDetail.team2Score !== null) {
      return mapDetail.team1Score + mapDetail.team2Score;
    }
    return 0;
  }

  protected mapBackgroundImage(mapDetail?: MatchDetailMap): string {
    const name = mapDetail?.name;
    return name && this.knownMapImages.has(name) ? `url("map-images/${name}.png")` : 'none';
  }
}
