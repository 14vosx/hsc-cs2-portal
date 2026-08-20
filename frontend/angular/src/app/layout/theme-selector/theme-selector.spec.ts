import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PortalThemeService, type PortalThemeId } from '../../core/theme/portal-theme.service';
import { ThemeSelector } from './theme-selector';

const appliedTheme = signal<PortalThemeId>('03');
const themeServiceStub = {
  appliedTheme,
  selectTheme: vi.fn((theme: PortalThemeId) => appliedTheme.set(theme)),
};

describe('ThemeSelector', () => {
  let fixture: ComponentFixture<ThemeSelector>;

  beforeEach(async () => {
    vi.clearAllMocks();
    appliedTheme.set('03');
    await TestBed.configureTestingModule({
      imports: [ThemeSelector],
      providers: [
        { provide: PortalThemeService, useValue: themeServiceStub },
        provideTranslateService(),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      themeSelector: {
        theme: 'Tema', portalTheme: 'Tema do Portal', chooseTheme: 'Escolher tema do Portal',
        theme01: 'Tema 01', theme02: 'Tema 02', theme03: 'Tema 03', theme04: 'Tema 04', default: 'Padrão',
      },
    });
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(ThemeSelector);
    fixture.detectChanges();
  });

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.theme-selector__trigger');
  }

  function open(): void {
    trigger().click();
    fixture.detectChanges();
  }

  it('renders a real Palette trigger with disclosure attributes', () => {
    expect(trigger().tagName).toBe('BUTTON');
    expect(trigger().getAttribute('aria-label')).toBe('Escolher tema do Portal');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-controls')).toBe('portal-theme-menu');
    expect(trigger().querySelector('svg')).toBeTruthy();
  });

  it('opens the labelled theme panel', () => {
    open();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#portal-theme-menu')?.getAttribute('aria-label')).toBe('Tema do Portal');
  });

  it('renders exactly four theme buttons with four hidden swatches each', () => {
    open();
    const options = Array.from(fixture.nativeElement.querySelectorAll('.theme-selector__option')) as HTMLButtonElement[];

    expect(options).toHaveLength(4);
    expect(options.map((option) => option.getAttribute('aria-label'))).toEqual(['Tema 01', 'Tema 02', 'Tema 03', 'Tema 04']);
    expect(options.every((option) => option.querySelectorAll('.theme-selector__swatches span').length === 4)).toBe(true);
    expect(options.every((option) => option.querySelector('.theme-selector__swatches')?.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('marks Theme 03 as default and selected without relying only on color', () => {
    open();
    const selected = fixture.nativeElement.querySelector('[aria-label="Tema 03"]');

    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(selected.textContent).toContain('Padrão');
    expect(selected.textContent).toContain('✓');
  });

  it('selects through PortalThemeService, updates aria-pressed and closes', () => {
    open();
    (fixture.nativeElement.querySelector('[aria-label="Tema 01"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(themeServiceStub.selectTheme).toHaveBeenCalledWith('01');
    expect(fixture.nativeElement.querySelector('#portal-theme-menu')).toBeNull();

    open();
    expect(fixture.nativeElement.querySelector('[aria-label="Tema 01"]').getAttribute('aria-pressed')).toBe('true');
  });

  it('closes on Escape', () => {
    open();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#portal-theme-menu')).toBeNull();
  });

  it('closes on an outside click', () => {
    open();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#portal-theme-menu')).toBeNull();
  });
});
