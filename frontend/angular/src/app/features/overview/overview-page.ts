import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MapSummaryDto } from '../../core/api/dto/maps.dto';
import { MatchMapDto, MatchSummaryDto } from '../../core/api/dto/matches.dto';
import { NewsIndexDto, NewsIndexItemDto } from '../../core/api/dto/news.dto';
import { RankingPlayerDto } from '../../core/api/dto/ranking.dto';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

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
  playersCount: number;
  matchesCount: number;
  mapsCount: number;
  leader?: RankingPlayerDto;
  latestMatch?: MatchSummaryDto;
  mostPlayedMaps: MapSummaryDto[];
}

type OverviewVm = OverviewReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-overview-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.css',
})
export class OverviewPage {
  private readonly cs2Api = inject(Cs2ApiService);
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
    ranking: this.cs2Api.getRanking(),
    matches: this.cs2Api.getMatches(),
    maps: this.cs2Api.getMaps(),
    news: this.cs2Api
      .getNewsIndex()
      .pipe(catchError(() => of({ items: [] } satisfies NewsIndexDto))),
  }).pipe(
    map(({ health, ranking, matches, maps, news }): OverviewVm => {
      const latestMatch = [...matches.matches].sort((current, next) => {
        const nextTime = this.matchTimestamp(next);
        const currentTime = this.matchTimestamp(current);

        if (nextTime !== currentTime) {
          return nextTime - currentTime;
        }

        return next.matchid - current.matchid;
      })[0];
      const leader = ranking.players[0];
      const newsItems = this.sortedNewsItems(news.items);
      const mostPlayedMaps = this.mostPlayedMaps(maps.maps);

      return {
        state: 'ready',
        hero: this.buildHero(
          newsItems,
          health.generatedAt || ranking.generatedAt,
          leader,
          latestMatch,
          mostPlayedMaps[0],
        ),
        newsItems: newsItems.slice(0, 4),
        playersCount: ranking.players.length,
        matchesCount: matches.matches.length,
        mapsCount: maps.maps.length,
        leader,
        latestMatch,
        mostPlayedMaps,
      };
    }),
    startWith({ state: 'loading' } satisfies OverviewVm),
    catchError(() => of({ state: 'error' } satisfies OverviewVm)),
  );

  protected formatDate(value?: string): string {
    if (!value) {
      return 'Sem data disponivel';
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

  protected playerMeta(player: RankingPlayerDto): string {
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

    return `url("maps/${mapName}.png")`;
  }

  protected mapSummaryBackgroundImage(map: MapSummaryDto): string {
    if (!this.knownMapImages.has(map.map)) {
      return 'none';
    }

    return `url("maps/${map.map}.png")`;
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
    generatedAt: string,
    leader?: RankingPlayerDto,
    latestMatch?: MatchSummaryDto,
    mostPlayedMap?: MapSummaryDto,
  ): OverviewHero {
    const latestNews = newsItems[0];

    if (latestNews?.title) {
      return {
        kind: 'news',
        eyebrow: 'Última mensagem',
        title: latestNews.title,
        description: latestNews.excerpt?.trim() || 'Nova publicação da comunidade HSC.',
        meta: latestNews.published_at
          ? `Publicado em ${this.formatDate(latestNews.published_at)}`
          : 'News HSC',
        ctaLabel: 'Ler notícia',
        routerLink: latestNews.slug ? `/news/${latestNews.slug}` : '/news',
      };
    }

    const details = [
      leader ? `${leader.name} lidera a classificação` : undefined,
      latestMatch ? `última partida #${latestMatch.matchid}` : undefined,
      mostPlayedMap ? `${this.mapLabel(mostPlayedMap)} em rotação` : undefined,
    ].filter(Boolean);

    return {
      kind: 'season',
      eyebrow: 'Competitivo HSC',
      title: 'Temporada CS2 do clube',
      description:
        details.join(', ') ||
        'Ranking, partidas e mapas do Counter-Strike HSC em uma entrada única para a comunidade.',
      meta: `Atualizado em ${this.formatDate(generatedAt)}`,
      ctaLabel: 'Ver ranking',
      routerLink: '/ranking',
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
