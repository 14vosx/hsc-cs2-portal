import { Component, computed, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import type { NewsSummary } from '../../domain/news.model';

@Component({
  selector: 'app-news-card',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './news-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './news-card.css',
})
export class NewsCard {
  readonly item = input.required<NewsSummary>();

  private readonly failedImageUrl = signal<string | null>(null);

  protected readonly showImage = computed(() => {
    const url = this.item().imageUrl;
    if (!url || url.trim().length === 0) {
      return false;
    }
    return this.failedImageUrl() !== url;
  });

  protected readonly hasExcerpt = computed(() => {
    const excerpt = this.item().excerpt;
    return typeof excerpt === 'string' && excerpt.trim().length > 0;
  });

  protected onImageError(): void {
    const currentUrl = this.item().imageUrl;
    if (currentUrl) {
      this.failedImageUrl.set(currentUrl);
    }
  }

  protected formatDate(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
