import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

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
          { path: 'seasons/current', component: TestHostComponent },
          { path: 'seasons/current/ranking', component: TestHostComponent },
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

  it('should mark Home as active when URL is /', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    const homeLink = fixture.nativeElement.querySelector('a[href="/"]');
    expect(homeLink.classList.contains('primary-nav__link--active')).toBe(true);
    expect(homeLink.getAttribute('aria-current')).toBe('page');
  });

  it('should mark Seasons as active on /seasons/current', async () => {
    await router.navigateByUrl('/seasons/current');
    fixture.detectChanges();

    const seasonsLink = fixture.nativeElement.querySelector('a[href="/seasons/current"]');
    expect(seasonsLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('should mark Ranking as active on /seasons/current/ranking', async () => {
    await router.navigateByUrl('/seasons/current/ranking');
    fixture.detectChanges();

    const rankingLink = fixture.nativeElement.querySelector('a[href="/seasons/current/ranking"]');
    expect(rankingLink.classList.contains('primary-nav__link--active')).toBe(true);
  });

  it('should emit itemSelected when a navigation link is clicked', () => {
    const firstLink = fixture.nativeElement.querySelector('.primary-nav__link') as HTMLElement;
    firstLink.click();
    expect(fixture.componentInstance.selectedCount).toBe(1);
  });
});
