import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { StatusBadge } from './status-badge';

@Component({
  template: `
    <app-status-badge status="active" label="Temporada Ativa" />
    <app-status-badge tone="success" label="Dados sincronizados" />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [StatusBadge],
})
class TestHostComponent {}

describe('StatusBadge', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, StatusBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render status and tone variant classes correctly', () => {
    const badges = fixture.nativeElement.querySelectorAll('app-status-badge');
    expect(badges.length).toBe(2);

    expect(badges[0].classList.contains('status-badge--active')).toBe(true);
    expect(badges[0].textContent.trim()).toBe('Temporada Ativa');

    expect(badges[1].classList.contains('status-badge--success')).toBe(true);
    expect(badges[1].textContent.trim()).toBe('Dados sincronizados');
  });
});
