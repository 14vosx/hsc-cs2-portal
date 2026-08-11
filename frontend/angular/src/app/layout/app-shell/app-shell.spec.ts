import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { AppShell } from './app-shell';
import { PlayerSessionService } from '../../core/session/player-session.service';
import type { PlayerSession } from '../../core/session/player-session.model';

const sessionState = signal<PlayerSession>({ status: 'anonymous' });
const sessionStub = {
  state: sessionState,
  load: vi.fn(() => undefined),
  logout: vi.fn<(onSuccess?: () => void, onError?: () => void) => void>(() => undefined),
};

@Component({
  template: '<h1>Home Content</h1>',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [],
})
class TestHomeComponent {}

describe('AppShell', () => {
  let fixture: ComponentFixture<AppShell>;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionState.set({ status: 'anonymous' });
    sessionStub.logout.mockImplementation((onSuccess?: () => void) => {
      sessionState.set({ status: 'anonymous' });
      onSuccess?.();
    });
    await TestBed.configureTestingModule({
      imports: [AppShell, TestHomeComponent],
      providers: [
        { provide: PlayerSessionService, useValue: sessionStub },
        provideRouter([
          { path: '', component: TestHomeComponent },
          { path: 'seasons', component: TestHomeComponent },
          { path: 'area-do-jogador', component: TestHomeComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShell);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should render header, permanent sidebar, main landmark and footer', () => {
    const native = fixture.nativeElement;
    const body = native.querySelector('.app-shell__body');
    const main = native.querySelector('main#main-content');
    expect(native.querySelector('app-header')).toBeTruthy();
    expect(body?.querySelector(':scope > .app-shell__sidebar-desktop app-sidebar')).toBeTruthy();
    expect(body?.querySelector(':scope > main#main-content')).toBe(main);
    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(native.querySelector('app-footer')).toBeTruthy();
  });

  it('should render skip link pointing to #main-content', () => {
    const skipLink = fixture.nativeElement.querySelector('.skip-link');
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('should open mobile drawer and lock scroll preserving previous overflow', () => {
    document.body.style.overflow = 'visible';

    const toggleBtn = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('#mobile-drawer');
    expect(drawer).toBeTruthy();
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.getAttribute('cdktrapfocus')).toBeDefined();
    expect(document.body.style.overflow).toBe('hidden');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

    // Close and verify restoration of previous overflow ('visible')
    const backdrop = fixture.nativeElement.querySelector('.app-shell__backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('visible');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should return focus to trigger button when drawer is closed', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    toggleBtn.focus();
    toggleBtn.click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.app-shell__backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(toggleBtn);
  });

  it('should close mobile drawer on Escape key press', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#mobile-drawer')).toBeNull();
  });

  it('should close mobile drawer when navigation occurs', async () => {
    const toggleBtn = fixture.nativeElement.querySelector('.app-header__toggle') as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    await router.navigateByUrl('/seasons');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#mobile-drawer')).toBeNull();
  });

  it('navigates to Player Area and renders the guest header after logout succeeds', async () => {
    sessionState.set({
      status: 'authenticated',
      displayName: 'Player HSC',
      steamId64: '76561198000000001',
      avatarMedium: null,
    });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const logoutButton = fixture.nativeElement.querySelector(
      '.app-header__menu button',
    ) as HTMLButtonElement;
    expect(logoutButton.textContent?.trim()).toBe('Sair');
    logoutButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sessionStub.logout).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/area-do-jogador');
    expect(fixture.nativeElement.querySelector('.app-header__sign-in')).toBeTruthy();
  });

  it('preserves the authenticated header and route when logout fails', async () => {
    await router.navigateByUrl('/seasons');
    sessionState.set({
      status: 'authenticated',
      displayName: 'Player HSC',
      steamId64: '76561198000000001',
      avatarMedium: null,
    });
    sessionStub.logout.mockImplementation((...callbacks) => callbacks[1]?.());
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__account-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const logoutButton = fixture.nativeElement.querySelector(
      '.app-header__menu button',
    ) as HTMLButtonElement;
    logoutButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sessionStub.logout).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/seasons');
    expect(fixture.nativeElement.textContent).toContain('Player HSC');
    expect(fixture.nativeElement.querySelector('.app-header__sign-in')).toBeNull();
  });
});
