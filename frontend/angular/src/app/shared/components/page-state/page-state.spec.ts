import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PageState } from './page-state';

describe('PageState', () => {
  let fixture: ComponentFixture<PageState>;
  let component: PageState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageState],
    });
    fixture = TestBed.createComponent(PageState);
    component = fixture.componentInstance;
  });

  it('renders loading spinner and message without action button', () => {
    fixture.componentRef.setInput('type', 'loading');
    fixture.componentRef.setInput('message', 'Carregando...');
    fixture.componentRef.setInput('actionLabel', 'Ignorado');
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('.page-state__spinner')).toBeTruthy();
    expect(native.querySelector('.page-state__loading-text')?.textContent?.trim()).toBe('Carregando...');
    expect(native.querySelector('.page-state__btn')).toBeNull();
  });

  it('renders empty state with action button and emits actionClick', () => {
    fixture.componentRef.setInput('type', 'empty');
    fixture.componentRef.setInput('title', 'Nenhum dado');
    fixture.componentRef.setInput('message', 'Lista vazia');
    fixture.componentRef.setInput('actionLabel', 'Voltar');
    fixture.detectChanges();

    const actionSpy = vi.fn();
    component.actionClick.subscribe(actionSpy);

    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('.page-state__title')?.textContent?.trim()).toBe('Nenhum dado');
    expect(native.querySelector('.page-state__message')?.textContent?.trim()).toBe('Lista vazia');

    const button = native.querySelector<HTMLButtonElement>('.page-state__btn');
    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('Voltar');

    button?.click();
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });

  it('renders empty state without action button when actionLabel is omitted', () => {
    fixture.componentRef.setInput('type', 'empty');
    fixture.componentRef.setInput('title', 'Nenhum dado');
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('.page-state__btn')).toBeNull();
  });

  it('renders error state with action button and emits actionClick', () => {
    fixture.componentRef.setInput('type', 'error');
    fixture.componentRef.setInput('title', 'Erro');
    fixture.componentRef.setInput('actionLabel', 'Tentar novamente');
    fixture.detectChanges();

    const actionSpy = vi.fn();
    component.actionClick.subscribe(actionSpy);

    const button = fixture.nativeElement.querySelector('.page-state__btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Tentar novamente');

    button.click();
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});
