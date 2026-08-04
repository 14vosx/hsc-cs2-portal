import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { SectionHeader } from './section-header';

@Component({
  template: `
    <app-section-header eyebrow="Eyebrow" title="Title" subtitle="Subtitle">
      <button action type="button">Action</button>
    </app-section-header>
  `,
  imports: [SectionHeader],
})
class TestHostComponent {}

describe('SectionHeader', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, SectionHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render eyebrow, title, subtitle and action slot', () => {
    const native = fixture.nativeElement;
    expect(native.querySelector('.section-header__eyebrow').textContent.trim()).toBe('Eyebrow');
    expect(native.querySelector('.section-header__title').textContent.trim()).toBe('Title');
    expect(native.querySelector('.section-header__subtitle').textContent.trim()).toBe('Subtitle');
    expect(native.querySelector('.section-header__action').textContent.trim()).toBe('Action');
  });
});
