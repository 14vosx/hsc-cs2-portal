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

  it('should render institutional text without development language', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('High Skill Community');
    expect(text).not.toMatch(/Next|Angular|Lego|Foundation/i);
  });
});
