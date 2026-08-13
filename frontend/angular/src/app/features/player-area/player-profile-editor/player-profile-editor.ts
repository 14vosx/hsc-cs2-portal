import { Component, effect, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
  imports: [FormField, UiCard, TranslatePipe],
  templateUrl: './player-profile-editor.html',
  styleUrl: './player-profile-editor.css',
})
export class PlayerProfileEditor {
  readonly profile = input.required<PlayerProfile>();
  readonly savePending = input<boolean>(false);
  readonly serverError = input<MappedProfileError | null>(null);

  readonly save = output<PlayerProfilePatch>();
  readonly editCancelled = output<void>();
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
    required(f.displayName, { message: 'playerProfile.validation.displayNameRequired' });
    maxLength(f.displayName, 255, { message: 'playerProfile.validation.displayNameMaxLength' });

    required(f.slug, { message: 'playerProfile.validation.slugRequired' });
    minLength(f.slug, 3, { message: 'playerProfile.validation.slugMinLength' });
    maxLength(f.slug, 64, { message: 'playerProfile.validation.slugMaxLength' });
    pattern(f.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'playerProfile.validation.slugPattern',
    });

    maxLength(f.bio, 500, { message: 'playerProfile.validation.bioMaxLength' });
    maxLength(f.discordHandle, 100, { message: 'playerProfile.validation.discordMaxLength' });

    validateTree(f, (ctx) => {
      const visibility = ctx.valueOf(f.visibility);
      const slug = ctx.valueOf(f.slug);

      if (visibility === 'public' && isTechnicalSlug(slug)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.slug),
          kind: 'public_profile_requires_custom_slug',
          message: 'playerProfile.validation.publicProfileRequiresCustomSlug',
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
      this.editCancelled.emit();
    }
  }
}
