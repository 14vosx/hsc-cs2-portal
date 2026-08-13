import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerProfile } from '../../player/domain/player-profile.model';
import { PlayerProfileMediaEditor } from './player-profile-media-editor';

describe('PlayerProfileMediaEditor', () => {
  let fixture: ComponentFixture<PlayerProfileMediaEditor>;
  let createObjectUrl: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrl: ReturnType<typeof vi.spyOn>;

  const profile: PlayerProfile = {
    displayName: 'Player One',
    slug: 'player-one',
    bio: null,
    avatarUrl: '/media/avatar.webp',
    bannerUrl: '/media/banner.webp',
    discordHandle: null,
    preferredRole: 'rifler',
    preferredMap: 'de_mirage',
    visibility: 'public',
    joinedAt: null,
    createdAt: null,
    updatedAt: null,
  };

  beforeEach(async () => {
    createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((value) => `blob:${value instanceof File ? value.name : 'preview'}`);
    revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [PlayerProfileMediaEditor],
      providers: [provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', MEDIA_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', MEDIA_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(PlayerProfileMediaEditor);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza avatar e banner persistidos recebidos no profile', () => {
    const images = fixture.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>;

    expect(images[0].getAttribute('src')).toBe('/media/avatar.webp');
    expect(images[1].getAttribute('src')).toBe('/media/banner.webp');
  });

  it('cria preview e emite o arquivo selecionado para avatar', () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });
    const uploaded: File[] = [];
    const edited = vi.fn();
    fixture.componentInstance.avatarUpload.subscribe((value) => uploaded.push(value));
    fixture.componentInstance.mediaEdited.subscribe(edited);

    selectFile('avatar-section', file);
    clickButton('avatar-section', 'Enviar avatar');

    expect(createObjectUrl).toHaveBeenCalledWith(file);
    expect(section('avatar-section').querySelector('img')?.getAttribute('src')).toBe(
      'blob:avatar.webp',
    );
    expect(uploaded).toEqual([file]);
    expect(edited).toHaveBeenCalledOnce();
  });

  it('mantém seleção e preview de banner independentes do avatar', () => {
    const file = new File(['banner'], 'banner.png', { type: 'image/png' });
    const uploaded: File[] = [];
    fixture.componentInstance.bannerUpload.subscribe((value) => uploaded.push(value));

    selectFile('banner-section', file);
    clickButton('banner-section', 'Enviar banner');

    expect(section('banner-section').querySelector('img')?.getAttribute('src')).toBe(
      'blob:banner.png',
    );
    expect(section('avatar-section').querySelector('img')?.getAttribute('src')).toBe(
      '/media/avatar.webp',
    );
    expect(uploaded).toEqual([file]);
  });

  it('cancela preview local sem emitir remoção persistida e revoga a URL', () => {
    const removed = vi.fn();
    const edited = vi.fn();
    fixture.componentInstance.avatarRemove.subscribe(removed);
    fixture.componentInstance.mediaEdited.subscribe(edited);
    selectFile('avatar-section', new File(['avatar'], 'avatar.webp'));

    clickButton('avatar-section', 'Cancelar seleção');

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:avatar.webp');
    expect(section('avatar-section').querySelector('img')?.getAttribute('src')).toBe(
      '/media/avatar.webp',
    );
    expect(removed).not.toHaveBeenCalled();
    expect(edited).toHaveBeenCalledTimes(2);
  });

  it('emite remoções persistidas de avatar e banner separadamente', () => {
    const avatarRemoved = vi.fn();
    const bannerRemoved = vi.fn();
    fixture.componentInstance.avatarRemove.subscribe(avatarRemoved);
    fixture.componentInstance.bannerRemove.subscribe(bannerRemoved);

    clickButton('avatar-section', 'Remover avatar');
    clickButton('banner-section', 'Remover banner');

    expect(avatarRemoved).toHaveBeenCalledOnce();
    expect(bannerRemoved).toHaveBeenCalledOnce();
  });

  it('mantém controles de banner disponíveis enquanto avatar está pending e vice-versa', () => {
    fixture.componentRef.setInput('avatarPending', true);
    fixture.detectChanges();

    expect(fileInput('avatar-section').disabled).toBe(true);
    expect(fileInput('banner-section').disabled).toBe(false);

    fixture.componentRef.setInput('avatarPending', false);
    fixture.componentRef.setInput('bannerPending', true);
    fixture.detectChanges();

    expect(fileInput('avatar-section').disabled).toBe(false);
    expect(fileInput('banner-section').disabled).toBe(true);
  });

  it('mostra erros de avatar e banner como alertas nas áreas corretas', () => {
    fixture.componentRef.setInput('avatarError', 'playerProfile.media.errors.avatarTest');
    fixture.componentRef.setInput('bannerError', 'playerProfile.media.errors.bannerTest');
    fixture.detectChanges();

    expect(section('avatar-section').querySelector('[role="alert"]')?.textContent).toContain(
      'Falha no avatar',
    );
    expect(section('banner-section').querySelector('[role="alert"]')?.textContent).toContain(
      'Falha no banner',
    );
  });

  it('revoga object URLs ao substituir, cancelar e destruir', () => {
    selectFile('avatar-section', new File(['first'], 'first.webp'));
    selectFile('avatar-section', new File(['second'], 'second.webp'));
    selectFile('banner-section', new File(['banner'], 'banner.webp'));

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:first.webp');

    clickButton('avatar-section', 'Cancelar seleção');
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:second.webp');

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:banner.webp');
  });

  it('switches locale while preserving File identity, URLs, pending state and output semantics', async () => {
    const file = new File(['avatar'], 'canonical-avatar.webp', { type: 'image/webp' });
    const uploaded: File[] = [];
    fixture.componentInstance.avatarUpload.subscribe((value) => uploaded.push(value));
    fixture.componentRef.setInput('bannerPending', true);
    selectFile('avatar-section', file);

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.media-editor')?.getAttribute('aria-label')).toBe('Profile media');
    expect(section('avatar-section').querySelector('img')?.getAttribute('src')).toBe('blob:canonical-avatar.webp');
    expect(section('avatar-section').querySelector('img')?.getAttribute('alt')).toBe('Profile avatar preview');
    expect(section('banner-section').querySelector('img')?.getAttribute('src')).toBe('/media/banner.webp');
    expect(fileInput('banner-section').disabled).toBe(true);
    clickButton('avatar-section', 'Upload avatar');
    expect(uploaded).toEqual([file]);
    expect(uploaded[0]).toBe(file);
  });

  function section(testId: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
  }

  function fileInput(testId: string): HTMLInputElement {
    return section(testId).querySelector('input[type="file"]') as HTMLInputElement;
  }

  function selectFile(testId: string, file: File): void {
    const input = fileInput(testId);
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: { item: () => file, length: 1, 0: file },
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function clickButton(testId: string, label: string): void {
    const button = Array.from(section(testId).querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }
    button.click();
    fixture.detectChanges();
  }
});

const mediaTranslations = (english: boolean) => ({ playerProfile: { media: {
  ariaLabel: english ? 'Profile media' : 'Mídia do perfil', processing: english ? 'Processing...' : 'Processando...', cancelSelection: english ? 'Cancel selection' : 'Cancelar seleção',
  avatar: { title: 'Avatar', description: english ? 'Image displayed with your profile.' : 'Imagem exibida junto ao seu perfil.', previewAlt: english ? 'Profile avatar preview' : 'Prévia do avatar do perfil', empty: english ? 'No avatar' : 'Sem avatar', select: english ? 'Select avatar' : 'Selecionar avatar', upload: english ? 'Upload avatar' : 'Enviar avatar', remove: english ? 'Remove avatar' : 'Remover avatar' },
  banner: { title: 'Banner', description: english ? 'Horizontal profile highlight image.' : 'Imagem horizontal de destaque do perfil.', previewAlt: english ? 'Profile banner preview' : 'Prévia do banner do perfil', empty: english ? 'No banner' : 'Sem banner', select: english ? 'Select banner' : 'Selecionar banner', upload: english ? 'Upload banner' : 'Enviar banner', remove: english ? 'Remove banner' : 'Remover banner' },
  errors: { avatarTest: 'Falha no avatar', bannerTest: 'Falha no banner' },
} } });
const MEDIA_TRANSLATIONS = { 'pt-BR': mediaTranslations(false), 'en-US': mediaTranslations(true) } as const;
