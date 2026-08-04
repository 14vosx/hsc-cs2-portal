import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MapSummaryDto } from '../../core/api/dto/maps.dto';
import { MatchMapDto, MatchSummaryDto } from '../../core/api/dto/matches.dto';
import { NewsIndexDto, NewsIndexItemDto } from '../../core/api/dto/news.dto';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { OverviewSeasonMetricsService } from './data-access/overview-season-metrics.service';
import {
  OverviewSeasonLeader,
  OverviewSeasonMetrics,
} from './domain/overview-season-metrics.model';

interface OverviewHero {
  kind: 'news' | 'season';
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  ctaLabel: string;
  routerLink?: string;
}

interface OverviewReadyVm {
  state: 'ready';
  hero: OverviewHero;
  newsItems: NewsIndexItemDto[];
  playersCount: number | '—';
  matchesCount: number | '—';
  mapsCount: number | '—';
  seasonMetrics: OverviewSeasonMetrics | null;
  leader?: OverviewSeasonLeader;
  latestMatch?: MatchSummaryDto;
  mostPlayedMaps: MapSummaryDto[];
}

type OverviewVm = OverviewReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-overview-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './overview-page.html',
  styleUrls: [
    './overview-page.css',
    './overview-page-content.css',
    './overview-page-responsive.css',
  ],
})
export class OverviewPage {
  private readonly cs2Api = inject(Cs2ApiService);
  private readonly overviewSeasonMetrics = inject(OverviewSeasonMetricsService);
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

  protected readonly vm$: Observable<OverviewVm> = forkJoin({
    health: this.cs2Api.getHealth(),
    matches: this.cs2Api.getMatches(),
    maps: this.cs2Api.getMaps(),
    news: this.cs2Api
      .getNewsIndex()
      .pipe(catchError(() => of({ items: [] } satisfies NewsIndexDto))),
    seasonMetrics: this.overviewSeasonMetrics.getOverviewSeasonMetrics(),
  }).pipe(
    map(({ matches, maps, news, seasonMetrics }): OverviewVm => {
      const latestMatch = [...matches.matches].sort((current, next) => {
        const nextTime = this.matchTimestamp(next);
        const currentTime = this.matchTimestamp(current);

        if (nextTime !== currentTime) {
          return nextTime - currentTime;
        }

        return next.matchid - current.matchid;
      })[0];
      const leader = seasonMetrics?.leader ?? undefined;
      const newsItems = this.sortedNewsItems(news.items);
      const mostPlayedMaps = this.mostPlayedMaps(maps.maps);

      return {
        state: 'ready',
        hero: this.buildHero(newsItems, seasonMetrics),
        newsItems: newsItems.slice(0, 4),
        playersCount: seasonMetrics ? seasonMetrics.playersCount : '—',
        matchesCount: seasonMetrics ? seasonMetrics.matchesCount : '—',
        mapsCount: seasonMetrics ? seasonMetrics.mapsCount : '—',
        seasonMetrics,
        leader,
        latestMatch,
        mostPlayedMaps,
      };
    }),
    startWith({ state: 'loading' } satisfies OverviewVm),
    catchError(() => of({ state: 'error' } satisfies OverviewVm)),
  );

  protected seasonContextLabel(seasonMetrics: OverviewSeasonMetrics | null): string {
    if (!seasonMetrics) {
      return 'Sem temporada pública';
    }

    if (seasonMetrics.contextMode === 'active') {
      return `Temporada ativa · ${seasonMetrics.seasonName}`;
    }

    return `Última temporada encerrada · ${seasonMetrics.seasonName}`;
  }

  protected leaderEyebrow(seasonMetrics: OverviewSeasonMetrics | null): string {
    if (seasonMetrics?.contextMode === 'latest-closed') {
      return 'Líder final';
    }
    return 'Líder atual';
  }

  protected leaderCardTitle(seasonMetrics: OverviewSeasonMetrics | null): string {
    if (seasonMetrics?.contextMode === 'latest-closed') {
      return 'Líder da temporada encerrada';
    }
    return 'Líder da temporada';
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

  protected formatScore(match: MatchSummaryDto): string {
    return `${match.team1_score} x ${match.team2_score}`;
  }

  protected matchWinner(match: MatchSummaryDto): string {
    return match.winner ? `Vencedor: ${match.winner}` : 'Resultado registrado';
  }

  protected playerMeta(player: OverviewSeasonLeader): string {
    return `${player.wins}V ${player.losses}D | K/D ${player.kdRatio.toFixed(2)}`;
  }

  protected mapLabel(map: MapSummaryDto): string {
    return map.map.replace(/^de_/, '').toUpperCase();
  }

  protected primaryMap(match: MatchSummaryDto): MatchMapDto | undefined {
    return match.maps[0];
  }

  protected primaryMapName(match: MatchSummaryDto): string {
    return this.primaryMap(match)?.mapname || 'Mapa não informado';
  }

  protected mapBackgroundImage(match?: MatchSummaryDto): string {
    const mapName = match ? this.primaryMap(match)?.mapname : undefined;

    if (!mapName || !this.knownMapImages.has(mapName)) {
      return 'none';
    }

    return `url("map-images/${mapName}.png")`;
  }

  protected mapSummaryBackgroundImage(map: MapSummaryDto): string {
    if (!this.knownMapImages.has(map.map)) {
      return 'none';
    }

    return `url("map-images/${map.map}.png")`;
  }

  protected formatPrimaryScore(match: MatchSummaryDto): string {
    const map = this.primaryMap(match);

    if (map) {
      return `${map.team1_score} x ${map.team2_score}`;
    }

    return this.formatScore(match);
  }

  protected matchEndedAt(match: MatchSummaryDto): string {
    return match.end_time || match.start_time;
  }

  protected winnerLabel(match: MatchSummaryDto): string {
    return match.winner || 'Sem vencedor';
  }

  protected winnerSide(match: MatchSummaryDto): 'team1' | 'team2' | 'unknown' {
    if (match.winner === match.team1_name) {
      return 'team1';
    }

    if (match.winner === match.team2_name) {
      return 'team2';
    }

    return 'unknown';
  }

  protected newsHref(item: NewsIndexItemDto): string {
    return item.slug ? `/news/${item.slug}` : '/news';
  }

  private buildHero(
    newsItems: NewsIndexItemDto[],
    seasonMetrics: OverviewSeasonMetrics | null,
  ): OverviewHero {
    const latestNews = newsItems[0];

    if (latestNews?.title) {
      return {
        kind: 'news',
        eyebrow: 'Última mensagem',
        title: latestNews.title,
        description:
          latestNews.excerpt?.trim() || 'Nova publicação da comunidade HSC.',
        meta: latestNews.published_at
          ? `Publicado em ${this.formatDate(latestNews.published_at)}`
          : 'News HSC',
        ctaLabel: 'Ler notícia',
        routerLink: latestNews.slug ? `/news/${latestNews.slug}` : '/news',
      };
    }

    if (!seasonMetrics) {
      return {
        kind: 'season',
        eyebrow: 'Competitivo HSC',
        title: 'Temporada CS2 do clube',
        description:
          'Ranking, partidas e mapas do Counter-Strike HSC em uma entrada única para a comunidade.',
        meta: 'Sem data disponível',
        ctaLabel: 'Ver temporadas',
        routerLink: '/seasons',
      };
    }

    const isClosed = seasonMetrics.contextMode === 'latest-closed';
    const eyebrow = isClosed ? 'Temporada encerrada' : 'Competitivo HSC';
    const title = seasonMetrics.seasonName;
    const metaDate = this.formatDate(seasonMetrics.generatedAt);
    const meta =
      metaDate !== 'Sem data disponível'
        ? `Atualizado em ${metaDate}`
        : 'Sem data disponível';
    const ctaLabel = 'Ver ranking';
    const routerLink = `/seasons/${seasonMetrics.seasonSlug}/ranking`;

    const description = seasonMetrics.leader
      ? `${seasonMetrics.leader.name} lidera a classificação do competitivo HSC.`
      : isClosed
        ? 'Classificação final da temporada encerrada no clube.'
        : 'Classificação competitiva do clube em andamento.';

    return {
      kind: 'season',
      eyebrow,
      title,
      description,
      meta,
      ctaLabel,
      routerLink,
    };
  }

  private sortedNewsItems(items?: NewsIndexItemDto[]): NewsIndexItemDto[] {
    return (items ?? []).filter((item) => item.title?.trim()).sort((current, next) => {
      const nextTime = new Date(next.published_at ?? '').getTime();
      const currentTime = new Date(current.published_at ?? '').getTime();

      if (Number.isNaN(nextTime) && Number.isNaN(currentTime)) {
        return 0;
      }

      if (Number.isNaN(nextTime)) {
        return 1;
      }

      if (Number.isNaN(currentTime)) {
        return -1;
      }

      return nextTime - currentTime;
    });
  }

  private mostPlayedMaps(maps: MapSummaryDto[]): MapSummaryDto[] {
    return [...maps]
      .sort((current, next) => {
        if (next.matches !== current.matches) {
          return next.matches - current.matches;
        }

        return next.rounds - current.rounds;
      })
      .slice(0, 3);
  }

  private matchTimestamp(match: MatchSummaryDto): number {
    const timestamp = new Date(match.end_time || match.start_time).getTime();

    if (Number.isNaN(timestamp)) {
      return match.matchid;
    }

    return timestamp;
  }
}
