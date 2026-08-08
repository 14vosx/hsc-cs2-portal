import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './app-footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-footer.css',
})
export class AppFooter {
  protected readonly currentYear = new Date().getFullYear();
}
