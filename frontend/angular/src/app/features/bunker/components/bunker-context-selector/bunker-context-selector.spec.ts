import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AnalyticsContext } from '../../bunker-analytics.types';
import { BunkerContextSelector } from './bunker-context-selector';

describe('BunkerContextSelector', () => {
  let fixture: ComponentFixture<BunkerContextSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerContextSelector],
      providers: [provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { bunker: { contextSelector: {
      label: 'Contexto', ariaLabel: 'Contexto dos analytics', currentSeason: 'Season atual', lifetime: 'Lifetime',
    } } });
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(BunkerContextSelector);
    fixture.componentRef.setInput('context', 'season');
    fixture.detectChanges();
  });

  const select = (): HTMLSelectElement =>
    (fixture.nativeElement as HTMLElement).querySelector('select') as HTMLSelectElement;

  const selectContext = (context: AnalyticsContext): void => {
    select().value = context;
    select().dispatchEvent(new Event('change'));
  };

  it('expõe Season selecionada e Lifetime em select nativo acessível', () => {
    expect(select().getAttribute('aria-label')).toBe('Contexto dos analytics');
    expect(select().value).toBe('season');
    expect(Array.from(select().options).map((option) => option.textContent?.trim())).toEqual([
      'Season atual',
      'Lifetime',
    ]);
  });

  it('usa o nome de currentSeason quando disponível', () => {
    fixture.componentRef.setInput('seasonName', 'Season 02');
    fixture.detectChanges();
    expect(select().options[0].textContent?.trim()).toBe('Season 02');
  });

  it('emite Lifetime quando a seleção realmente muda', () => {
    const emitted: AnalyticsContext[] = [];
    fixture.componentInstance.contextChange.subscribe((context) => emitted.push(context));
    selectContext('lifetime');
    expect(emitted).toEqual(['lifetime']);
  });

  it('não emite quando o valor selecionado já está ativo', () => {
    const emitted: AnalyticsContext[] = [];
    fixture.componentInstance.contextChange.subscribe((context) => emitted.push(context));
    selectContext('season');
    expect(emitted).toEqual([]);
  });

  it('permite selecionar Season quando Lifetime está ativo', () => {
    fixture.componentRef.setInput('context', 'lifetime');
    fixture.detectChanges();
    const emitted: AnalyticsContext[] = [];
    fixture.componentInstance.contextChange.subscribe((context) => emitted.push(context));
    selectContext('season');
    expect(emitted).toEqual(['season']);
  });
});
