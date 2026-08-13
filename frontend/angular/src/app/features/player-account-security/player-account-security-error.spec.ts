import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { mapEmailLinkConfirmationError, mapEmailLinkRequestError, mapSteamLinkResult } from './player-account-security-error';

describe('player account security error mapping', () => {
  it('maps only known Steam results to safe copy', () => {
    expect(mapSteamLinkResult('success')).toBe('Steam vinculada com sucesso.');
    expect(mapSteamLinkResult('identity_conflict')).not.toContain('identity_conflict');
    expect(mapSteamLinkResult('unknown')).toBeNull();
  });

  it('keeps request feedback privacy preserving', () => {
    const cases = [
      [401, 'invalid_session', 'playerAccount.emailLink.request.errors.invalidSession'],
      [403, 'player_account_disabled', 'playerAccount.emailLink.request.errors.accountDisabled'],
      [429, 'rate_limited', 'playerAccount.emailLink.request.errors.tooManyRequests'],
      [501, 'player_email_auth_unavailable', 'playerAccount.emailLink.request.errors.unavailable'],
      [409, 'identity_conflict', 'playerAccount.emailLink.request.errors.generic'],
    ] as const;
    for (const [status, code, key] of cases) {
      expect(mapEmailLinkRequestError(new HttpErrorResponse({ status, error: { error: code } }))).toBe(key);
    }
    expect(mapEmailLinkRequestError(new Error('private detail'))).toBe('playerAccount.emailLink.request.errors.generic');
  });

  it('maps confirmation states without raw identifiers', () => {
    const invalid = new HttpErrorResponse({ status: 400, error: { error: 'invalid_link_intent' } });
    const conflict = new HttpErrorResponse({ status: 409, error: { error: 'identity_conflict' } });
    expect(mapEmailLinkConfirmationError(invalid)).toEqual({ state: 'invalid', message: 'playerAccount.emailLink.confirmation.errors.invalid' });
    expect(mapEmailLinkConfirmationError(conflict)).toEqual({ state: 'conflict', message: 'playerAccount.emailLink.confirmation.errors.conflict' });
    expect(mapEmailLinkConfirmationError(new HttpErrorResponse({ status: 403, error: { error: 'player_account_disabled' } }))).toEqual({ state: 'disabled', message: 'playerAccount.emailLink.confirmation.errors.disabled' });
    expect(mapEmailLinkConfirmationError(new HttpErrorResponse({ status: 501, error: { error: 'player_email_auth_unavailable' } }))).toEqual({ state: 'unavailable', message: 'playerAccount.emailLink.confirmation.errors.unavailable' });
    expect(mapEmailLinkConfirmationError(new Error('network'))).toEqual({ state: 'error', message: 'playerAccount.emailLink.confirmation.errors.generic' });
  });
});
