import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppHeader } from './app-header';
import type { PlayerSession } from '../../core/session/player-session.model';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  template: '<app-header [isDrawerOpen]="isOpen" [session]="session" (toggleDrawer)="onToggle()" (logoutRequested)="onLogout()" />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AppHeader],
})
class TestHostComponent {
  isOpen = false;
  toggled = false;
  loggedOut = false;
  session: PlayerSession = { status: 'anonymous' };

  onToggle(): void {
    this.toggled = true;
  }

  onLogout(): void {
    this.loggedOut = true;
  }
}

describe('AppHeader', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, AppHeader],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: LocaleService,
          useValue: { currentLocale: signal('pt-BR'), setLocale: () => Promise.resolve() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render brand logo with link to home', () => {
    const logoLink = fixture.nativeElement.querySelector('.app-header__logo-link');
    expect(logoLink).toBeTruthy();
    expect(logoLink.getAttribute('href')).toBe('/');
  });

  it('should render mobile toggle button with correct aria-expanded state', () => {
    const button = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('should emit toggleDrawer output on button click', () => {
    const button = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.toggled).toBe(true);
  });

  it('shows the sign-in action to visitors', () => {
    const signIn = fixture.nativeElement.querySelector('.app-header__sign-in') as HTMLAnchorElement;

    expect(signIn).toBeTruthy();
    expect(signIn.getAttribute('href')).toBe('/area-do-jogador');
    expect(signIn.getAttribute('href')).not.toBe('/player/auth/steam/start');
  });

  it('shows the sign-in action when session is unavailable', () => {
    fixture.componentInstance.session = { status: 'unavailable' };
    fixture.detectChanges();

    const signIn = fixture.nativeElement.querySelector('.app-header__sign-in') as HTMLAnchorElement;

    expect(signIn).toBeTruthy();
    expect(signIn.getAttribute('href')).toBe('/area-do-jogador');
  });

  it('shows identity, the player-area action and fallback avatar when authenticated', () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Player One');
    expect(text).toContain('Área do Jogador');
    expect(text).not.toContain('Meu Perfil');
    expect(text).not.toContain('Conta e Segurança');
    expect(fixture.nativeElement.querySelector('.player-avatar__fallback')).toBeTruthy();
  });

  it('toggles aria-expanded when the account disclosure is opened', () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes an open account disclosure on Escape', () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#player-account-menu')).toBeNull();
  });

  it('exposes only the player-area link in the authenticated menu', () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('#player-account-menu a'))
      .map((link) => (link as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toEqual(['/area-do-jogador']);
    expect(fixture.nativeElement.querySelector('#player-account-menu')?.textContent).toContain('Sair');
  });

  it('emits logout through its public output', () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#player-account-menu button') as HTMLButtonElement).click();
    expect(fixture.componentInstance.loggedOut).toBe(true);
  });
});
