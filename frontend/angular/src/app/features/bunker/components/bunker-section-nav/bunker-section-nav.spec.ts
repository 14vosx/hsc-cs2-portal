import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsTab } from '../../bunker-analytics.types';
import { BunkerSectionNav } from './bunker-section-nav';

describe('BunkerSectionNav', () => {
  let fixture: ComponentFixture<BunkerSectionNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerSectionNav],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { bunker: { navigation: {
      ariaLabel: 'Navegação analítica', overview: 'Visão Geral', combat: 'Clutch + Multi-kill', maps: 'Mapas', matches: 'Histórico de Partidas',
    } } });
    translate.setTranslation('en-US', { bunker: { navigation: {
      ariaLabel: 'Analytics navigation', overview: 'Overview', combat: 'Clutch & Multi-kill', maps: 'Maps', matches: 'Match History',
    } } });
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(BunkerSectionNav);
    fixture.componentRef.setInput('activeTab', 'overview');
    fixture.detectChanges();
  });

  const tabs = (): HTMLButtonElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]'));

  it('renderiza tablist acessível com quatro buttons', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="tablist"]')).toBeTruthy();
    expect(tabs().map((tab) => tab.textContent?.trim())).toEqual(['Visão Geral', 'Clutch + Multi-kill', 'Mapas', 'Histórico de Partidas']);
    expect(tabs().every((tab) => tab.tagName === 'BUTTON')).toBe(true);
  });

  it('expõe seleção e roving tabindex', () => {
    expect(tabs().map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('emite tabChange no click', () => {
    const emitted: AnalyticsTab[] = [];
    fixture.componentInstance.tabChange.subscribe((tab) => emitted.push(tab));
    tabs()[1].click();
    expect(emitted).toEqual(['combat']);
  });

  it.each([
    ['ArrowRight', 0, 'combat'],
    ['ArrowLeft', 0, 'matches'],
    ['Home', 2, 'overview'],
    ['End', 1, 'matches'],
  ] as const)('%s move foco e emite a tab esperada', (key, startIndex, expected) => {
    const emitted: AnalyticsTab[] = [];
    fixture.componentInstance.tabChange.subscribe((tab) => emitted.push(tab));
    const preventDefault = vi.fn();
    fixture.componentInstance.handleKeydown({ key, preventDefault } as unknown as KeyboardEvent, startIndex);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitted).toEqual([expected]);
    expect(document.activeElement?.id).toBe(`bunker-tab-${expected}`);
  });

  it('traduz labels sem texto português hardcoded no componente', async () => {
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(tabs().map((tab) => tab.textContent?.trim())).toEqual(['Overview', 'Clutch & Multi-kill', 'Maps', 'Match History']);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Visão Geral');
  });
});
