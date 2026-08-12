import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import { PlayerAccountSecurityPanel } from './player-account-security-panel';

const account = (
  emailLinked: boolean,
  steamLinked: boolean,
  emailVerified = emailLinked,
  email: string | null = emailLinked ? 'player@example.test' : null,
): PlayerAccountSummary => ({
  status: 'active',
  identities: {
    email: { linked: emailLinked, email, verified: emailVerified },
    steam: { linked: steamLinked, steamId64: steamLinked ? '76561198000000001' : null },
  },
  capabilities: {
    cs2Identity: { ready: steamLinked, reason: steamLinked ? null : 'steam_link_required' },
    personalizedStats: { available: steamLinked, reason: steamLinked ? null : 'steam_link_required' },
  },
});

describe('PlayerAccountSecurityPanel', () => {
  let fixture: ComponentFixture<PlayerAccountSecurityPanel>;
  const api = { requestEmailLink: vi.fn() };
  const emailAuthApi = { requestPasswordReset: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    emailAuthApi.requestPasswordReset.mockReturnValue(of({ ok: true, message: 'generic' }));
    await TestBed.configureTestingModule({
      imports: [PlayerAccountSecurityPanel],
      providers: [
        { provide: PlayerIdentityLinkApiService, useValue: api },
        { provide: PlayerEmailAuthApiService, useValue: emailAuthApi },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PlayerAccountSecurityPanel);
    fixture.componentRef.setInput('account', account(false, false));
    fixture.componentRef.setInput('steamLinkUrl', '/player/auth/steam/link/start');
    fixture.detectChanges();
  });

  it('renders linked identity details and no linking actions', () => {
    fixture.componentRef.setInput('account', account(true, true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('player@example.test');
    expect(fixture.nativeElement.textContent).toContain('76561198000000001');
    expect(fixture.nativeElement.textContent).not.toContain('Vincular e-mail');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('renders password reset for a linked and verified email', () => {
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    expect(resetPasswordButton()).not.toBeUndefined();
  });

  it('does not render password reset for an unlinked email', () => {
    expect(resetPasswordButton()).toBeUndefined();
  });

  it('does not render password reset for an unverified linked email or a null email value', () => {
    fixture.componentRef.setInput('account', account(true, false, false));
    fixture.detectChanges();
    expect(resetPasswordButton()).toBeUndefined();

    fixture.componentRef.setInput('account', account(true, false, true, null));
    fixture.detectChanges();
    expect(resetPasswordButton()).toBeUndefined();
  });

  it('requests password reset with the exact linked email', () => {
    fixture.componentRef.setInput('account', account(true, false, true, 'Player+CS2@example.test'));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledWith({
      email: 'Player+CS2@example.test',
    });
  });

  it('prevents duplicate password reset requests while pending', () => {
    emailAuthApi.requestPasswordReset.mockReturnValue(new Subject());
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    const button = resetPasswordButton()!;
    button.click();
    button.click();
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(button.textContent).toContain('Enviando...');
  });

  it('shows generic safe copy after a password reset request succeeds', () => {
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    fixture.detectChanges();
    const status = fixture.debugElement.query(By.css('[role="status"]'));
    expect(status.nativeElement.textContent).toContain(
      'Solicitação recebida. Se a conta estiver elegível, enviaremos instruções para o e-mail vinculado.',
    );
  });

  it('maps password reset request failures to safe presentation copy', () => {
    emailAuthApi.requestPasswordReset.mockReturnValue(throwError(() => new Error('internal')));
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alert.nativeElement.textContent).toContain(
      'Não foi possível concluir a operação agora. Tente novamente.',
    );
    expect(alert.nativeElement.textContent).not.toContain('internal');
  });

  it('renders the email form and existing Steam URL when unlinked', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/player/auth/steam/link/start');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const button = Array.from(buttons).find((item) => item.textContent.includes('Vincular e-mail'));
    button!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('validates password length using Unicode code-point boundaries', () => {
    const component = fixture.componentInstance as unknown as {
      showEmailLinkForm(): void;
      emailLinkModel: { set(value: unknown): void };
      emailLinkForm: { password(): { errors(): { kind: string }[] } };
    };
    component.showEmailLinkForm();
    component.emailLinkModel.set({
      email: 'p@example.test',
      password: '😀'.repeat(9),
      confirmPassword: '😀'.repeat(9),
    });
    fixture.detectChanges();
    expect(
      component.emailLinkForm.password().errors().some((error) => error.kind === 'password_length'),
    ).toBe(true);

    component.emailLinkModel.set({
      email: 'p@example.test',
      password: '😀'.repeat(10),
      confirmPassword: '😀'.repeat(10),
    });
    fixture.detectChanges();
    expect(
      component.emailLinkForm.password().errors().some((error) => error.kind === 'password_length'),
    ).toBe(false);
  });

  it('validates confirmation mismatch when the primary password is valid', () => {
    const component = fixture.componentInstance as unknown as {
      showEmailLinkForm(): void;
      emailLinkModel: { set(value: unknown): void };
      emailLinkForm: { confirmPassword(): { errors(): { kind: string }[] } };
    };
    component.showEmailLinkForm();
    component.emailLinkModel.set({
      email: 'p@example.test',
      password: 'valid-password',
      confirmPassword: 'different-password',
    });
    fixture.detectChanges();
    expect(
      component.emailLinkForm
        .confirmPassword()
        .errors()
        .some((error) => error.kind === 'password_mismatch'),
    ).toBe(true);
  });

  it('prevents duplicate submissions and shows generic success', async () => {
    const response = new Subject<{ ok: true; verificationRequired: true }>();
    api.requestEmailLink.mockReturnValue(response);
    const component = fixture.componentInstance as unknown as { showEmailLinkForm(): void; emailLinkModel: { set(value: unknown): void }; onSubmit(event: Event): Promise<void> };
    component.showEmailLinkForm();
    component.emailLinkModel.set({ email: 'p@example.test', password: 'long-password', confirmPassword: 'long-password' });
    const event = new Event('submit');
    await component.onSubmit(event);
    await component.onSubmit(event);
    expect(api.requestEmailLink).toHaveBeenCalledTimes(1);
    response.next({ ok: true, verificationRequired: true });
    response.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Solicitação recebida');
    expect(fixture.nativeElement.textContent).not.toContain('p@example.test');
  });

  it('maps request failures to safe presentation copy', async () => {
    api.requestEmailLink.mockReturnValue(throwError(() => new Error('internal')));
    const component = fixture.componentInstance as unknown as { showEmailLinkForm(): void; emailLinkModel: { set(value: unknown): void }; onSubmit(event: Event): Promise<void> };
    component.showEmailLinkForm();
    component.emailLinkModel.set({ email: 'p@example.test', password: 'long-password', confirmPassword: 'long-password' });
    await component.onSubmit(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[role="alert"]')).nativeElement.textContent).not.toContain('internal');
  });

  function resetPasswordButton(): HTMLButtonElement | undefined {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent.includes('Redefinir senha'));
  }
});
