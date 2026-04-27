import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PortalFooter } from '../portal-footer/portal-footer';
import { PortalHeader } from '../portal-header/portal-header';

@Component({
  selector: 'app-portal-shell',
  imports: [RouterOutlet, PortalHeader, PortalFooter],
  templateUrl: './portal-shell.html',
  styleUrl: './portal-shell.css',
})
export class PortalShell {}
