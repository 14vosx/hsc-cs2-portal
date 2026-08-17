import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { PlayerLink } from './player-link';

describe('PlayerLink', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PlayerLink], providers: [provideRouter([])] });
  });

  it('renderiza o label como RouterLink para um slug público', () => {
    const fixture = TestBed.createComponent(PlayerLink);
    fixture.componentRef.setInput('label', 'Lavos');
    fixture.componentRef.setInput('profileSlug', 'lavos');
    fixture.detectChanges();

    const anchor = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(anchor?.textContent).toBe('Lavos');
    expect(anchor?.getAttribute('href')).toBe('/players/lavos');
  });

  it('renderiza texto sem anchor quando profileSlug é null', () => {
    const fixture = TestBed.createComponent(PlayerLink);
    fixture.componentRef.setInput('label', 'L4VOSX');
    fixture.componentRef.setInput('profileSlug', null);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('span')?.textContent).toBe('L4VOSX');
  });
});
