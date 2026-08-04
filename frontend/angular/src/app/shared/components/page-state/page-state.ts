import { Component, input, output } from '@angular/core';

export type PageStateType = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-page-state',
  templateUrl: './page-state.html',
  styleUrl: './page-state.css',
})
export class PageState {
  readonly type = input.required<PageStateType>();
  readonly title = input<string>();
  readonly message = input<string>();
  readonly actionLabel = input<string>();

  readonly actionClick = output<void>();

  protected onAction(): void {
    this.actionClick.emit();
  }
}
