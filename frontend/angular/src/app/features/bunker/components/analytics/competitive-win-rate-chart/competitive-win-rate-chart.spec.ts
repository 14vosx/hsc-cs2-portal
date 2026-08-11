import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartCoreComponent } from 'ng-apexcharts';
import { beforeEach, describe, expect, it } from 'vitest';

import { CompetitiveWinRateChart } from './competitive-win-rate-chart';

describe('CompetitiveWinRateChart', () => {
  let fixture: ComponentFixture<CompetitiveWinRateChart>;

  function render(value: number | null): void {
    fixture = TestBed.createComponent(CompetitiveWinRateChart);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitiveWinRateChart],
    }).compileComponents();
  });

  it('renderiza série radial a partir do Win Rate canônico', () => {
    render(0.5625);

    const chart = fixture.debugElement.query(By.directive(ChartCoreComponent))
      .componentInstance as ChartCoreComponent;

    expect(chart.series()).toEqual([56.25]);
  });

  it('mantém ausência quando Win Rate for null', () => {
    render(null);

    expect(fixture.debugElement.query(By.directive(ChartCoreComponent))).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('—');
  });
});
