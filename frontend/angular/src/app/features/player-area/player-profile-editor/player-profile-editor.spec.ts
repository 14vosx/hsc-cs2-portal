import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
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

  const changeSelect = (select: HTMLSelectElement, value: string): void => {
    select.value = value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileEditor],
      providers: [provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', EDITOR_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', EDITOR_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));

    fixture = TestBed.createComponent(PlayerProfileEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('profile', mockProfile);
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('inicializa o modelo de edição com os dados do perfil', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector<HTMLInputElement>('#editor-displayName')?.value).toBe('Gaules');
    expect(host.querySelector<HTMLInputElement>('#editor-slug')?.value).toBe('gaules');
    expect(host.querySelector<HTMLTextAreaElement>('#editor-bio')?.value).toBe('Tribo Gaules');
    expect(host.querySelector<HTMLInputElement>('#editor-discordHandle')?.value).toBe('gaules#1234');
    expect(host.querySelector<HTMLSelectElement>('#editor-preferredRole')?.value).toBe('awper');
    expect(host.querySelector<HTMLSelectElement>('#editor-preferredMap')?.value).toBe('de_train');
    expect(host.querySelector<HTMLSelectElement>('#editor-visibility')?.value).toBe('public');
  });

  it('valida regra cross-field de perfil público com slug técnico', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const host = fixture.nativeElement as HTMLElement;
    const slugInput = host.querySelector<HTMLInputElement>('#editor-slug')!;
    const visibilitySelect = host.querySelector<HTMLSelectElement>('#editor-visibility')!;
    const form = host.querySelector<HTMLFormElement>('form')!;

    slugInput.value = 'player-1234567890abcdef1234567890abcdef';
    slugInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    changeSelect(visibilitySelect, 'public');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(slugInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('permite slug técnico quando o perfil é privado', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const host = fixture.nativeElement as HTMLElement;
    const slugInput = host.querySelector<HTMLInputElement>('#editor-slug')!;
    const visibilitySelect = host.querySelector<HTMLSelectElement>('#editor-visibility')!;
    const form = host.querySelector<HTMLFormElement>('form')!;

    slugInput.value = 'player-1234567890abcdef1234567890abcdef';
    slugInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    changeSelect(visibilitySelect, 'private');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).toHaveBeenCalledWith({
      slug: 'player-1234567890abcdef1234567890abcdef',
      visibility: 'private',
    });
  });

  it('emite evento save com patch ao submeter alterações válidas', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const host = fixture.nativeElement as HTMLElement;
    const bioInput = host.querySelector<HTMLTextAreaElement>('#editor-bio')!;
    const form = host.querySelector<HTMLFormElement>('form')!;

    bioInput.value = 'Nova bio atualizada';
    bioInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).toHaveBeenCalledWith({
      bio: 'Nova bio atualizada',
    });
  });

  it('não emite save quando não há diferenças efetivas', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const host = fixture.nativeElement as HTMLElement;
    const form = host.querySelector<HTMLFormElement>('form')!;

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('mapeia role/map vazios para null no patch ao submeter', async () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const host = fixture.nativeElement as HTMLElement;
    const roleSelect = host.querySelector<HTMLSelectElement>('#editor-preferredRole')!;
    const mapSelect = host.querySelector<HTMLSelectElement>('#editor-preferredMap')!;
    const form = host.querySelector<HTMLFormElement>('form')!;

    changeSelect(roleSelect, '');
    changeSelect(mapSelect, '');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).toHaveBeenCalledWith({
      preferredRole: null,
      preferredMap: null,
    });
  });

  it('emite editCancelled cancel ao cancelar', () => {
    const cancelSpy = vi.fn();
    component.editCancelled.subscribe(cancelSpy);

    const cancelButton = fixture.nativeElement.querySelector(
      '.player-profile-editor__button--secondary'
    ) as HTMLButtonElement;
    expect(cancelButton).toBeTruthy();
    cancelButton.click();
    fixture.detectChanges();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('emite edited quando o jogador altera o formulário após erro do servidor', () => {
    const editedSpy = vi.fn();
    component.edited.subscribe(editedSpy);

    fixture.componentRef.setInput('serverError', {
      targetField: 'slug',
      code: 'slug_unavailable',
      message: 'playerProfile.errors.slugUnavailable',
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

  it('switches locale without changing canonical form values, options, or PATCH semantics', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const bioInput = host.querySelector<HTMLTextAreaElement>('#editor-bio')!;
    const roleSelect = host.querySelector<HTMLSelectElement>('#editor-preferredRole')!;
    const form = host.querySelector<HTMLFormElement>('form')!;

    bioInput.value = 'Updated bio';
    bioInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    changeSelect(roleSelect, 'igl');

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    expect(host.textContent).toContain('Edit your HSC profile');

    expect(host.querySelector<HTMLInputElement>('#editor-displayName')?.value).toBe('Gaules');
    expect(host.querySelector<HTMLInputElement>('#editor-slug')?.value).toBe('gaules');
    expect(host.querySelector<HTMLTextAreaElement>('#editor-bio')?.value).toBe('Updated bio');
    expect(host.querySelector<HTMLInputElement>('#editor-discordHandle')?.value).toBe('gaules#1234');
    expect(host.querySelector<HTMLSelectElement>('#editor-preferredRole')?.value).toBe('igl');
    expect(host.querySelector<HTMLSelectElement>('#editor-preferredMap')?.value).toBe('de_train');
    expect(host.querySelector<HTMLSelectElement>('#editor-visibility')?.value).toBe('public');

    const roleOptions = Array.from(host.querySelectorAll<HTMLOptionElement>('#editor-preferredRole option'));
    const mapOptions = Array.from(host.querySelectorAll<HTMLOptionElement>('#editor-preferredMap option'));
    expect(roleOptions.find((option) => option.textContent?.trim() === 'IGL')?.value).toBe('igl');
    expect(roleOptions.find((option) => option.textContent?.trim() === 'Entry Fragger')?.value).toBe('entry_fragger');
    expect(mapOptions.find((option) => option.textContent?.trim() === 'Train')?.value).toBe('de_train');

    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveSpy).toHaveBeenCalledWith({ bio: 'Updated bio', preferredRole: 'igl' });
  });
});

const editorTranslations = (english: boolean) => ({ playerProfile: {
  editor: { eyebrow: english ? 'Profile Editing' : 'Edição de Perfil', title: english ? 'Edit your HSC profile' : 'Editar seu perfil HSC', description: english ? 'Update your profile.' : 'Atualize suas informações.', cancel: english ? 'Cancel' : 'Cancelar', saving: english ? 'Saving...' : 'Salvando...', save: english ? 'Save profile' : 'Salvar perfil' },
  fields: { displayName: english ? 'Display name' : 'Nome de exibição', slug: english ? 'Profile address (slug)' : 'Endereço do perfil (slug)', slugHelp: english ? 'Used to identify your HSC profile.' : 'Usado para identificar seu perfil no HSC.', bio: english ? 'Bio' : 'Biografia', discordPlaceholder: english ? 'e.g. user' : 'ex: usuario', visibility: english ? 'Profile visibility' : 'Visibilidade do perfil', preferredRole: english ? 'Preferred role' : 'Função preferida', preferredMap: english ? 'Preferred map' : 'Mapa preferido' },
  visibility: { private: english ? 'Private (only you)' : 'Privado (apenas você)', public: english ? 'Visible to HSC members' : 'Visível para membros HSC' },
  roles: { none: english ? 'None selected' : 'Nenhuma selecionada', awper: 'AWPer', rifler: 'Rifler', entry_fragger: 'Entry Fragger', lurker: 'Lurker', support: 'Support', igl: 'IGL', anchor: 'Anchor' }, maps: { none: english ? 'None selected' : 'Nenhum selecionado' },
  validation: { displayNameRequired: english ? 'Display name is required.' : 'Nome de exibição é obrigatório.', displayNameMaxLength: 'max', displayNameInvalid: 'invalid', slugRequired: 'required', slugMinLength: 'min', slugMaxLength: 'max', slugPattern: 'pattern', slugInvalid: 'invalid', bioMaxLength: 'max', bioInvalid: 'invalid', discordMaxLength: 'max', discordInvalid: 'invalid', publicProfileRequiresCustomSlug: 'custom slug required' },
  errors: { slugUnavailable: english ? 'Profile address unavailable.' : 'Este endereço de perfil já está em uso por outro jogador.' },
} });
const EDITOR_TRANSLATIONS = { 'pt-BR': editorTranslations(false), 'en-US': editorTranslations(true) } as const;
