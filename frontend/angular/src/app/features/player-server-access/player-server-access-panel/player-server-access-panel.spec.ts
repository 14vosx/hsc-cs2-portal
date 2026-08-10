import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  PlayerServerAccess,
  PlayerServerAccessReason,
} from '../../player/domain/player-server-access.model';
import { PlayerServerAccessPanel } from './player-server-access-panel';

describe('PlayerServerAccessPanel', () => {
  let fixture: ComponentFixture<PlayerServerAccessPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayerServerAccessPanel] }).compileComponents();
    fixture = TestBed.createComponent(PlayerServerAccessPanel);
    fixture.componentRef.setInput('loadState', 'ready');
  });

  it('renders the authoritative authorized decision', () => {
    fixture.componentRef.setInput('access', {
      ok: true,
      authorized: true,
      reason: 'membership_active',
    } satisfies PlayerServerAccess);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Acesso liberado');
    expect(fixture.nativeElement.textContent).toContain('apta para acessar os servidores HSC');
  });

  it.each([
    ['steam_identity_not_linked', 'Steam necessária'],
    ['player_account_disabled', 'Acesso indisponível'],
    ['membership_required', 'Membership HSC necessário'],
    ['membership_inactive', 'Membership inativo'],
    ['membership_suspended', 'Membership suspenso'],
    ['membership_expired', 'Membership expirado'],
    ['membership_cancelled', 'Membership cancelado'],
  ] satisfies ReadonlyArray<
    readonly [Exclude<PlayerServerAccessReason, 'membership_active'>, string]
  >)('renders reason %s as safe denied copy', (reason, status) => {
    fixture.componentRef.setInput('access', { ok: true, authorized: false, reason });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(status);
    expect(text).not.toContain('Acesso liberado');
    expect(text).not.toContain(reason);
  });

  it('fails closed when the decision is unavailable', () => {
    fixture.componentRef.setInput('loadState', 'unavailable');
    fixture.componentRef.setInput('access', null);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Não foi possível verificar o acesso aos servidores agora.');
    expect(text).not.toContain('Acesso liberado');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
