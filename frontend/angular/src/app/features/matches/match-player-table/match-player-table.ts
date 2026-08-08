import { Component, input, ChangeDetectionStrategy } from '@angular/core';

import type { MatchPlayer } from '../domain/match.model';

@Component({
  selector: 'app-match-player-table',
  templateUrl: './match-player-table.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './match-player-table.css',
})
export class MatchPlayerTable {
  readonly players = input.required<readonly MatchPlayer[]>();
  readonly roundCount = input<number | undefined>(undefined);

  protected sortedPlayers(): readonly MatchPlayer[] {
    const list = [...this.players()];
    return list.sort((a, b) => {
      if (b.kills !== a.kills) {
        return b.kills - a.kills;
      }
      return b.damage - a.damage;
    });
  }

  protected formatKd(player: MatchPlayer): string {
    if (player.deaths <= 0) {
      return player.kills.toFixed(2);
    }
    return (player.kills / player.deaths).toFixed(2);
  }

  protected formatAdr(player: MatchPlayer): string {
    const rounds = this.roundCount();
    if (rounds === undefined || rounds === null) {
      return '—';
    }
    if (rounds <= 0) {
      return '0.0';
    }
    return (player.damage / rounds).toFixed(1);
  }

  protected formatHeadshotPct(player: MatchPlayer): string {
    if (player.kills <= 0) {
      return '0%';
    }
    return `${Math.round((player.headShotKills / player.kills) * 100)}%`;
  }

  protected formatEntry(player: MatchPlayer): string {
    if (player.entryCount <= 0) {
      return '—';
    }
    return `${player.entryWins}/${player.entryCount}`;
  }

  protected steamIdLabel(steamId64: string | null): string {
    return steamId64 ?? '—';
  }

  protected nameLabel(name: string | null): string {
    return name || 'Sem nome';
  }
}
