import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './data-card.css',
})
export class DataCard {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() meta?: string;
}
