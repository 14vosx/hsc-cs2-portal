import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerAvatar } from '../../../../shared/components/player-avatar/player-avatar';
import type { PlayerIdentity } from '../../../player/domain/player-identity.model';
import type { AnalyticsContext } from '../../bunker-analytics.types';
import { BunkerContextSelector } from '../bunker-context-selector/bunker-context-selector';

@Component({
  selector: 'app-bunker-analytics-header',
  imports: [RouterLink, TranslatePipe, PlayerAvatar, BunkerContextSelector],
  templateUrl: './bunker-analytics-header.html',
  styleUrl: './bunker-analytics-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerAnalyticsHeader {
  readonly player = input.required<PlayerIdentity>();
  readonly context = input.required<AnalyticsContext>();
  readonly seasonName = input<string | null>(null);
  readonly contextChange = output<AnalyticsContext>();

  protected readonly displayName = computed(() => this.player().displayName?.trim() || '');
  protected readonly steamId64 = computed(() => this.player().steamId64?.trim() || '');
  protected readonly avatarMedium = computed(() => this.player().avatarMedium?.trim() || null);
}
