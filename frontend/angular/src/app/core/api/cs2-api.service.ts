import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { cs2ApiPaths } from '../config/api-paths';
import { HealthDto } from './dto/health.dto';
import { MapsDto } from './dto/maps.dto';
import { MatchesDto } from './dto/matches.dto';
import { RankingDto } from './dto/ranking.dto';
import { MapDetailDto } from './dto/map-detail.dto';
import { MatchDetailDto } from './dto/match-detail.dto';

@Injectable({
  providedIn: 'root',
})
export class Cs2ApiService {
  private readonly http = inject(HttpClient);

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

  getMatch(id: number | string): Observable<MatchDetailDto> {
    return this.http.get<MatchDetailDto>(cs2ApiPaths.match(id));
  }
}
