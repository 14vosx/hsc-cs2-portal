import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  catchError,
  concat,
  EMPTY,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { LocaleService } from '../../core/i18n/locale.service';
import type {
  PlayerPresentationReferences,
} from '../../core/player-presentation/player-presentation-reference.model';
import { PlayerPresentationReferenceService } from '../../core/player-presentation/player-presentation-reference.service';
import { PlayerSessionService } from '../../core/session/player-session.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageState } from '../../shared/components/page-state/page-state';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { PlayerLink } from '../../shared/components/player-link/player-link';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { RankingApiService } from './data-access/ranking-api.service';
import type { RankingPlayer } from './domain/ranking.model';

interface RankingReadyVm {
  state: 'ready';
  generatedAt: string | null;
  completedMaps: number;
  players: readonly RankingPlayer[];
  rankedPlayerCount: number;
  leader: RankingPlayer | null;
  podium: readonly RankingPlayer[];
  presentationReferences: PlayerPresentationReferences;
}

type RankingVm =
  | RankingReadyVm
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'empty' };

@Component({
  selector: 'app-ranking-page',
  imports: [
    AsyncPipe,
    EmptyState,
    PageState,
    PlayerAvatar,
    PlayerLink,
    StatusBadge,
    TranslatePipe,
  ],
  templateUrl: './ranking-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './ranking-page.css',
})
export class RankingPage {
  private readonly localeService = inject(LocaleService);
  private readonly rankingApi = inject(RankingApiService);
  private readonly playerPresentation = inject(PlayerPresentationReferenceService);
  private readonly reload$ = new Subject<void>();
  protected readonly playerSession = inject(PlayerSessionService);

  protected readonly searchTerm = signal('');

  protected readonly vm$: Observable<RankingVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.rankingApi.getRanking().pipe(
        switchMap((ranking): Observable<RankingVm> => {
          if (ranking.players.length === 0) {
            return of({ state: 'empty' });
          }

          const ready: RankingReadyVm = {
            state: 'ready',
            generatedAt: ranking.generatedAt,
            completedMaps: ranking.completedMaps,
            players: ranking.players,
            rankedPlayerCount: ranking.rankedPlayerCount,
            leader: ranking.leader,
            podium: ranking.players.slice(0, 3),
            presentationReferences: new Map(),
          };

          return concat(
            of(ready),
            this.playerPresentation.resolve(ranking.players.map((player) => player.steamId64)).pipe(
              map((presentationReferences): RankingVm => ({ ...ready, presentationReferences })),
              catchError(() => EMPTY),
            ),
          );
        }),
        startWith({ state: 'loading' } satisfies RankingVm),
        catchError(() => of({ state: 'error' } satisfies RankingVm)),
      ),
    ),
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected filteredPlayers(
    players: readonly RankingPlayer[],
    references: PlayerPresentationReferences = new Map(),
  ): readonly RankingPlayer[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return players;
    }

    return players.filter((player) => {
      return (
        (player.name ?? '').toLowerCase().includes(term) ||
        (references.get(player.steamId64)?.steam.personaname ?? '').toLowerCase().includes(term) ||
        player.steamId64.toLowerCase().includes(term)
      );
    });
  }

  protected displayNameFor(
    player: RankingPlayer,
    references: PlayerPresentationReferences,
  ): string | null {
    return references.get(player.steamId64)?.steam.personaname ?? player.name;
  }

  protected profileSlugFor(
    player: RankingPlayer,
    references: PlayerPresentationReferences,
  ): string | null {
    return references.get(player.steamId64)?.profile?.slug ?? null;
  }

  protected isCurrentPlayer(player: RankingPlayer): boolean {
    const session = this.playerSession.state();

    return (
      session.status === 'authenticated' &&
      session.steamId64 !== null &&
      player.steamId64 === session.steamId64
    );
  }

  protected avatarUrlFor(
    player: RankingPlayer,
    references: PlayerPresentationReferences = new Map(),
  ): string | null {
    const presentationAvatar = references.get(player.steamId64)?.steam.avatarMediumUrl;
    if (presentationAvatar) return presentationAvatar;

    const session = this.playerSession.state();

    return (
      session.status === 'authenticated' &&
      session.steamId64 !== null &&
      player.steamId64 === session.steamId64
        ? session.avatarMedium
        : null
    );
  }

  protected formatDate(value?: string | null): string | null {
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected formatNumber(value: number, digits = 1): string {
    return value.toFixed(digits);
  }

  protected formatPct(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  protected formatRateAsPct(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}
