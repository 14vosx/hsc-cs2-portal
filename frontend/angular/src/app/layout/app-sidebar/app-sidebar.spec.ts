import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { AppSidebar } from './app-sidebar';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
})
class EmptyRouteComponent {}

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
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, AppSidebar],
      providers: [
        provideRouter([{ path: '', component: EmptyRouteComponent }]),
        provideTranslateService({ fallbackLang: 'pt-BR' }),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      sidebar: { title: 'Navegação', closeNavigation: 'Fechar menu de navegação' }, nav: {},
    });
    translate.setTranslation('en-US', {
      sidebar: { title: 'Navigation', closeNavigation: 'Close navigation menu' }, nav: {},
    });
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render the vertical navigation without a close button by default', () => {
    const closeBtn = fixture.nativeElement.querySelector('.app-sidebar__close-btn');
    expect(closeBtn).toBeNull();
    expect(fixture.nativeElement.querySelector('.primary-nav--vertical')).toBeTruthy();
  });

  it('forwards navigation selection through the drawer close contract', () => {
    const firstLink = fixture.nativeElement.querySelector('.primary-nav__link') as HTMLAnchorElement;

    firstLink.click();

    expect(fixture.componentInstance.closed).toBe(true);
  });

  it('should render mobile header with close button when isMobileDrawer is true', () => {
    fixture.componentInstance.isMobile = true;
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.app-sidebar__close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-sidebar__title').textContent.trim()).toBe('Navegação');
    expect(closeBtn.getAttribute('aria-label')).toBe('Fechar menu de navegação');

    closeBtn.click();
    expect(fixture.componentInstance.closed).toBe(true);
  });

  it('translates the mobile title and close label to en-US', async () => {
    fixture.componentInstance.isMobile = true;
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-sidebar__title').textContent.trim()).toBe('Navigation');
    expect(fixture.nativeElement.querySelector('.app-sidebar__close-btn').getAttribute('aria-label')).toBe('Close navigation menu');
  });
});
