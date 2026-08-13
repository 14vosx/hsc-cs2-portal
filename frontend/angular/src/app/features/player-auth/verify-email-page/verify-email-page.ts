import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { mapPlayerEmailAuthError } from '../player-email-auth-error';
import { isValidPlayerEmailToken } from '../player-email-auth-validation';

type VerificationState = 'loading' | 'invalid' | 'error' | 'success';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './verify-email-page.html',
  styleUrl: './verify-email-page.css',
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly emailAuthApi = inject(PlayerEmailAuthApiService);

  protected readonly state = signal<VerificationState>('loading');
  protected readonly messageKey = signal('playerAuth.verifyEmail.loading.message');
  protected readonly retryable = signal(false);
  private token: string | null = null;
  private attempted = false;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? null;
    if (!isValidPlayerEmailToken(token)) {
      this.state.set('invalid');
      this.messageKey.set('playerAuth.verifyEmail.errors.invalidLink');
      return;
    }

    this.token = token;
    this.location.replaceState('/verify-email');
    this.verify();
  }

  protected verify(): void {
    if (!this.token || this.attempted) return;
    this.attempted = true;
    this.state.set('loading');
    this.messageKey.set('playerAuth.verifyEmail.loading.message');
    this.retryable.set(false);

    this.emailAuthApi.verify({ token: this.token }).subscribe({
      next: () => {
        this.state.set('success');
        this.messageKey.set('playerAuth.verifyEmail.success.navigationPending');
        void this.router.navigateByUrl('/area-do-jogador');
      },
      error: (error: unknown) => {
        const presentation = mapPlayerEmailAuthError(error, 'verification');
        this.state.set(presentation.kind === 'invalid-verification-link' ? 'invalid' : 'error');
        this.messageKey.set(presentation.messageKey);
        this.retryable.set(
          this.state() === 'error' && presentation.kind !== 'account-disabled',
        );
      },
    });
  }

  protected retry(): void {
    if (!this.retryable()) return;
    this.attempted = false;
    this.verify();
  }
}
