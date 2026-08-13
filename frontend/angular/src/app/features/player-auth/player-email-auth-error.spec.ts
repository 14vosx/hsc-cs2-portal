import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { PlayerEmailAuthContractError } from '../player/data-access/player-email-auth-api.service';
import {
  mapPlayerEmailAuthError,
  type PlayerEmailAuthOperation,
} from './player-email-auth-error';

describe('mapPlayerEmailAuthError', () => {
  it.each<[
    PlayerEmailAuthOperation,
    number,
    string,
    string,
    string,
  ]>([
    ['login', 401, 'invalid_credentials', 'invalid-credentials', 'playerAuth.errors.invalidCredentials'],
    ['login', 403, 'email_not_verified', 'email-not-verified', 'playerAuth.errors.emailNotVerified'],
    ['registration', 400, 'invalid_email', 'invalid-email', 'playerAuth.errors.invalidEmail'],
    ['registration', 400, 'invalid_password', 'invalid-password', 'playerAuth.errors.invalidPassword'],
    ['registration', 400, 'invalid_display_name', 'invalid-display-name', 'playerAuth.errors.invalidDisplayName'],
    ['verification', 400, 'invalid_or_expired_verification', 'invalid-verification-link', 'playerAuth.verifyEmail.errors.invalidLink'],
    ['reset-confirm', 400, 'invalid_or_expired_password_reset', 'invalid-password-reset-link', 'playerAuth.resetPassword.errors.invalidLink'],
    ['reset-confirm', 400, 'invalid_password', 'invalid-password', 'playerAuth.errors.invalidPassword'],
    ['reset-request', 403, 'player_account_disabled', 'account-disabled', 'playerAuth.errors.accountDisabled'],
    ['reset-request', 429, 'anything', 'too-many-requests', 'playerAuth.errors.tooManyRequests'],
    ['reset-request', 501, 'player_email_auth_unavailable', 'email-auth-unavailable', 'playerAuth.errors.unavailable'],
  ])('maps %s status %i code %s to semantic presentation', (operation, status, code, kind, messageKey) => {
    expect(mapPlayerEmailAuthError(httpError(status, { error: code }), operation)).toEqual({
      kind,
      messageKey,
    });
  });

  it.each([
    new PlayerEmailAuthContractError('private contract details'),
    new Error('private runtime details'),
    httpError(503, { error: 'db_not_ready', message: 'private backend details' }),
  ])('returns a safe generic descriptor without exposing raw details', (error) => {
    const presentation = mapPlayerEmailAuthError(error, 'reset-request');
    expect(presentation).toEqual({ kind: 'generic', messageKey: 'playerAuth.errors.generic' });
    expect(JSON.stringify(presentation)).not.toContain('private');
    expect(JSON.stringify(presentation)).not.toContain('db_not_ready');
  });
});

function httpError(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}
