import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './app-footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-footer.css',
})
export class AppFooter {
  protected readonly currentYear = new Date().getFullYear();
}
