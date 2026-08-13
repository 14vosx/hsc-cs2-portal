import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';
import { PlayerAvatar } from './player-avatar';

describe('PlayerAvatar', () => {
  let fixture: ComponentFixture<PlayerAvatar>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerAvatar],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', AVATAR_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', AVATAR_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(PlayerAvatar);
  });

  it('renders an image with an appropriate alt', () => {
    fixture.componentRef.setInput('displayName', 'Player One');
    fixture.componentRef.setInput('imageUrl', 'avatar.jpg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('alt')).toBe('Avatar de Player One');
  });

  it('renders initials as fallback', () => {
    fixture.componentRef.setInput('displayName', 'Player One');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-avatar__fallback')?.textContent.trim()).toBe('PO');
  });

  it('switches locale on the same avatar without changing identity, source, or fallback initials', async () => {
    fixture.componentRef.setInput('displayName', 'Player One');
    fixture.componentRef.setInput('imageUrl', 'avatar.jpg');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    const source = image.getAttribute('src');
    expect(image.getAttribute('alt')).toBe('Avatar de Player One');

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(image.getAttribute('alt')).toBe('Player One avatar');
    expect(image.getAttribute('src')).toBe(source);

    fixture.componentRef.setInput('imageUrl', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-avatar__fallback')?.textContent.trim()).toBe('PO');
  });

  it('uses the locale-neutral HSC default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-avatar__fallback')?.textContent.trim()).toBe('H');
  });
});

const AVATAR_TRANSLATIONS = {
  'pt-BR': { shared: { playerAvatar: { alt: 'Avatar de {{displayName}}' } } },
  'en-US': { shared: { playerAvatar: { alt: '{{displayName}} avatar' } } },
} as const;
