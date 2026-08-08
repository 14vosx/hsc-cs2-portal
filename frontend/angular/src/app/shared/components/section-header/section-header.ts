import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-section-header',
  templateUrl: './section-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './section-header.css',
})
export class SectionHeader {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly subtitle = input<string>();
}
