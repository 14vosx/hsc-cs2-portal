import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    }).compileComponents();

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
    fixture.componentRef.setInput('avatarError', 'Falha no avatar');
    fixture.componentRef.setInput('bannerError', 'Falha no banner');
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
