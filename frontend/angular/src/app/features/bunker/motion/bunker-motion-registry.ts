import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

@Injectable()
export class BunkerMotionRegistry {
  private readonly playedKeys = new Set<string>();
  private readonly reducedMotionState = signal(false);

  readonly reducedMotion = this.reducedMotionState.asReadonly();

  constructor() {
    const platformId = inject(PLATFORM_ID);
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    if (!isPlatformBrowser(platformId) || typeof document.defaultView?.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = document.defaultView.matchMedia(REDUCED_MOTION_QUERY);
    const updateReducedMotion = (event: MediaQueryListEvent | MediaQueryList): void => {
      this.reducedMotionState.set(event.matches);
    };

    updateReducedMotion(mediaQuery);
    mediaQuery.addEventListener('change', updateReducedMotion);
    destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', updateReducedMotion));
  }

  hasPlayed(key: string): boolean {
    return this.playedKeys.has(key);
  }

  markPlayed(key: string): void {
    this.playedKeys.add(key);
  }
}
