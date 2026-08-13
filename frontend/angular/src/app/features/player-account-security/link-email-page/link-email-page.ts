import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import { mapEmailLinkConfirmationError } from '../player-account-security-error';

type LinkEmailState = 'loading' | 'success' | 'invalid' | 'conflict' | 'disabled' | 'unavailable' | 'error';
const EMAIL_LINK_TOKEN = /^[0-9a-f]{64}$/;

@Component({
  selector: 'app-link-email-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './link-email-page.html',
  styleUrl: './link-email-page.css',
})
export class LinkEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly identityLinkApi = inject(PlayerIdentityLinkApiService);

  protected readonly state = signal<LinkEmailState>('loading');
  protected readonly message = signal('playerAccount.emailLink.confirmation.loading.message');
  private attempted = false;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? null;
    if (token !== null) this.location.replaceState('/link-email');
    if (!token || !EMAIL_LINK_TOKEN.test(token)) {
      this.state.set('invalid');
      this.message.set('playerAccount.emailLink.confirmation.errors.invalid');
      return;
    }

    this.confirm(token);
  }

  private confirm(token: string): void {
    if (this.attempted) return;
    this.attempted = true;
    this.identityLinkApi.confirmEmailLink(token).subscribe({
      next: () => {
        this.state.set('success');
        this.message.set('playerAccount.emailLink.confirmation.success.message');
      },
      error: (error: unknown) => {
        const mapped = mapEmailLinkConfirmationError(error);
        this.state.set(mapped.state);
        this.message.set(mapped.message);
      },
    });
  }
}
