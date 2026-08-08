import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type UiCardVariant = 'default' | 'interactive' | 'highlight';

@Component({
  selector: 'app-ui-card',
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './card.css',
})
export class UiCard {
  readonly variant = input<UiCardVariant>('default');
}
