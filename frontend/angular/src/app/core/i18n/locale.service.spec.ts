import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LocaleService } from './locale.service';

describe('LocaleService', () => {
  const currentLang = signal<string | null>(null);
  const use = vi.fn((locale: string) => {
    currentLang.set(locale);
    return of({});
  });
  let service: LocaleService;
  let document: Document;

  beforeEach(() => {
    localStorage.clear();
    currentLang.set(null);
    use.mockClear();
    TestBed.configureTestingModule({
      providers: [
        LocaleService,
        { provide: TranslateService, useValue: { currentLang, use } },
      ],
    });
    service = TestBed.inject(LocaleService);
    document = TestBed.inject(DOCUMENT);
  });

  it('uses pt-BR when no locale is persisted', async () => {
    await service.initialize();
    expect(use).toHaveBeenCalledWith(DEFAULT_LOCALE);
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('uses a valid persisted en-US locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en-US');
    await service.initialize();
    expect(use).toHaveBeenCalledWith('en-US');
    expect(document.documentElement.lang).toBe('en-US');
  });

  it('falls back to pt-BR for an invalid persisted locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'es-ES');
    await service.initialize();
    expect(use).toHaveBeenCalledWith('pt-BR');
  });

  it('persists and synchronizes a successful explicit change', async () => {
    await service.setLocale('en-US');
    expect(use).toHaveBeenCalledWith('en-US');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en-US');
    expect(document.documentElement.lang).toBe('en-US');
  });

  it('preserves persistence and html lang when loading fails', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-BR');
    document.documentElement.lang = 'pt-BR';
    use.mockImplementationOnce(() => throwError(() => new Error('load failed')));

    await expect(service.setLocale('en-US')).rejects.toThrow('load failed');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
  });
});
