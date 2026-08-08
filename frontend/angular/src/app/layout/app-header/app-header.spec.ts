import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppHeader } from './app-header';

@Component({
  template: '<app-header [isDrawerOpen]="isOpen" (toggleDrawer)="onToggle()" />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AppHeader],
})
class TestHostComponent {
  isOpen = false;
  toggled = false;

  onToggle(): void {
    this.toggled = true;
  }
}

describe('AppHeader', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, AppHeader],
      providers: [provideRouter([])],
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
});
