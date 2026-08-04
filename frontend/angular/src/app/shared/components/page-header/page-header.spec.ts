import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { PageHeader } from './page-header';

@Component({
  template: `
    <app-page-header eyebrow="Eyebrow" title="Title" description="Description">
      <div actions>Action</div>
    </app-page-header>
  `,
  imports: [PageHeader],
})
class TestHostComponent {}

describe('PageHeader', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, PageHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render eyebrow, title, description and projection actions', () => {
    const native = fixture.nativeElement;
    expect(native.querySelector('.page-header__eyebrow').textContent.trim()).toBe('Eyebrow');
    expect(native.querySelector('.page-header__title').textContent.trim()).toBe('Title');
    expect(native.querySelector('.page-header__description').textContent.trim()).toBe('Description');
    expect(native.querySelector('.page-header__actions').textContent.trim()).toBe('Action');
  });
});
