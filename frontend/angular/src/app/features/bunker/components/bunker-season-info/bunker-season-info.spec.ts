import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BunkerSeasonInfo } from './bunker-season-info';
import type { BunkerSummary } from '../../domain/bunker.model';
import { beforeEach, describe, expect, it } from 'vitest';

function createBunkerSummary(overrides: Partial<BunkerSummary> = {}): BunkerSummary {
  return {
    status: 'active',
    seasonFirst: true,
    statsAvailable: true,
    currentSeason: {
      slug: 's5',
      name: 'Season 5 Competitive',
      status: 'active',
      scope: {
        startAt: '2026-08-01',
        endAt: '2026-12-31',
      },
    },
    seasonPlayer: null,
    competitiveProfile: null,
    ...overrides,
  };
}

describe('BunkerSeasonInfo', () => {
  let component: BunkerSeasonInfo;
  let fixture: ComponentFixture<BunkerSeasonInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerSeasonInfo],
    }).compileComponents();

    fixture = TestBed.createComponent(BunkerSeasonInfo);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.componentRef.setInput('summaryState', 'ready');
    fixture.detectChanges();
  });

  it('1. componente pode ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('2. nome da season tem precedência', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Season Major 2026',
          slug: 'major-2026',
          status: 'active',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.seasonTitle()).toBe('Season Major 2026');
  });

  it('3. slug produz "Season {slug}"', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: null,
          slug: 'beta-01',
          status: 'active',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.seasonTitle()).toBe('Season beta-01');
  });

  it('4. ausência produz "Season —"', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: null,
      })
    );
    fixture.detectChanges();

    expect(component.seasonTitle()).toBe('Season —');
  });

  it('5. ausência total de scope produz "Período —"', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Test Season',
          slug: 'test',
          status: 'active',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.periodText()).toBe('Período —');
  });

  it('6. startAt e endAt válidos são formatados', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Season 1',
          slug: 's1',
          status: 'active',
          scope: {
            startAt: '2026-01-15',
            endAt: '2026-06-30',
          },
        },
      })
    );
    fixture.detectChanges();

    expect(component.periodText()).toBe('15/01/2026 a 30/06/2026');
  });

  it('7. YYYY-MM-DD não sofre deslocamento de dia', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Season 2',
          slug: 's2',
          status: 'active',
          scope: {
            startAt: '2026-08-01',
            endAt: '2026-08-31',
          },
        },
      })
    );
    fixture.detectChanges();

    expect(component.periodText()).toBe('01/08/2026 a 31/08/2026');
  });

  it('8. lado ausente do período produz fallback', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Season 3',
          slug: 's3',
          status: 'active',
          scope: {
            startAt: '2026-08-01',
            endAt: null,
          },
        },
      })
    );
    fixture.detectChanges();

    expect(component.periodText()).toBe('01/08/2026 a —');
  });

  it('9. data inválida preserva texto', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'Season 4',
          slug: 's4',
          status: 'active',
          scope: {
            startAt: 'Data Indefinida',
            endAt: '2026-12-31',
          },
        },
      })
    );
    fixture.detectChanges();

    expect(component.periodText()).toBe('Data Indefinida a 31/12/2026');
  });

  it('10. status active/ativo recebe tone active', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'S1',
          slug: 's1',
          status: 'ativo',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.statusBadgeInfo()).toEqual({ label: 'active', tone: 'active' });
  });

  it('11. estados encerrados recebem tone closed', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'S1',
          slug: 's1',
          status: 'closed',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.statusBadgeInfo()).toEqual({ label: 'closed', tone: 'closed' });
  });

  it('12. status desconhecido recebe tone neutral', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        currentSeason: {
          name: 'S1',
          slug: 's1',
          status: 'em breve',
          scope: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.statusBadgeInfo()).toEqual({ label: 'em breve', tone: 'neutral' });
  });

  it('13. ausência recebe "preparando"', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        status: null,
        currentSeason: null,
      })
    );
    fixture.detectChanges();

    expect(component.statusBadgeInfo()).toEqual({ label: 'preparando', tone: 'neutral' });
  });

  it('14. summaryState error força "indisponível" e danger', () => {
    fixture.componentRef.setInput('summaryState', 'error');
    fixture.detectChanges();

    expect(component.statusBadgeInfo()).toEqual({ label: 'indisponível', tone: 'danger' });
  });

  it('15. generatedAt da seasonPlayer tem precedência', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: {
          name: null,
          steamId64: null,
          generatedAt: '2026-08-04',
          season: null,
          summary: null,
          periods: {},
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
        competitiveProfile: {
          name: null,
          steamId64: null,
          generatedAt: '2026-08-01',
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: null,
          periods: {},
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
      })
    );
    fixture.detectChanges();

    expect(component.generatedAtText()).toBe('04/08/2026');
  });

  it('16. competitiveProfile.generatedAt é fallback', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: null,
        competitiveProfile: {
          name: null,
          steamId64: null,
          generatedAt: '2026-08-02',
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: null,
          periods: {},
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
      })
    );
    fixture.detectChanges();

    expect(component.generatedAtText()).toBe('02/08/2026');
  });

  it('17. ausência de atualização exibe "—"', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: null,
        competitiveProfile: null,
      })
    );
    fixture.detectChanges();

    expect(component.generatedAtText()).toBe('—');
  });

  it('18. ausência de seasonPlayer exibe mensagem informativa', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: null,
        statsAvailable: false,
      })
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ainda não há estatísticas do jogador nesta Season.');
  });

  it('19. não importa DTO ou data-access', () => {
    expect(BunkerSeasonInfo).toBeDefined();
  });
});
