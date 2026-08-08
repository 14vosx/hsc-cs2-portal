import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import type { MapSummary } from '../domain/map.model';
import { MapStatCard } from './map-stat-card';

@Component({
  imports: [MapStatCard],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<app-map-stat-card [map]="testMap" [highlight]="isHighlight" />`,
})
class TestHostComponent {
  testMap: MapSummary = {
    name: 'de_mirage',
    matches: 42,
    rounds: 920,
    averageRoundsPerMatch: 21.9,
    lastPlayedAt: '2026-08-04T12:00:00Z',
  };
  isHighlight = false;
}

describe('MapStatCard', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza o componente com estatísticas do mapa', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('de_mirage');
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('920');
    expect(el.textContent).toContain('21.9');
  });

  it('renderiza o link correto para o detalhe do mapa', () => {
    const link = fixture.nativeElement.querySelector('.map-stat-card__details-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/maps/de_mirage');
  });

  it('formata data válida no padrão BR', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('04/08/2026');
  });

  it('trata data inválida ou nula com fallback gracioso', () => {
    host.testMap = { ...host.testMap, lastPlayedAt: '' };
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sem data');
  });

  it('aplica a imagem de fundo para mapa conhecido', () => {
    const cardEl = fixture.nativeElement.querySelector('.map-stat-card') as HTMLElement;
    expect(cardEl.style.getPropertyValue('--map-bg')).toContain('de_mirage.png');
  });

  it('usa "none" para mapa desconhecido sem gerar imagem quebrada', () => {
    host.testMap = { ...host.testMap, name: 'de_custom_map' };
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector('.map-stat-card') as HTMLElement;
    expect(cardEl.style.getPropertyValue('--map-bg')).toBe('none');
  });

  it('aplica classe de destaque quando highlight é true', () => {
    host.isHighlight = true;
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector('.map-stat-card') as HTMLElement;
    expect(cardEl.classList.contains('map-stat-card--highlight')).toBe(true);
  });

  it('não muta o objeto MapSummary recebido no input', () => {
    const originalJson = JSON.stringify(host.testMap);
    fixture.detectChanges();
    expect(JSON.stringify(host.testMap)).toBe(originalJson);
  });
});
