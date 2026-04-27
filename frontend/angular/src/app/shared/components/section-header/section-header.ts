import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  templateUrl: './section-header.html',
  styleUrl: './section-header.css',
})
export class SectionHeader {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
