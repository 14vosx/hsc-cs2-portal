import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  PlayerServerAccess,
  PlayerServerAccessReason,
} from '../../player/domain/player-server-access.model';
import { PlayerServerAccessPanel } from './player-server-access-panel';

describe('PlayerServerAccessPanel', () => {
  let fixture: ComponentFixture<PlayerServerAccessPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerServerAccessPanel],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', SERVER_ACCESS_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', SERVER_ACCESS_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
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
    ['membership_required', 'Associação HSC necessária'],
    ['membership_inactive', 'Associação inativa'],
    ['membership_suspended', 'Associação suspensa'],
    ['membership_expired', 'Associação expirada'],
    ['membership_cancelled', 'Associação cancelada'],
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

  it('switches the rendered presentation to en-US without changing the decision', async () => {
    fixture.componentRef.setInput('access', {
      ok: true,
      authorized: false,
      reason: 'membership_required',
    } satisfies PlayerServerAccess);
    fixture.detectChanges();
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('HSC Membership required');
    expect(text).not.toContain('playerArea.serverAccess.reasons.membershipRequired.status');
    expect(fixture.nativeElement.querySelector('.server-access__status--authorized')).toBeNull();
  });
});

const SERVER_ACCESS_TRANSLATIONS = {
  'pt-BR': { playerArea: { serverAccess: { unavailable: { status: 'Verificação indisponível', description: 'Não foi possível verificar o acesso aos servidores agora.' }, authorized: { status: 'Acesso liberado', description: 'Sua conta está apta para acessar os servidores HSC.' }, reasons: { steamIdentityNotLinked: { status: 'Steam necessária', description: 'Vincule sua Steam em Conta e Segurança para habilitar o acesso.' }, accountDisabled: { status: 'Acesso indisponível', description: 'O acesso aos servidores não está disponível para esta conta.' }, membershipRequired: { status: 'Associação HSC necessária', description: 'É necessário ter uma Associação HSC efetiva para acessar os servidores.' }, membershipInactive: { status: 'Associação inativa', description: 'Sua Associação HSC não está ativa para acesso aos servidores.' }, membershipSuspended: { status: 'Associação suspensa', description: 'Sua Associação HSC está suspensa para acesso aos servidores.' }, membershipExpired: { status: 'Associação expirada', description: 'Sua Associação HSC expirou e não libera acesso aos servidores.' }, membershipCancelled: { status: 'Associação cancelada', description: 'Sua Associação HSC foi cancelada e não libera acesso aos servidores.' } } } } },
  'en-US': { playerArea: { serverAccess: { unavailable: { status: 'Check unavailable', description: 'Server access could not be checked right now.' }, authorized: { status: 'Access granted', description: 'Your account is eligible to access HSC servers.' }, reasons: { steamIdentityNotLinked: { status: 'Steam required', description: 'Link your Steam account under Account and Security to enable access.' }, accountDisabled: { status: 'Access unavailable', description: 'Server access is unavailable for this account.' }, membershipRequired: { status: 'HSC Membership required', description: 'An effective HSC Membership is required to access the servers.' }, membershipInactive: { status: 'Inactive Membership', description: 'Your HSC Membership is not active for server access.' }, membershipSuspended: { status: 'Suspended Membership', description: 'Your HSC Membership is suspended for server access.' }, membershipExpired: { status: 'Expired Membership', description: 'Your HSC Membership has expired and does not grant server access.' }, membershipCancelled: { status: 'Cancelled Membership', description: 'Your HSC Membership was cancelled and does not grant server access.' } } } } },
} as const;
