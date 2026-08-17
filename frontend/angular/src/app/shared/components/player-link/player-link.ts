import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-player-link',
  imports: [RouterLink],
  templateUrl: './player-link.html',
  styleUrl: './player-link.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PlayerLink {
  readonly label = input.required<string>();
  readonly profileSlug = input<string | null>(null);
}
