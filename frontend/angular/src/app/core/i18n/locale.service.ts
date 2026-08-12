import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export const SUPPORTED_LOCALES = ['pt-BR', 'en-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';
export const LOCALE_STORAGE_KEY = 'hsc.portal.locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  readonly currentLocale = computed<SupportedLocale>(() => {
    const locale = this.translate.currentLang();
    return this.isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  });

  initialize(): Promise<void> {
    return this.activate(this.readPersistedLocale());
  }

  async setLocale(locale: SupportedLocale): Promise<void> {
    if (locale === this.translate.currentLang()) {
      return;
    }

    await this.activate(locale);
    this.storage?.setItem(LOCALE_STORAGE_KEY, locale);
  }

  private async activate(locale: SupportedLocale): Promise<void> {
    await firstValueFrom(this.translate.use(locale));
    this.document.documentElement.lang = locale;
  }

  private readPersistedLocale(): SupportedLocale {
    const locale = this.storage?.getItem(LOCALE_STORAGE_KEY);
    return this.isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  }

  private isSupportedLocale(locale: unknown): locale is SupportedLocale {
    return (
      typeof locale === 'string' &&
      SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    );
  }

  private get storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
