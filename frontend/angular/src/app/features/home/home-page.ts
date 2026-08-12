import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, shareReplay } from 'rxjs';

import { PlayerSessionService } from '../../core/session/player-session.service';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { HomeApiService } from './data-access/home-api.service';
import type {
  HomeNewsState,
  HomeRecentMatch,
  HomeRecentMatchesState,
  HomeSeasonContextMode,
  HomeSeasonState,
} from './domain/home-season.model';

@Component({
  selector: 'app-home-page',
  imports: [AsyncPipe, DecimalPipe, RouterLink, TranslatePipe, PlayerAvatar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomePage {
  private readonly homeApi = inject(HomeApiService);
  protected readonly playerSession = inject(PlayerSessionService);

  protected readonly seasonState$: Observable<HomeSeasonState> = this.homeApi
    .getHomeSeasonMetrics()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly matchesState$: Observable<HomeRecentMatchesState> = this.homeApi
    .getRecentMatches()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly newsState$: Observable<HomeNewsState> = this.homeApi
    .getHomeNews()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected seasonOverviewLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current' : `/seasons/${seasonSlug}`;
  }

  protected seasonRankingLink(seasonSlug: string, contextMode: HomeSeasonContextMode): string {
    return contextMode === 'active' ? '/seasons/current/ranking' : `/seasons/${seasonSlug}/ranking`;
  }

  protected formatDate(value: string | null): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} · ${hours}:${minutes} UTC`;
  }

  protected matchDate(match: HomeRecentMatch): string | null {
    return this.formatDate(match.seasonLastMapEndedAt);
  }

  protected mapLabel(match: HomeRecentMatch): string | null {
    const maps = match.maps.map((map) => {
      return `${map.name} ${map.team1Score}–${map.team2Score}`;
    });
    return maps.length > 0 ? maps.join(' · ') : null;
  }

  protected playerAreaLabelKey(): string {
    switch (this.playerSession.state().status) {
      case 'authenticated':
        return 'home.playerArea.actions.open';
      case 'anonymous':
      case 'unavailable':
        return 'home.playerArea.actions.signIn';
      default:
        return 'home.playerArea.actions.fallback';
    }
  }
}
