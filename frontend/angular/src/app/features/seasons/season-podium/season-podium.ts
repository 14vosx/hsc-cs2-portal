import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface PodiumPlayer {
  rank?: number;
  prizeRank?: number | null;
  prizeEligible?: boolean | null;
  steamId64?: string | null;
  steamid64?: string;
  name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  steamAvatarUrl?: string | null;
  steam_avatar_url?: string | null;
  avatar?: string | null;
  score?: number;
  kdRatio?: number;
  adr?: number;
  mapsPlayed?: number;
  roundsPlayed?: number;
  wins?: number;
  losses?: number;
}

@Component({
  selector: 'app-season-podium',
  templateUrl: './season-podium.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-podium.css',
})
export class SeasonPodium {
  @Input() players: readonly PodiumPlayer[] | null | undefined = [];

  protected canonicalSteamId(player: PodiumPlayer): string | null {
    return player.steamId64 ?? player.steamid64 ?? null;
  }

  protected playerAvatar(player?: PodiumPlayer | null): string {
    return (
      player?.avatarUrl ??
      player?.avatar_url ??
      player?.steamAvatarUrl ??
      player?.steam_avatar_url ??
      player?.avatar ??
      ''
    );
  }

  protected playerInitials(player?: PodiumPlayer | null): string {
    const name = player?.name?.trim();

    if (!name) {
      return 'HSC';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  protected eligibilityLabel(player: PodiumPlayer): 'Elegível' | 'Em progresso' | 'Indefinido' {
    if (player.prizeEligible === true) {
      return 'Elegível';
    }

    if (player.prizeEligible === false) {
      return 'Em progresso';
    }

    return 'Indefinido';
  }

  protected podiumPlacementLabel(player: PodiumPlayer): string {
    switch (player.prizeRank ?? player.rank) {
      case 1:
        return 'Primeiro lugar';
      case 2:
        return 'Segundo lugar';
      case 3:
        return 'Terceiro lugar';
      default:
        return 'Top da Season';
    }
  }

  protected podiumPlayers(): PodiumPlayer[] {
    const top = (this.players ?? []).slice(0, 3);

    return top.length < 3 ? [...top] : [top[1], top[0], top[2]];
  }

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }
}
