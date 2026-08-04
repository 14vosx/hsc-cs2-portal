import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  SeasonRankingDto,
  SeasonRankingPlayerDto,
} from '../../../core/api/dto/season-ranking.dto';
import { resolveSeasonContext, SeasonContext } from '../../seasons/season-context';
import {
  OverviewSeasonLeader,
  OverviewSeasonMetrics,
} from '../domain/overview-season-metrics.model';

@Injectable({ providedIn: 'root' })
export class OverviewSeasonMetricsService {
  private readonly cs2Api = inject(Cs2ApiService);

  getOverviewSeasonMetrics(): Observable<OverviewSeasonMetrics | null> {
    return this.cs2Api.getSeasons().pipe(
      switchMap((seasonsIndex) => {
        const context = resolveSeasonContext(seasonsIndex);
        if (!context) {
          return of(null);
        }

        return this.cs2Api
          .getSeasonRanking(context.slug)
          .pipe(map((rankingDto) => this.mapToMetrics(context, rankingDto)));
      }),
    );
  }

  private mapToMetrics(
    context: SeasonContext,
    rankingDto: SeasonRankingDto,
  ): OverviewSeasonMetrics {
    const summary = rankingDto?.summary;

    const seasonSlug = context.slug;
    const seasonName =
      getValidNonEmptyString(context.season?.name) ??
      getValidNonEmptyString(rankingDto?.season?.name) ??
      context.slug;
    const contextMode = context.mode;
    const generatedAt = getValidNonEmptyString(rankingDto?.generatedAt);

    const playersCount = safeNonNegativeInteger(summary?.players);
    const matchesCount = safeNonNegativeInteger(summary?.matches);
    const mapsCount = safeNonNegativeInteger(summary?.maps);
    const roundsCount = safeNonNegativeInteger(summary?.rounds);

    const leader = this.extractLeader(rankingDto?.players);

    return {
      seasonSlug,
      seasonName,
      contextMode,
      generatedAt,
      playersCount,
      matchesCount,
      mapsCount,
      roundsCount,
      leader,
    };
  }

  private extractLeader(
    players?: SeasonRankingPlayerDto[] | null,
  ): OverviewSeasonLeader | null {
    if (!Array.isArray(players) || players.length === 0) {
      return null;
    }

    const firstValidPlayer = players.find((p) => {
      if (!p || typeof p !== 'object') {
        return false;
      }
      const steamId = getValidNonEmptyString(p.steamid64);
      const name = getValidNonEmptyString(p.name);
      return Boolean(steamId && /^\d{17}$/.test(steamId) && name);
    });

    if (!firstValidPlayer) {
      return null;
    }

    const position = safePositiveInteger(firstValidPlayer.rank, 1);
    const steamId64 = getValidNonEmptyString(firstValidPlayer.steamid64)!;
    const name = getValidNonEmptyString(firstValidPlayer.name)!;
    const score = safeNumber(firstValidPlayer.score, 0);
    const wins = safeNonNegativeInteger(firstValidPlayer.wins);
    const losses = safeNonNegativeInteger(firstValidPlayer.losses);
    const kdRatio = safeNonNegativeNumber(firstValidPlayer.kdRatio);

    return {
      position,
      steamId64,
      name,
      score,
      wins,
      losses,
      kdRatio,
    };
  }
}

function getValidNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function safeNonNegativeNumber(value: unknown, fallback = 0): number {
  const num = safeNumber(value, fallback);
  return num >= 0 ? num : fallback;
}

function safeNonNegativeInteger(value: unknown, fallback = 0): number {
  const num = safeNonNegativeNumber(value, fallback);
  return Math.floor(num);
}

function safePositiveInteger(value: unknown, fallback = 1): number {
  const num = safeNumber(value, fallback);
  return num > 0 ? Math.floor(num) : fallback;
}
