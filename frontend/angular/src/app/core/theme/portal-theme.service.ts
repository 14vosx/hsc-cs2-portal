import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export const PORTAL_THEME_IDS = ['01', '02', '03', '04'] as const;
export type PortalThemeId = (typeof PORTAL_THEME_IDS)[number];
export const DEFAULT_PORTAL_THEME: PortalThemeId = '03';
export const PORTAL_THEME_STORAGE_KEY = 'hsc-portal-theme';

@Injectable({ providedIn: 'root' })
export class PortalThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly appliedThemeState = signal<PortalThemeId>(DEFAULT_PORTAL_THEME);

  readonly appliedTheme = this.appliedThemeState.asReadonly();

  constructor() {
    this.applyTheme(DEFAULT_PORTAL_THEME);
  }

  isThemeId(value: unknown): value is PortalThemeId {
    return typeof value === 'string' && PORTAL_THEME_IDS.includes(value as PortalThemeId);
  }

  readPreference(): PortalThemeId | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(PORTAL_THEME_STORAGE_KEY);
      return this.isThemeId(value) ? value : null;
    } catch {
      return null;
    }
  }

  applyTheme(theme: PortalThemeId): void {
    this.document.documentElement.dataset['hscTheme'] = theme;
    this.appliedThemeState.set(theme);
  }

  selectTheme(theme: PortalThemeId): void {
    this.applyTheme(theme);

    try {
      this.document.defaultView?.localStorage.setItem(PORTAL_THEME_STORAGE_KEY, theme);
    } catch {
      // Applying the theme remains available when browser storage is unavailable.
    }
  }

  applyDefaultTheme(): void {
    this.applyTheme(DEFAULT_PORTAL_THEME);
  }

  restorePreference(): void {
    this.applyTheme(this.readPreference() ?? DEFAULT_PORTAL_THEME);
  }
}
