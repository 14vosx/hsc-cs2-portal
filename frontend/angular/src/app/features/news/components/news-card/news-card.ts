import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UiCard } from '../../../../shared/components/card/card';
import type { NewsSummary } from '../../domain/news.model';

@Component({
  selector: 'app-news-card',
  imports: [RouterLink, UiCard],
  templateUrl: './news-card.html',
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

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'Sem data';
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
