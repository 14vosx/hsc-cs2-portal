import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewportOnce } from './viewport-once';

@Component({
  imports: [ViewportOnce],
  template: `<div appViewportOnce #viewport="viewportOnce">{{ viewport.hasEnteredViewport() }}</div>`,
})
class ViewportHost {}

describe('ViewportOnce', () => {
  let fixture: ComponentFixture<ViewportHost>;
  let callback: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;
  let observe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    disconnect = vi.fn();
    observe = vi.fn();
    class IntersectionObserverMock {
      constructor(next: IntersectionObserverCallback) {
        callback = next;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [0.15];
    }
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    await TestBed.configureTestingModule({ imports: [ViewportHost] }).compileComponents();
    fixture = TestBed.createComponent(ViewportHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('cria observer no browser', () => {
    expect(observe).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('false');
  });

  it('primeira interseção libera estado e desconecta', () => {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('true');
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('segunda interseção não cria replay', () => {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('destroy faz cleanup', () => {
    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('ausência de IntersectionObserver usa fallback funcional', async () => {
    fixture.destroy();
    vi.stubGlobal('IntersectionObserver', undefined);
    fixture = TestBed.createComponent(ViewportHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('true');
  });
});
