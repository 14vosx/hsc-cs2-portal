import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import type {
  CompetitiveMatchSnapshot,
  MatchRoomParticipant,
  MatchRoomViewerJoin,
} from '../../domain/match-room.model';

export type CompetitivePanelStatus = 'READY' | 'PROVISIONING' | 'JOINABLE' | 'FAILED';

@Component({
  selector: 'app-match-room-competitive-panel',
  imports: [TranslatePipe, StatusBadge],
  templateUrl: './match-room-competitive-panel.html',
  styleUrl: './match-room-competitive-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchRoomCompetitivePanel {
  readonly competitiveMatch = input<CompetitiveMatchSnapshot | null>(null);
  readonly participants = input<readonly MatchRoomParticipant[]>([]);
  readonly status = input.required<CompetitivePanelStatus>();
  readonly canJoinServer = input<boolean>(false);
  readonly join = input<MatchRoomViewerJoin | null>(null);
  readonly copySuccess = input<boolean>(false);

  readonly copyConnection = output<string>();
  readonly backToLobbies = output<void>();

  protected onCopy(): void {
    const j = this.join();
    if (j?.reference) {
      this.copyConnection.emit(j.reference);
    }
  }

  protected onBack(): void {
    this.backToLobbies.emit();
  }
}
