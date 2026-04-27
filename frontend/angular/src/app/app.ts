import { Component, signal } from '@angular/core';

import { PortalShell } from './core/layout/portal-shell/portal-shell';

@Component({
  selector: 'app-root',
  imports: [PortalShell],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('hsc-cs2-portal-angular');
}
