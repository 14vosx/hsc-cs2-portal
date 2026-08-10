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
    const conflict = new HttpErrorResponse({ status: 409, error: { error: 'identity_conflict' } });
    expect(mapEmailLinkRequestError(conflict)).toBe('Não foi possível solicitar o vínculo agora. Tente novamente.');
  });

  it('maps confirmation states without raw identifiers', () => {
    const invalid = new HttpErrorResponse({ status: 400, error: { error: 'invalid_link_intent' } });
    const conflict = new HttpErrorResponse({ status: 409, error: { error: 'identity_conflict' } });
    expect(mapEmailLinkConfirmationError(invalid).state).toBe('invalid');
    expect(mapEmailLinkConfirmationError(conflict).state).toBe('conflict');
    expect(mapEmailLinkConfirmationError(new Error('network')).state).toBe('error');
  });
});
