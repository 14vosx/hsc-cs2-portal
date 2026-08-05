import { Component, computed, input } from '@angular/core';
import type { BunkerSummary } from '../../domain/bunker.model';
import { StatusBadge, type StatusBadgeVariant } from '../../../../shared/components/status-badge/status-badge';

export type BunkerSummaryState = 'ready' | 'error';

function formatDateString(val: string | null | undefined): string {
  if (!val) {
    return '—';
  }
  const trimmed = val.trim();
  if (!trimmed) {
    return '—';
  }

  // YYYY-MM-DD format check to avoid timezone shift
  const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed);
  if (ymdMatch) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }

  const timestamp = Date.parse(trimmed);
  if (isNaN(timestamp)) {
    return trimmed;
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // If input string contains time indication (T or space with colon)
  if (trimmed.includes('T') || (trimmed.includes(':') && trimmed.includes(' '))) {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
}

@Component({
  selector: 'app-bunker-season-info',
  standalone: true,
  imports: [StatusBadge],
  templateUrl: './bunker-season-info.html',
  styleUrl: './bunker-season-info.css',
})
export class BunkerSeasonInfo {
  readonly summary = input.required<BunkerSummary>();
  readonly summaryState = input.required<BunkerSummaryState>();

  readonly seasonTitle = computed(() => {
    const name = this.summary().currentSeason?.name?.trim();
    if (name) {
      return name;
    }
    const slug = this.summary().currentSeason?.slug?.trim();
    if (slug) {
      return `Season ${slug}`;
    }
    return 'Season —';
  });

  readonly periodText = computed(() => {
    const scope = this.summary().currentSeason?.scope;
    const startAt = scope?.startAt;
    const endAt = scope?.endAt;

    const startFormatted = formatDateString(startAt);
    const endFormatted = formatDateString(endAt);

    if (startFormatted === '—' && endFormatted === '—') {
      return 'Período —';
    }

    return `${startFormatted} a ${endFormatted}`;
  });

  readonly statusBadgeInfo = computed<{ label: string; tone: StatusBadgeVariant }>(() => {
    if (this.summaryState() === 'error') {
      return { label: 'indisponível', tone: 'danger' };
    }

    const currentSeasonStatus = this.summary().currentSeason?.status?.trim();
    const summaryStatus = this.summary().status?.trim();
    const rawStatus = currentSeasonStatus || summaryStatus || '';

    if (!rawStatus) {
      return { label: 'preparando', tone: 'neutral' };
    }

    const lower = rawStatus.toLowerCase();
    if (lower === 'active' || lower === 'ativo') {
      return { label: 'active', tone: 'active' };
    }

    if (['inactive', 'inativo', 'closed', 'archived'].includes(lower)) {
      return { label: lower, tone: 'closed' };
    }

    return { label: rawStatus, tone: 'neutral' };
  });

  readonly generatedAtText = computed(() => {
    const sGen = this.summary().seasonPlayer?.generatedAt;
    if (sGen && sGen.trim()) {
      return formatDateString(sGen);
    }
    const cGen = this.summary().competitiveProfile?.generatedAt;
    if (cGen && cGen.trim()) {
      return formatDateString(cGen);
    }
    return '—';
  });
}
