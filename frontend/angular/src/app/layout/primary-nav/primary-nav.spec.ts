import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { PrimaryNav } from './primary-nav';

@Component({
  template: '<app-primary-nav (itemSelected)="onSelected()" />',
  imports: [PrimaryNav],
})
class TestHostComponent {
  selectedCount = 0;
  onSelected(): void {
    this.selectedCount++;
  }
}

describe('PrimaryNav', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, PrimaryNav],
      providers: [
        provideRouter([
          { path: '', component: TestHostComponent },
          { path: 'seasons', component: TestHostComponent },
          { path: 'ranking', component: TestHostComponent },
          { path: 'seasons/current', component: TestHostComponent },
          { path: 'seasons/s2-2026', component: TestHostComponent },
          { path: 'seasons/current/ranking', component: TestHostComponent },
          { path: 'seasons/s2-2026/ranking', component: TestHostComponent },
          { path: 'seasons/s2-2026/matches', component: TestHostComponent },
          { path: 'seasons/s2-2026/maps', component: TestHostComponent },
          { path: 'matches', component: TestHostComponent },
          { path: 'maps', component: TestHostComponent },
          { path: 'news', component: TestHostComponent },
          { path: 'bunker', component: TestHostComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should render all primary navigation items', () => {
    const links = fixture.nativeElement.querySelectorAll('.primary-nav__link');
    expect(links.length).toBe(7);
  });

  it('o link Ranking possui href /ranking', () => {
    const rankingLink = fixture.nativeElement.querySelector('a[href="/ranking"]');
    expect(rankingLink).not.toBeNull();
  });

  it('should mark Home as active when URL is /', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    const homeLink = fixture.nativeElement.querySelector('a[href="/"]');
    expect(homeLink.classList.contains('primary-nav__link--active')).toBe(true);
    expect(homeLink.getAttribute('aria-current')).toBe('page');
  });

  it('/ranking ativa Ranking', async () => {
    await router.navigateByUrl('/ranking');
    fixture.detectChanges();

    const rankingLink = fixture.nativeElement.querySelector('a[href="/ranking"]');
    expect(rankingLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('/seasons ativa Temporadas', async () => {
    await router.navigateByUrl('/seasons');
    fixture.detectChanges();

    const seasonsLink = fixture.nativeElement.querySelector('a[href="/seasons"]');
    expect(seasonsLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('/seasons/:slug/ranking ativa Temporadas e não Ranking', async () => {
    await router.navigateByUrl('/seasons/s2-2026/ranking');
    fixture.detectChanges();

    const seasonsLink = fixture.nativeElement.querySelector('a[href="/seasons"]');
    const rankingLink = fixture.nativeElement.querySelector('a[href="/ranking"]');
    expect(seasonsLink.classList.contains('primary-nav__link--active')).toBe(true);
    expect(rankingLink.classList.contains('primary-nav__link--active')).toBe(false);
  });

  it('/seasons/:slug/matches ativa Temporadas e não Partidas', async () => {
    await router.navigateByUrl('/seasons/s2-2026/matches');
    fixture.detectChanges();

    const seasonsLink = fixture.nativeElement.querySelector('a[href="/seasons"]');
    const matchesLink = fixture.nativeElement.querySelector('a[href="/matches"]');
    expect(seasonsLink.classList.contains('primary-nav__link--active')).toBe(true);
    expect(matchesLink.classList.contains('primary-nav__link--active')).toBe(false);
  });

  it('/seasons/:slug/maps ativa Temporadas e não Mapas', async () => {
    await router.navigateByUrl('/seasons/s2-2026/maps');
    fixture.detectChanges();

    const seasonsLink = fixture.nativeElement.querySelector('a[href="/seasons"]');
    const mapsLink = fixture.nativeElement.querySelector('a[href="/maps"]');
    expect(seasonsLink.classList.contains('primary-nav__link--active')).toBe(true);
    expect(mapsLink.classList.contains('primary-nav__link--active')).toBe(false);
  });

  it('/matches ativa Partidas', async () => {
    await router.navigateByUrl('/matches');
    fixture.detectChanges();

    const matchesLink = fixture.nativeElement.querySelector('a[href="/matches"]');
    expect(matchesLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('/maps ativa Mapas', async () => {
    await router.navigateByUrl('/maps');
    fixture.detectChanges();

    const mapsLink = fixture.nativeElement.querySelector('a[href="/maps"]');
    expect(mapsLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('should emit itemSelected when a navigation link is clicked', () => {
    const firstLink = fixture.nativeElement.querySelector('.primary-nav__link') as HTMLElement;
    firstLink.click();
    expect(fixture.componentInstance.selectedCount).toBe(1);
  });
});
