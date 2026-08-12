import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocaleService } from '../../core/i18n/locale.service';
import { LocaleSwitcher } from './locale-switcher';

describe('LocaleSwitcher', () => {
  const currentLocale = signal<'pt-BR' | 'en-US'>('pt-BR');
  const setLocale = vi.fn(() => Promise.resolve());
  let fixture: ComponentFixture<LocaleSwitcher>;

  beforeEach(async () => {
    currentLocale.set('pt-BR');
    setLocale.mockClear();
    await TestBed.configureTestingModule({
      imports: [LocaleSwitcher],
      providers: [
        provideTranslateService(),
        { provide: LocaleService, useValue: { currentLocale, setLocale } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      locale: {
        ariaLabel: 'Idioma do portal',
        portuguese: 'Português (Brasil)',
        english: 'English (United States)',
      },
    });
    translate.use('pt-BR');
    fixture = TestBed.createComponent(LocaleSwitcher);
    fixture.detectChanges();
  });

  it('renders PT and EN with the current locale pressed', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(Array.from(buttons).map((button) => (button as HTMLButtonElement).textContent?.trim())).toEqual(['PT', 'EN']);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('requests en-US and pt-BR from the controls', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    buttons[0].click();
    expect(setLocale).toHaveBeenNthCalledWith(1, 'en-US');
    expect(setLocale).toHaveBeenNthCalledWith(2, 'pt-BR');
  });

  it('exposes the translated accessible group label', () => {
    expect(fixture.nativeElement.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Idioma do portal');
  });
});
