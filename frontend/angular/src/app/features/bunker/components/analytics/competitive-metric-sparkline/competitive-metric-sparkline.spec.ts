import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartCoreComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { beforeEach, describe, expect, it } from 'vitest';

import { CompetitiveMetricSparkline } from './competitive-metric-sparkline';

describe('CompetitiveMetricSparkline', () => {
  let fixture: ComponentFixture<CompetitiveMetricSparkline>;

  function render(values: readonly (number | null)[], color: 'cyan' | 'orange' = 'cyan'): void {
    fixture = TestBed.createComponent(CompetitiveMetricSparkline);
    fixture.componentRef.setInput('values', values);
    fixture.componentRef.setInput('color', color);
    fixture.detectChanges();
  }

  function axisSeries(chart: ChartCoreComponent): ApexAxisChartSeries {
    return chart.series() as unknown as ApexAxisChartSeries;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitiveMetricSparkline],
    }).compileComponents();
  });

  it('repassa a sequência canônica preservando null', () => {
    render([0.9, null, 1.2]);

    const chart = fixture.debugElement.query(By.directive(ChartCoreComponent))
      .componentInstance as ChartCoreComponent;

    expect(axisSeries(chart)[0].data).toEqual([0.9, null, 1.2]);
  });

  it('não renderiza chart quando a sequência não possui valor canônico', () => {
    render([null, null]);

    expect(fixture.debugElement.query(By.directive(ChartCoreComponent))).toBeNull();
  });
});
