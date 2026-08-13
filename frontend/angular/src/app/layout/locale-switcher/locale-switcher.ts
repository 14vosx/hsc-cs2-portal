import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocaleService, type SupportedLocale } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-locale-switcher',
  imports: [TranslatePipe],
  templateUrl: './locale-switcher.html',
  styleUrl: './locale-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcher {
  protected readonly localeService = inject(LocaleService);

  protected selectLocale(locale: SupportedLocale): void {
    void this.localeService.setLocale(locale).catch(() => undefined);
  }
}
