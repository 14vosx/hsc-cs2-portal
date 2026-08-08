import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { PageState } from './page-state';

@Component({
  template: '<app-page-state type="loading" message="Carregando..." />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PageState],
})
class TestHostComponent {}

describe('PageState', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, PageState],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render loading spinner and message', () => {
    const native = fixture.nativeElement;
    expect(native.querySelector('.page-state__spinner')).toBeTruthy();
    expect(native.querySelector('.page-state__loading-text').textContent.trim()).toBe('Carregando...');
  });
});
