import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PrimaryNav } from '../primary-nav/primary-nav';

@Component({
  selector: 'app-sidebar',
  imports: [PrimaryNav, TranslatePipe],
  templateUrl: './app-sidebar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-sidebar.css',
})
export class AppSidebar {
  readonly isMobileDrawer = input<boolean>(false);
  readonly closeRequested = output<void>();

  protected onClose(): void {
    this.closeRequested.emit();
  }
}
