import { Component, input } from '@angular/core';
import { UiCard } from '../../../../shared/components/card/card';

@Component({
  selector: 'app-bunker-auth-card',
  standalone: true,
  imports: [UiCard],
  templateUrl: './bunker-auth-card.html',
  styleUrl: './bunker-auth-card.css',
})
export class BunkerAuthCard {
  readonly steamLoginUrl = input.required<string>();
}
