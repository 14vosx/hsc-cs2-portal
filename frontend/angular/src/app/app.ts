import { Component, ChangeDetectionStrategy } from '@angular/core';

import { AppShell } from './layout/app-shell/app-shell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {}
