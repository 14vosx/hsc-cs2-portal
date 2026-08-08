import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
}
