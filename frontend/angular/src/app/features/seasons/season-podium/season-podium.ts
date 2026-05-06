import { Component, Input } from '@angular/core';

import { SeasonRankingPlayerDto } from '../../../core/api/dto/season-ranking.dto';
import {
  eligibilityLabel,
  playerAvatar,
  playerInitials,
  podiumPlacementLabel,
} from '../season-ui';

@Component({
  selector: 'app-season-podium',
  templateUrl: './season-podium.html',
  styleUrl: './season-podium.css',
})
export class SeasonPodium {
  @Input() players: SeasonRankingPlayerDto[] | null | undefined = [];

  protected readonly playerAvatar = playerAvatar;
  protected readonly playerInitials = playerInitials;
  protected readonly eligibilityLabel = eligibilityLabel;
  protected readonly podiumPlacementLabel = podiumPlacementLabel;

  protected podiumPlayers(): SeasonRankingPlayerDto[] {
    const top = (this.players ?? []).slice(0, 3);

    return top.length < 3 ? top : [top[1], top[0], top[2]];
  }

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }
}
