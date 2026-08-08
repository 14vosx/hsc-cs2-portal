import { Component, input } from '@angular/core';

export type UiCardVariant = 'default' | 'interactive' | 'highlight';

@Component({
  selector: 'app-ui-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class UiCard {
  readonly variant = input<UiCardVariant>('default');
}
