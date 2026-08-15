import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PlayerIdentity } from '../../../player/domain/player-identity.model';
import type { AnalyticsContext } from '../../bunker-analytics.types';
import { BunkerAnalyticsHeader } from './bunker-analytics-header';

const TRANSLATIONS = {
  shared: { playerAvatar: { alt: 'Avatar de {{displayName}}' } },
  bunker: {
    header: { ariaLabel: 'Cabeçalho dos analytics do jogador', productName: 'Competitive Analytics' },
    contextSelector: {
      label: 'Contexto', ariaLabel: 'Contexto dos analytics', currentSeason: 'Season atual', lifetime: 'Lifetime',
    },
    labels: { playerFallback: 'Jogador HSC' },
    actions: { backToPlayerArea: 'Voltar para Área do Jogador' },
  },
} as const;

function player(overrides: Partial<PlayerIdentity> = {}): PlayerIdentity {
  return {
    displayName: 'L4VOSX',
    steamId64: '76561198104061526',
    avatarMedium: 'https://example.com/avatar.jpg',
    steamProfileUrl: null,
    ...overrides,
  };
}

describe('BunkerAnalyticsHeader', () => {
  let fixture: ComponentFixture<BunkerAnalyticsHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerAnalyticsHeader],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(BunkerAnalyticsHeader);
    fixture.componentRef.setInput('player', player());
    fixture.componentRef.setInput('context', 'season');
    fixture.componentRef.setInput('seasonName', 'Season 02');
    fixture.detectChanges();
  });

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const selector = (): HTMLSelectElement =>
    element().querySelector('app-bunker-context-selector select') as HTMLSelectElement;

  it('renderiza displayName e SteamID reais como identidade principal', () => {
    expect(element().querySelector('h1')?.textContent?.trim()).toBe('L4VOSX');
    expect(element().textContent).toContain('76561198104061526');
  });

  it('renderiza fallback de nome e avatar por iniciais quando a identidade estiver incompleta', () => {
    fixture.componentRef.setInput('player', player({ displayName: null, avatarMedium: null }));
    fixture.detectChanges();
    expect(element().querySelector('h1')?.textContent?.trim()).toBe('Jogador HSC');
    expect(element().querySelector('.player-avatar__fallback')?.textContent?.trim()).toBe('JH');
  });

  it('usa currentSeason no selector e mantém Lifetime disponível', () => {
    expect(Array.from(selector().options).map((option) => option.textContent?.trim())).toEqual([
      'Season 02',
      'Lifetime',
    ]);
  });

  it('usa Season atual como fallback visual quando o nome estiver ausente', () => {
    fixture.componentRef.setInput('seasonName', null);
    fixture.detectChanges();
    expect(selector().options[0].textContent?.trim()).toBe('Season atual');
  });

  it('repassa mudança de contexto corretamente', () => {
    const emitted: AnalyticsContext[] = [];
    fixture.componentInstance.contextChange.subscribe((context) => emitted.push(context));
    selector().value = 'lifetime';
    selector().dispatchEvent(new Event('change'));
    expect(emitted).toEqual(['lifetime']);
  });

  it('CTA aponta para a rota legítima da Área do Jogador', () => {
    const cta = element().querySelector<HTMLAnchorElement>('a');
    expect(cta?.getAttribute('href')).toBe('/area-do-jogador');
    expect(cta?.textContent).toContain('Voltar para Área do Jogador');
  });

  it('não apresenta badges ou classificações analíticas fictícias', () => {
    expect(element().querySelector('app-status-badge')).toBeNull();
    expect(element().textContent).not.toMatch(/Entry Fragger|Aggressive Rifler|Performance Rating|Competitive Tier/i);
  });
});
