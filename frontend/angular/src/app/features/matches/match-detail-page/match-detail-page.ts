import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  MatchDetailDto,
  MatchDetailMapDto,
  MatchDetailPlayerDto,
} from '../../../core/api/dto/match-detail.dto';
import { DataCard } from '../../../shared/components/data-card/data-card';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

interface MatchDetailReadyVm {
  state: 'ready';
  detail: MatchDetailDto;
}

type MatchDetailVm = MatchDetailReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-match-detail-page',
  imports: [AsyncPipe, RouterLink, DataCard, EmptyState, MetricCard, SectionHeader, StatusBadge],
  templateUrl: './match-detail-page.html',
  styleUrl: './match-detail-page.css',
})
export class MatchDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<MatchDetailVm> = this.route.paramMap.pipe(
    map((params) => params.get('matchId') ?? ''),
    switchMap((matchId) => {
      if (!matchId) {
        return of({ state: 'error' } satisfies MatchDetailVm);
      }

      return this.cs2Api.getMatch(matchId).pipe(
        map((detail) => ({ state: 'ready', detail }) satisfies MatchDetailVm),
        startWith({ state: 'loading' } satisfies MatchDetailVm),
        catchError(() => of({ state: 'error' } satisfies MatchDetailVm)),
      );
    }),
  );

  protected matchTitle(detail: MatchDetailDto): string {
    return `${detail.match.team1_name} vs ${detail.match.team2_name}`;
  }

  protected formatDate(value?: string): string {
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

  protected formatSeriesScore(detail: MatchDetailDto): string {
    return `${detail.match.team1_score} x ${detail.match.team2_score}`;
  }

  protected formatMapScore(mapDetail: MatchDetailMapDto): string {
    return `${mapDetail.team1_score} x ${mapDetail.team2_score}`;
  }

  protected winnerLabel(value?: string): string {
    return value || 'Sem vencedor';
  }

  protected isWinner(winner: string, teamName: string): boolean {
    return winner === teamName;
  }

  protected roundCount(mapDetail: MatchDetailMapDto): number {
    return mapDetail.team1_score + mapDetail.team2_score;
  }

  protected formatAdr(player: MatchDetailPlayerDto, mapDetail: MatchDetailMapDto): string {
    const rounds = this.roundCount(mapDetail);

    if (rounds <= 0) {
      return '0.0';
    }

    return (player.damage / rounds).toFixed(1);
  }

  protected formatKd(player: MatchDetailPlayerDto): string {
    if (player.deaths <= 0) {
      return player.kills.toFixed(2);
    }

    return (player.kills / player.deaths).toFixed(2);
  }

  protected formatHeadshotPct(player: MatchDetailPlayerDto): string {
    if (player.kills <= 0) {
      return '0%';
    }

    return `${Math.round((player.head_shot_kills / player.kills) * 100)}%`;
  }

  protected formatEntry(player: MatchDetailPlayerDto): string {
    if (player.entry_count <= 0) {
      return '-';
    }

    return `${player.entry_wins}/${player.entry_count}`;
  }

  protected sortedPlayers(players: MatchDetailPlayerDto[]): MatchDetailPlayerDto[] {
    return [...players].sort((current, next) => {
      if (next.kills !== current.kills) {
        return next.kills - current.kills;
      }

      return next.damage - current.damage;
    });
  }

  protected limitations(detail: MatchDetailDto): string[] {
    return detail.notes?.limitations ?? [];
  }
}