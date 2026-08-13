import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-player-avatar',
  imports: [TranslatePipe],
  templateUrl: './player-avatar.html',
  styleUrl: './player-avatar.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PlayerAvatar {
  readonly imageUrl = input<string | null>(null);
  readonly displayName = input('HSC');
  readonly accent = input<'cyan' | 'orange'>('cyan');
  protected readonly initials = computed(() => this.displayName().trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'HSC');
}
