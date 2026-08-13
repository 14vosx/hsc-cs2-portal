import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { PlayerServerAccess } from '../../player/domain/player-server-access.model';
import { presentServerAccess } from '../player-server-access-presentation';

export type PlayerServerAccessLoadState = 'ready' | 'unavailable';

@Component({
  selector: 'app-player-server-access-panel',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './player-server-access-panel.html',
  styleUrl: './player-server-access-panel.css',
})
export class PlayerServerAccessPanel {
  readonly access = input<PlayerServerAccess | null>(null);
  readonly loadState = input.required<PlayerServerAccessLoadState>();

  protected readonly presentation = computed(() =>
    presentServerAccess(this.access(), this.loadState() === 'ready'),
  );
}
