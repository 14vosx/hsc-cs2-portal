import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppFooter } from './app-footer';

describe('AppFooter', () => {
  let fixture: ComponentFixture<AppFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFooter],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooter);
    fixture.detectChanges();
  });

  it('should render contentinfo footer landmark', () => {
    const footerElement = fixture.nativeElement.querySelector('footer[role="contentinfo"]');
    expect(footerElement).toBeTruthy();
  });

  it('should render institutional text and links', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('High Skill Community');
    expect(text).toContain('CS2 PORTAL NEXT');

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(5);
  });

  it('link Ranking aponta para /ranking', () => {
    const link = fixture.nativeElement.querySelector('a[href="/ranking"]');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Ranking');
  });

  it('link Temporadas aponta para /seasons', () => {
    const link = fixture.nativeElement.querySelector('a[href="/seasons"]');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Temporadas');
  });

  it('não existe link de navegação para /seasons/current/ranking', () => {
    const link = fixture.nativeElement.querySelector('a[href="/seasons/current/ranking"]');
    expect(link).toBeNull();
  });

  it('não existe link Temporadas apontando para /seasons/current', () => {
    const link = fixture.nativeElement.querySelector('a[href="/seasons/current"]');
    expect(link).toBeNull();
  });
});
