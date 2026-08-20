import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
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
  let translate: TranslateService;

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

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      header: {
        homeAriaLabel: 'HSC CS2 Portal - Página inicial', playerAccountAriaLabel: 'Conta do jogador',
        playerArea: 'Área do Jogador', signOut: 'Sair', signIn: 'ENTRAR',
        openNavigation: 'Abrir menu de navegação', closeNavigation: 'Fechar menu de navegação',
      },
      nav: { ariaLabel: 'Navegação principal', home: 'Home', seasons: 'Temporadas', ranking: 'Ranking', mix: 'Lobby', matches: 'Partidas', maps: 'Mapas', news: 'News', playerArea: 'Área do Jogador' },
      locale: { ariaLabel: 'Idioma do portal', portuguese: 'Português (Brasil)', english: 'English (United States)' },
    });
    translate.setTranslation('en-US', {
      header: {
        homeAriaLabel: 'HSC CS2 Portal - Home', playerAccountAriaLabel: 'Player account',
        playerArea: 'Player Area', signOut: 'Sign out', signIn: 'SIGN IN',
        openNavigation: 'Open navigation menu', closeNavigation: 'Close navigation menu',
      },
      nav: { ariaLabel: 'Primary navigation', home: 'Home', seasons: 'Seasons', ranking: 'Ranking', mix: 'Lobby', matches: 'Matches', maps: 'Maps', news: 'News', playerArea: 'Player Area' },
      locale: { ariaLabel: 'Portal language', portuguese: 'Portuguese (Brazil)', english: 'English (United States)' },
    });
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render brand logo with link to home', () => {
    const logoLink = fixture.nativeElement.querySelector('.app-header__logo-link');
    expect(logoLink).toBeTruthy();
    expect(logoLink.getAttribute('href')).toBe('/');
  });

  it('renders the primary navigation in the desktop header context', () => {
    const nav = fixture.nativeElement.querySelector('.app-header__primary-nav .primary-nav');

    expect(nav).toBeTruthy();
    expect(nav.classList.contains('primary-nav--horizontal')).toBe(true);
    expect(nav.querySelectorAll('.primary-nav__link').length).toBe(8);
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
    expect(signIn.textContent?.trim()).toBe('ENTRAR');
  });

  it('renders the en-US visitor CTA without changing route or session state', async () => {
    const session = fixture.componentInstance.session;
    const href = fixture.nativeElement.querySelector('.app-header__sign-in').getAttribute('href');
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-header__sign-in').textContent.trim()).toBe('SIGN IN');
    expect(fixture.nativeElement.querySelector('.app-header__sign-in').getAttribute('href')).toBe(href);
    expect(fixture.componentInstance.session).toBe(session);
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

  it('renders the authenticated menu in en-US', async () => {
    fixture.componentInstance.session = { status: 'authenticated', displayName: 'Player One', steamId64: '1', avatarMedium: null };
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-header__menu').textContent).toContain('Player Area');
    expect(fixture.nativeElement.querySelector('.app-header__menu').textContent).toContain('Sign out');
  });

  it('translates the dynamic drawer aria-label', async () => {
    const button = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Abrir menu de navegação');
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Fechar menu de navegação');

    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Close navigation menu');
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
