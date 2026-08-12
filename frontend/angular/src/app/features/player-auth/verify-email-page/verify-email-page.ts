import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { mapPlayerEmailAuthError } from '../player-email-auth-error';
import { isValidPlayerEmailToken } from '../player-email-auth-validation';

type VerificationState = 'loading' | 'invalid' | 'error' | 'success';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email-page.html',
  styleUrl: './verify-email-page.css',
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly emailAuthApi = inject(PlayerEmailAuthApiService);

  protected readonly state = signal<VerificationState>('loading');
  protected readonly message = signal('Verificando seu e-mail...');
  protected readonly retryable = signal(false);
  private token: string | null = null;
  private attempted = false;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? null;
    if (!isValidPlayerEmailToken(token)) {
      this.state.set('invalid');
      this.message.set('Link de verificação inválido ou expirado.');
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
    this.message.set('Verificando seu e-mail...');
    this.retryable.set(false);

    this.emailAuthApi.verify({ token: this.token }).subscribe({
      next: () => {
        this.state.set('success');
        this.message.set('E-mail verificado. Entrando na Área do Jogador...');
        void this.router.navigateByUrl('/area-do-jogador');
      },
      error: (error: unknown) => {
        const message = mapPlayerEmailAuthError(error, 'verification');
        this.state.set(message.startsWith('Link de verificação') ? 'invalid' : 'error');
        this.message.set(message);
        this.retryable.set(
          this.state() === 'error' && !message.startsWith('Esta conta está indisponível'),
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
