import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import type { PlayerProfile } from '../../player/domain/player-profile.model';
import { PlayerProfileEditor } from './player-profile-editor';

describe('PlayerProfileEditor', () => {
  let component: PlayerProfileEditor;
  let fixture: ComponentFixture<PlayerProfileEditor>;

  const mockProfile: PlayerProfile = {
    displayName: 'Gaules',
    slug: 'gaules',
    bio: 'Tribo Gaules',
    avatarUrl: null,
    bannerUrl: null,
    discordHandle: 'gaules#1234',
    preferredRole: 'awper',
    preferredMap: 'de_train',
    visibility: 'public',
    joinedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('profile', mockProfile);
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('inicializa o modelo de edição com os dados do perfil', () => {
    expect(component['editModel']()).toEqual({
      displayName: 'Gaules',
      slug: 'gaules',
      bio: 'Tribo Gaules',
      discordHandle: 'gaules#1234',
      preferredRole: 'awper',
      preferredMap: 'de_train',
      visibility: 'public',
    });
  });

  it('valida regra cross-field de perfil público com slug técnico', () => {
    component['editModel'].update((m) => ({
      ...m,
      slug: 'player-1234567890abcdef1234567890abcdef',
      visibility: 'public',
    }));
    fixture.detectChanges();

    expect(component['profileForm']().invalid()).toBe(true);
  });

  it('permite slug técnico quando o perfil é privado', () => {
    component['editModel'].update((m) => ({
      ...m,
      slug: 'player-1234567890abcdef1234567890abcdef',
      visibility: 'private',
    }));
    fixture.detectChanges();

    expect(component['profileForm']().valid()).toBe(true);
  });

  it('emite evento save com patch ao submeter alterações válidas', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component['editModel'].update((m) => ({
      ...m,
      bio: 'Nova bio atualizada',
    }));
    fixture.detectChanges();

    const event = new Event('submit');
    component['onSubmit'](event);

    expect(saveSpy).toHaveBeenCalledWith({
      bio: 'Nova bio atualizada',
    });
  });

  it('não emite save quando não há diferenças efetivas', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const event = new Event('submit');
    component['onSubmit'](event);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('mapeia role/map vazios para null no patch ao submeter', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component['editModel'].update((m) => ({
      ...m,
      preferredRole: '',
      preferredMap: '',
    }));
    fixture.detectChanges();

    const event = new Event('submit');
    component['onSubmit'](event);

    expect(saveSpy).toHaveBeenCalledWith({
      preferredRole: null,
      preferredMap: null,
    });
  });

  it('emite evento cancel ao cancelar', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    component['onCancel']();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('emite edited quando o jogador altera o formulário após erro do servidor', () => {
    const editedSpy = vi.fn();
    component.edited.subscribe(editedSpy);

    fixture.componentRef.setInput('serverError', {
      targetField: 'slug',
      code: 'slug_unavailable',
      message: 'Este endereço de perfil já está em uso por outro jogador.',
    });
    fixture.detectChanges();

    const slugInput = (fixture.nativeElement as HTMLElement).querySelector(
      '#editor-slug',
    ) as HTMLInputElement;

    slugInput.value = 'outro-slug';
    slugInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(editedSpy).toHaveBeenCalledTimes(1);
  });


  it('desabilita os sete controles via Signal Forms enquanto o save está pendente', () => {
    fixture.componentRef.setInput('savePending', true);
    fixture.detectChanges();

    const controlIds = [
      'editor-displayName',
      'editor-slug',
      'editor-bio',
      'editor-discordHandle',
      'editor-visibility',
      'editor-preferredRole',
      'editor-preferredMap',
    ];

    for (const id of controlIds) {
      const control = (fixture.nativeElement as HTMLElement).querySelector(
        `#${id}`,
      ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

      expect(control, `controle #${id} deve existir`).not.toBeNull();
      expect(control?.disabled, `controle #${id} deve estar disabled`).toBe(true);
    }
  });


  it('submissão inválida marca o campo como touched e revela a validação', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const displayNameInput = host.querySelector(
      '#editor-displayName',
    ) as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    displayNameInput.value = '';
    displayNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(displayNameInput.getAttribute('aria-invalid')).not.toBe('true');

    form.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true,
      }),
    );

    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(displayNameInput.getAttribute('aria-invalid')).toBe('true');
    expect(host.textContent).toContain('Nome de exibição é obrigatório.');
  });

});
