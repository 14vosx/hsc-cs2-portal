import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { AnalyticsContext } from '../../bunker-analytics.types';

@Component({
  selector: 'app-bunker-context-selector',
  imports: [TranslatePipe],
  templateUrl: './bunker-context-selector.html',
  styleUrl: './bunker-context-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerContextSelector {
  readonly context = input.required<AnalyticsContext>();
  readonly seasonName = input<string | null>(null);
  readonly contextChange = output<AnalyticsContext>();

  protected handleChange(event: Event): void {
    const context = (event.target as HTMLSelectElement).value;

    if (context === 'season' || context === 'lifetime') {
      this.selectContext(context);
    }
  }

  private selectContext(context: AnalyticsContext): void {
    if (context !== this.context()) {
      this.contextChange.emit(context);
    }
  }
}
