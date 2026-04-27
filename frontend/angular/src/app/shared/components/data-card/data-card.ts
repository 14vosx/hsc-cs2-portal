import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.html',
  styleUrl: './data-card.css',
})
export class DataCard {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() meta?: string;
}
