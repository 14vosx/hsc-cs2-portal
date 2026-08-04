import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
})
export class AppHeader {
  readonly isDrawerOpen = input<boolean>(false);
  readonly toggleDrawer = output<void>();

  protected onToggle(): void {
    this.toggleDrawer.emit();
  }
}
