import { Component, effect, input, output, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  required,
  minLength,
  maxLength,
  pattern,
  validateTree,
  submit,
} from '@angular/forms/signals';

import {
  PREFERRED_MAPS,
  PREFERRED_ROLES,
  type PlayerProfile,
  type PlayerProfilePatch,
} from '../../player/domain/player-profile.model';
import {
  createPlayerProfileEditModel,
  buildPlayerProfilePatch,
  isTechnicalSlug,
  type PlayerProfileEditModel,
} from './player-profile-edit.model';
import type { MappedProfileError } from '../player-profile-update-error';
import { UiCard } from '../../../shared/components/card/card';

@Component({
  selector: 'app-player-profile-editor',
  standalone: true,
  imports: [FormField, UiCard],
  templateUrl: './player-profile-editor.html',
  styleUrl: './player-profile-editor.css',
})
export class PlayerProfileEditor {
  readonly profile = input.required<PlayerProfile>();
  readonly savePending = input<boolean>(false);
  readonly serverError = input<MappedProfileError | null>(null);

  readonly save = output<PlayerProfilePatch>();
  readonly cancel = output<void>();
  readonly edited = output<void>();

  protected readonly roleOptions = PREFERRED_ROLES;
  protected readonly mapOptions = PREFERRED_MAPS;

  protected readonly editModel = signal<PlayerProfileEditModel>({
    displayName: '',
    slug: '',
    bio: '',
    discordHandle: '',
    preferredRole: '',
    preferredMap: '',
    visibility: 'private',
  });

  private readonly syncProfileEffect = effect(() => {
    this.editModel.set(createPlayerProfileEditModel(this.profile()));
  });

  protected readonly profileForm = form(this.editModel, (f) => {
    disabled(f.displayName, { when: () => this.savePending() });
    disabled(f.slug, { when: () => this.savePending() });
    disabled(f.bio, { when: () => this.savePending() });
    disabled(f.discordHandle, { when: () => this.savePending() });
    disabled(f.visibility, { when: () => this.savePending() });
    disabled(f.preferredRole, { when: () => this.savePending() });
    disabled(f.preferredMap, { when: () => this.savePending() });
    required(f.displayName, { message: 'Nome de exibição é obrigatório.' });
    maxLength(f.displayName, 255, { message: 'Nome de exibição deve ter no máximo 255 caracteres.' });

    required(f.slug, { message: 'Endereço do perfil (slug) é obrigatório.' });
    minLength(f.slug, 3, { message: 'Slug deve ter pelo menos 3 caracteres.' });
    maxLength(f.slug, 64, { message: 'Slug deve ter no máximo 64 caracteres.' });
    pattern(f.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug deve conter apenas letras minúsculas, números e hífens (ex: meu-slug).',
    });

    maxLength(f.bio, 500, { message: 'Biografia deve ter no máximo 500 caracteres.' });
    maxLength(f.discordHandle, 100, { message: 'Discord handle deve ter no máximo 100 caracteres.' });

    validateTree(f, (ctx) => {
      const visibility = ctx.valueOf(f.visibility);
      const slug = ctx.valueOf(f.slug);

      if (visibility === 'public' && isTechnicalSlug(slug)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.slug),
          kind: 'public_profile_requires_custom_slug',
          message:
            'Para tornar o perfil visível para membros HSC, você precisa escolher um endereço de perfil personalizado.',
        };
      }

      return null;
    });
  });

  protected onUserEdit(): void {
    if (this.serverError()) {
      this.edited.emit();
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.savePending()) {
      return;
    }

    await submit(this.profileForm, async (field) => {
      const patch = buildPlayerProfilePatch(field().value(), this.profile());

      if (patch) {
        this.save.emit(patch);
      }
    });
  }

  protected onCancel(): void {
    if (!this.savePending()) {
      this.cancel.emit();
    }
  }
}
