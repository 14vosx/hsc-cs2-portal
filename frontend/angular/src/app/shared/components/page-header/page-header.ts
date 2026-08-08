import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-header.css',
})
export class PageHeader {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
}
