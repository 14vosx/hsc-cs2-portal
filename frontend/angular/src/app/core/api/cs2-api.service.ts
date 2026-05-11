import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { cs2ApiPaths } from '../config/api-paths';
import { HealthDto } from './dto/health.dto';
import { MapsDto } from './dto/maps.dto';
import { MatchesDto } from './dto/matches.dto';
import { NewsDetailDto, NewsIndexDto } from './dto/news.dto';
import { PlayerBunkerSummaryDto, PlayerMeDto } from './dto/player-bunker.dto';
import { RankingDto } from './dto/ranking.dto';
import { MapDetailDto } from './dto/map-detail.dto';
import { MatchDetailDto } from './dto/match-detail.dto';
import { SeasonDetailDto, SeasonsIndexDto } from './dto/season.dto';
import { SeasonMapsDto } from './dto/season-maps.dto';
import { SeasonMatchesDto } from './dto/season-matches.dto';
import { SeasonRankingDto } from './dto/season-ranking.dto';

@Injectable({
  providedIn: 'root',
})
export class Cs2ApiService {
  private readonly http = inject(HttpClient);
  readonly playerAuthSteamStartUrl = cs2ApiPaths.playerAuthSteamStart;

  getHealth(): Observable<HealthDto> {
    return this.http.get<HealthDto>(cs2ApiPaths.health);
  }

  getRanking(): Observable<RankingDto> {
    return this.http.get<RankingDto>(cs2ApiPaths.ranking);
  }

  getMatches(): Observable<MatchesDto> {
    return this.http.get<MatchesDto>(cs2ApiPaths.matches);
  }

  getMaps(): Observable<MapsDto> {
    return this.http.get<MapsDto>(cs2ApiPaths.maps);
  }

  getMap(map: string): Observable<MapDetailDto> {
    return this.http.get<MapDetailDto>(cs2ApiPaths.map(map));
  }

  getSeasons(): Observable<SeasonsIndexDto> {
    return this.http.get<SeasonsIndexDto>(cs2ApiPaths.seasons);
  }

  getSeason(slug: string): Observable<SeasonDetailDto> {
    return this.http.get<SeasonDetailDto>(cs2ApiPaths.season(slug));
  }

  getSeasonRanking(slug: string): Observable<SeasonRankingDto> {
    return this.http.get<SeasonRankingDto>(cs2ApiPaths.seasonRanking(slug));
  }

  getSeasonMatches(slug: string): Observable<SeasonMatchesDto> {
    return this.http.get<SeasonMatchesDto>(cs2ApiPaths.seasonMatches(slug));
  }

  getSeasonMaps(slug: string): Observable<SeasonMapsDto> {
    return this.http.get<SeasonMapsDto>(cs2ApiPaths.seasonMaps(slug));
  }

  getMatch(id: number | string): Observable<MatchDetailDto> {
    return this.http.get<MatchDetailDto>(cs2ApiPaths.match(id));
  }

  getNewsIndex(): Observable<NewsIndexDto> {
    return this.http.get<NewsIndexDto>(cs2ApiPaths.newsIndex);
  }

  getNewsItem(slug: string): Observable<NewsDetailDto> {
    return this.http.get<NewsDetailDto>(cs2ApiPaths.newsItem(slug));
  }

  getPlayerMe(): Observable<PlayerMeDto> {
    return this.http.get<PlayerMeDto>(cs2ApiPaths.playerMe, {
      withCredentials: true,
    });
  }

  getPlayerBunkerSummary(): Observable<PlayerBunkerSummaryDto> {
    return this.http.get<PlayerBunkerSummaryDto>(cs2ApiPaths.playerBunkerSummary, {
      withCredentials: true,
    });
  }

  logoutPlayer(): Observable<unknown> {
    return this.http.post(
      cs2ApiPaths.playerAuthLogout,
      {},
      {
        withCredentials: true,
      },
    );
  }
}
