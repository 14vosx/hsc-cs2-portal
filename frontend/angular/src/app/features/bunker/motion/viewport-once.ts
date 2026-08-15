import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

@Directive({
  selector: '[appViewportOnce]',
  exportAs: 'viewportOnce',
  host: {
    '[style.min-block-size]': 'placeholderSize()',
  },
})
export class ViewportOnce {
  private readonly element = inject<ElementRef<Element>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enteredState = signal(false);
  private observer: IntersectionObserver | null = null;

  readonly hasEnteredViewport = this.enteredState.asReadonly();
  readonly placeholderSize = input('0px', { alias: 'appViewportOncePlaceholderSize' });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      this.enteredState.set(true);
      return;
    }

    afterNextRender(() => this.observe());
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  private observe(): void {
    if (typeof IntersectionObserver !== 'function') {
      this.enteredState.set(true);
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (this.enteredState() || !entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      this.enteredState.set(true);
      this.disconnect();
    }, { threshold: 0.15 });
    this.observer.observe(this.element.nativeElement);
  }

  private disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
