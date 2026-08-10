import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppShell } from './app-shell';

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
    await TestBed.configureTestingModule({
      imports: [AppShell, TestHomeComponent],
      providers: [
        provideRouter([
          { path: '', component: TestHomeComponent },
          { path: 'seasons', component: TestHomeComponent },
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
});
