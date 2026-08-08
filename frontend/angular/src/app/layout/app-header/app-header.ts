import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-header.css',
})
export class AppHeader {
  readonly isDrawerOpen = input<boolean>(false);
  readonly toggleDrawer = output<void>();

  protected onToggle(): void {
    this.toggleDrawer.emit();
  }
}
