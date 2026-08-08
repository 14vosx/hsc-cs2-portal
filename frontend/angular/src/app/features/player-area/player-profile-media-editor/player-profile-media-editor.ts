import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { PlayerProfile } from '../../player/domain/player-profile.model';

@Component({
  selector: 'app-player-profile-media-editor',
  standalone: true,
  templateUrl: './player-profile-media-editor.html',
  styleUrl: './player-profile-media-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerProfileMediaEditor {
  readonly profile = input.required<PlayerProfile>();
  readonly avatarPending = input(false);
  readonly bannerPending = input(false);
  readonly avatarError = input<string | null>(null);
  readonly bannerError = input<string | null>(null);

  readonly avatarUpload = output<File>();
  readonly avatarRemove = output<void>();
  readonly bannerUpload = output<File>();
  readonly bannerRemove = output<void>();
  readonly mediaEdited = output<void>();

  protected readonly avatarFile = signal<File | null>(null);
  protected readonly avatarPreviewUrl = signal<string | null>(null);
  protected readonly bannerFile = signal<File | null>(null);
  protected readonly bannerPreviewUrl = signal<string | null>(null);

  private readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');
  private readonly bannerInput = viewChild<ElementRef<HTMLInputElement>>('bannerInput');
  private previousAvatarUrl: string | null | undefined;
  private previousBannerUrl: string | null | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const avatarUrl = this.profile().avatarUrl;
      const bannerUrl = this.profile().bannerUrl;

      if (this.previousAvatarUrl !== undefined && avatarUrl !== this.previousAvatarUrl) {
        this.clearAvatarSelection(false);
      }
      if (this.previousBannerUrl !== undefined && bannerUrl !== this.previousBannerUrl) {
        this.clearBannerSelection(false);
      }

      this.previousAvatarUrl = avatarUrl;
      this.previousBannerUrl = bannerUrl;
    });

    destroyRef.onDestroy(() => {
      this.revokePreview(this.avatarPreviewUrl());
      this.revokePreview(this.bannerPreviewUrl());
    });
  }

  protected selectAvatar(event: Event): void {
    const file = this.selectedFile(event);
    if (!file) {
      return;
    }

    this.revokePreview(this.avatarPreviewUrl());
    this.avatarFile.set(file);
    this.avatarPreviewUrl.set(URL.createObjectURL(file));
    this.mediaEdited.emit();
  }

  protected selectBanner(event: Event): void {
    const file = this.selectedFile(event);
    if (!file) {
      return;
    }

    this.revokePreview(this.bannerPreviewUrl());
    this.bannerFile.set(file);
    this.bannerPreviewUrl.set(URL.createObjectURL(file));
    this.mediaEdited.emit();
  }

  protected submitAvatar(): void {
    const file = this.avatarFile();
    if (file && !this.avatarPending()) {
      this.avatarUpload.emit(file);
    }
  }

  protected submitBanner(): void {
    const file = this.bannerFile();
    if (file && !this.bannerPending()) {
      this.bannerUpload.emit(file);
    }
  }

  protected cancelAvatarSelection(): void {
    this.clearAvatarSelection(true);
  }

  protected cancelBannerSelection(): void {
    this.clearBannerSelection(true);
  }

  private clearAvatarSelection(emitEdited: boolean): void {
    const hadSelection = this.avatarFile() !== null || this.avatarPreviewUrl() !== null;
    this.revokePreview(this.avatarPreviewUrl());
    this.avatarFile.set(null);
    this.avatarPreviewUrl.set(null);
    this.resetInput(this.avatarInput());
    if (emitEdited && hadSelection) {
      this.mediaEdited.emit();
    }
  }

  private clearBannerSelection(emitEdited: boolean): void {
    const hadSelection = this.bannerFile() !== null || this.bannerPreviewUrl() !== null;
    this.revokePreview(this.bannerPreviewUrl());
    this.bannerFile.set(null);
    this.bannerPreviewUrl.set(null);
    this.resetInput(this.bannerInput());
    if (emitEdited && hadSelection) {
      this.mediaEdited.emit();
    }
  }

  private selectedFile(event: Event): File | null {
    return (event.target as HTMLInputElement).files?.item(0) ?? null;
  }

  private revokePreview(url: string | null): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  private resetInput(input: ElementRef<HTMLInputElement> | undefined): void {
    if (input) {
      input.nativeElement.value = '';
    }
  }
}
