import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_PORTAL_THEME,
  PORTAL_THEME_IDS,
  PORTAL_THEME_STORAGE_KEY,
  PortalThemeService,
} from './portal-theme.service';

describe('PortalThemeService', () => {
  let document: Document;
  let service: PortalThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    document = TestBed.inject(DOCUMENT);
    delete document.documentElement.dataset['hscTheme'];
  });

  function createService(): PortalThemeService {
    service = TestBed.inject(PortalThemeService);
    return service;
  }

  it('defines Theme 03 as the default', () => {
    expect(DEFAULT_PORTAL_THEME).toBe('03');
  });

  it('applies only the default theme on construction, even with a stored preference', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, '01');

    createService();

    expect(document.documentElement.dataset['hscTheme']).toBe(DEFAULT_PORTAL_THEME);
    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBe('01');
  });

  it.each(PORTAL_THEME_IDS)('recognizes official theme %s', (theme) => {
    expect(createService().isThemeId(theme)).toBe(true);
  });

  it.each([null, undefined, '', '00', '05', 3])('rejects invalid theme %s', (theme) => {
    expect(createService().isThemeId(theme)).toBe(false);
  });

  it('applies and persists an explicit selection', () => {
    createService().selectTheme('02');

    expect(document.documentElement.dataset['hscTheme']).toBe('02');
    expect(service.appliedTheme()).toBe('02');
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBe('02');
  });

  it('reads a valid preference without applying it', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, '02');

    createService();

    expect(service.readPreference()).toBe('02');
    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
  });

  it('applyTheme updates the document without writing storage', () => {
    createService().applyTheme('01');

    expect(document.documentElement.dataset['hscTheme']).toBe('01');
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores a valid preference', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, '04');

    createService().restorePreference();

    expect(service.appliedTheme()).toBe('04');
  });

  it('falls back to the default for an invalid preference', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, 'legacy');

    createService().restorePreference();

    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
  });

  it('forces the default without deleting the retained preference', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, '01');

    createService().applyDefaultTheme();

    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBe('01');
  });

  it('continues applying a selection when storage writes fail', () => {
    createService();
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });

    service.selectTheme('04');

    expect(service.appliedTheme()).toBe('04');
    storageSpy.mockRestore();
  });

  it('restores the default when no preference exists', () => {
    createService().restorePreference();

    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
  });

  it('continues safely when storage reads fail', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });

    createService().restorePreference();

    expect(service.appliedTheme()).toBe(DEFAULT_PORTAL_THEME);
    storageSpy.mockRestore();
  });
});
