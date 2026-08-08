import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { UiCard } from './card';

@Component({
  template: '<app-ui-card variant="highlight">Content</app-ui-card>',
  imports: [UiCard],
})
class TestHostComponent {}

describe('UiCard', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, UiCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render projection content and variant class', () => {
    const cardEl = fixture.nativeElement.querySelector('.ui-card');
    expect(cardEl).toBeTruthy();
    expect(cardEl.classList.contains('ui-card--highlight')).toBe(true);
    expect(cardEl.textContent.trim()).toBe('Content');
  });
});
