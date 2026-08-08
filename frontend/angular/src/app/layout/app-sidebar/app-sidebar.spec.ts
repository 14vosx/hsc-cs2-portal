import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppSidebar } from './app-sidebar';

@Component({
  template: '<app-sidebar [isMobileDrawer]="isMobile" (closeRequested)="onClose()" />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AppSidebar],
})
class TestHostComponent {
  isMobile = false;
  closed = false;

  onClose(): void {
    this.closed = true;
  }
}

describe('AppSidebar', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, AppSidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render desktop sidebar without close button by default', () => {
    const closeBtn = fixture.nativeElement.querySelector('.app-sidebar__close-btn');
    expect(closeBtn).toBeNull();
  });

  it('should render mobile header with close button when isMobileDrawer is true', () => {
    fixture.componentInstance.isMobile = true;
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.app-sidebar__close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    closeBtn.click();
    expect(fixture.componentInstance.closed).toBe(true);
  });
});
