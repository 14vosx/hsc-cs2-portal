import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { PlayerAvatar } from './player-avatar';

describe('PlayerAvatar', () => {
  let fixture: ComponentFixture<PlayerAvatar>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayerAvatar] }).compileComponents();
    fixture = TestBed.createComponent(PlayerAvatar);
  });

  it('renders an image with an appropriate alt', () => {
    fixture.componentRef.setInput('displayName', 'Player One');
    fixture.componentRef.setInput('imageUrl', 'avatar.jpg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('alt')).toBe('Avatar de Player One');
  });

  it('renders initials as fallback', () => {
    fixture.componentRef.setInput('displayName', 'Player One');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-avatar__fallback')?.textContent.trim()).toBe('PO');
  });
});
