import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { PlayerEmailAuthPanel } from './player-email-auth-panel';

describe('PlayerEmailAuthPanel', () => {
  let fixture: ComponentFixture<PlayerEmailAuthPanel>;
  const api = {
    login: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.login.mockReturnValue(of({ ok: true, authenticated: true, session: { issued: true } }));
    api.register.mockReturnValue(of({ ok: true, verificationRequired: true }));
    api.requestPasswordReset.mockReturnValue(of({ ok: true, message: 'generic' }));
    await TestBed.configureTestingModule({
      imports: [PlayerEmailAuthPanel],
      providers: [{ provide: PlayerEmailAuthApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(PlayerEmailAuthPanel);
    fixture.componentRef.setInput('steamLoginUrl', '/player/auth/steam/start');
    fixture.detectChanges();
  });

  it('renders login and keeps Steam available', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Entre para acessar sua área');
    expect(element.querySelector<HTMLAnchorElement>('a')?.href).toContain('/player/auth/steam/start');
    expect(element.querySelector('label[for="player-auth-email"]')).toBeTruthy();
    expect(element.querySelector('label[for="player-auth-password"]')).toBeTruthy();
    expect(element.querySelector<HTMLInputElement>('#player-auth-email')?.autocomplete).toBe('email');
    expect(element.querySelector<HTMLInputElement>('#player-auth-password')?.autocomplete).toBe('current-password');
  });

  it('submits normalized login credentials and emits authentication', () => {
    const emitted = vi.fn();
    fixture.componentInstance.authenticated.subscribe(emitted);
    setInput('player-auth-email', ' player@example.test ');
    setInput('player-auth-password', 'password-10');
    submit();
    expect(api.login).toHaveBeenCalledWith({ email: 'player@example.test', password: 'password-10' });
    expect(emitted).toHaveBeenCalledOnce();
  });

  it('prevents a duplicate pending login', () => {
    api.login.mockReturnValue(new Subject());
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    submit();
    submit();
    expect(api.login).toHaveBeenCalledTimes(1);
  });

  it('maps invalid credentials without exposing the backend code', () => {
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 401,
      error: { error: 'invalid_credentials' },
    })));
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'wrong-password');
    submit();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('E-mail ou senha inválidos.');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('invalid_credentials');
  });

  it('explains when email verification is still required', () => {
    api.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { error: 'email_not_verified' },
          }),
      ),
    );
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'e-mail ainda precisa ser verificado',
    );
  });

  it('registers without an empty optional display name and shows privacy-safe copy', () => {
    clickButton('Criar conta');
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', '😀'.repeat(10));
    submit();
    expect(api.register).toHaveBeenCalledWith({ email: 'player@example.test', password: '😀'.repeat(10) });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se este endereço puder ser utilizado');
  });

  it('maps registration field errors in the presentation layer', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: 'invalid_display_name' },
          }),
      ),
    );
    clickButton('Criar conta');
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    setInput('player-auth-display-name', 'Invalid');
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Informe um nome de exibição válido.',
    );
  });

  it('requests reset instructions with generic success and can return to login', () => {
    clickButton('Esqueci minha senha');
    setInput('player-auth-email', 'unknown@example.test');
    submit();
    expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'unknown@example.test' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se a conta estiver apta');
    clickButton('Voltar para entrar');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entre para acessar sua área');
  });

  function setInput(id: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    fixture.detectChanges();
  }

  function clickButton(text: string): void {
    const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((candidate) => candidate.textContent?.trim() === text)!;
    button.click();
    fixture.detectChanges();
  }
});
