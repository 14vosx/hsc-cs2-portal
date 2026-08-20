import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { LucidePalette } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DEFAULT_PORTAL_THEME,
  PORTAL_THEME_IDS,
  PortalThemeService,
  type PortalThemeId,
} from '../../core/theme/portal-theme.service';

@Component({
  selector: 'app-theme-selector',
  imports: [LucidePalette, TranslatePipe],
  templateUrl: './theme-selector.html',
  styleUrl: './theme-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSelector {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly themeService = inject(PortalThemeService);

  protected readonly themes = PORTAL_THEME_IDS;
  protected readonly defaultTheme = DEFAULT_PORTAL_THEME;
  protected readonly isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected select(theme: PortalThemeId): void {
    this.themeService.selectTheme(theme);
    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
  }
}
