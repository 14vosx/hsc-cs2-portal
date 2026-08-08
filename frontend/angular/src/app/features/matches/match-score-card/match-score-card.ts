import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MatchMapSummary, MatchSummary } from '../domain/match.model';

@Component({
  selector: 'app-match-score-card',
  imports: [RouterLink],
  templateUrl: './match-score-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './match-score-card.css',
})
export class MatchScoreCard {
  readonly match = input.required<MatchSummary>();
  readonly highlight = input<boolean>(false);
  readonly ctaText = input<string>('Ver relatório e destaques →');

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

  protected primaryMap(): MatchMapSummary | undefined {
    return this.match().maps[0];
  }

  protected primaryMapName(): string {
    return this.primaryMap()?.name || 'Mapa não informado';
  }

  protected primaryScore(): string {
    const map = this.primaryMap();
    if (map && map.team1Score !== null && map.team2Score !== null) {
      return `${map.team1Score} x ${map.team2Score}`;
    }
    return this.seriesScore();
  }

  protected seriesScore(): string {
    const t1 = this.match().team1.score;
    const t2 = this.match().team2.score;
    if (t1 !== null && t2 !== null) {
      return `${t1} x ${t2}`;
    }
    return '— x —';
  }

  protected team1Name(): string {
    return this.match().team1.name || 'Time não informado';
  }

  protected team2Name(): string {
    return this.match().team2.name || 'Time não informado';
  }

  protected winnerLabel(): string {
    return this.match().winner || 'Sem vencedor';
  }

  protected winnerSide(): 'team1' | 'team2' | 'unknown' {
    const winner = this.match().winner;
    if (!winner) {
      return 'unknown';
    }
    if (this.match().team1.name && winner === this.match().team1.name) {
      return 'team1';
    }
    if (this.match().team2.name && winner === this.match().team2.name) {
      return 'team2';
    }
    return 'unknown';
  }

  protected seriesTypeLabel(): string {
    return this.match().seriesType || 'Série não informada';
  }

  protected endedAtLabel(): string {
    const dateVal = this.match().endedAt || this.match().startedAt;
    if (!dateVal) {
      return 'Sem data';
    }
    const date = new Date(dateVal);
    if (Number.isNaN(date.getTime())) {
      return dateVal;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected isSeriesMatch(): boolean {
    const m = this.match();
    if (m.maps.length > 1) {
      return true;
    }
    if (m.seriesType && m.seriesType.toUpperCase() !== 'BO1') {
      return true;
    }
    return false;
  }

  protected mapBackgroundImage(): string {
    const mapName = this.primaryMap()?.name;
    if (!mapName || !this.knownMapImages.has(mapName)) {
      return 'none';
    }
    return `url("map-images/${mapName}.png")`;
  }
}
