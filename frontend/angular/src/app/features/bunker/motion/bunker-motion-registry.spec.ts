import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BunkerMotionRegistry } from './bunker-motion-registry';

describe('BunkerMotionRegistry', () => {
  let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
  let removeEventListener: ReturnType<typeof vi.fn>;
  let initialReducedMotion = false;

  beforeEach(() => {
    removeEventListener = vi.fn();
    const mediaQuery = {
      get matches() { return initialReducedMotion; },
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        changeListener = listener;
      }),
      removeEventListener,
    } as unknown as MediaQueryList;
    TestBed.configureTestingModule({
      providers: [
        BunkerMotionRegistry,
        { provide: DOCUMENT, useValue: { defaultView: { matchMedia: () => mediaQuery } } },
      ],
    });
  });

  it('key nova ainda não foi executada', () => {
    const registry = TestBed.inject(BunkerMotionRegistry);
    expect(registry.hasPlayed('maps:lifetime')).toBe(false);
  });

  it('markPlayed torna a mesma key reconhecida', () => {
    const registry = TestBed.inject(BunkerMotionRegistry);
    registry.markPlayed('maps:lifetime');
    expect(registry.hasPlayed('maps:lifetime')).toBe(true);
  });

  it('keys diferentes permanecem independentes', () => {
    const registry = TestBed.inject(BunkerMotionRegistry);
    registry.markPlayed('maps:lifetime');
    expect(registry.hasPlayed('maps:season')).toBe(false);
  });

  it('lê reduced motion inicial', () => {
    initialReducedMotion = true;
    expect(TestBed.inject(BunkerMotionRegistry).reducedMotion()).toBe(true);
  });

  it('mudança da media query atualiza o signal', () => {
    const registry = TestBed.inject(BunkerMotionRegistry);
    changeListener?.({ matches: true } as MediaQueryListEvent);
    expect(registry.reducedMotion()).toBe(true);
  });

  it('cleanup remove o listener', () => {
    TestBed.inject(BunkerMotionRegistry);
    TestBed.resetTestingModule();
    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});
