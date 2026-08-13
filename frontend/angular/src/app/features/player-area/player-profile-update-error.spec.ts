import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { mapPlayerProfileServerError } from './player-profile-update-error';

describe('mapPlayerProfileServerError', () => {
  it.each([
    ['slug_unavailable', 'slug', 'playerProfile.errors.slugUnavailable'],
    ['slug_reserved', 'slug', 'playerProfile.errors.slugReserved'],
    ['invalid_slug', 'slug', 'playerProfile.errors.invalidSlug'],
    ['public_profile_requires_custom_slug', 'slug', 'playerProfile.errors.publicProfileRequiresCustomSlug'],
    ['invalid_display_name', 'displayName', 'playerProfile.errors.invalidDisplayName'],
    ['invalid_bio', 'bio', 'playerProfile.errors.invalidBio'],
    ['invalid_discord_handle', 'discordHandle', 'playerProfile.errors.invalidDiscordHandle'],
    ['invalid_preferred_role', 'preferredRole', 'playerProfile.errors.invalidPreferredRole'],
    ['invalid_preferred_map', 'preferredMap', 'playerProfile.errors.invalidPreferredMap'],
    ['invalid_visibility', 'visibility', 'playerProfile.errors.invalidVisibility'],
  ] as const)('maps %s to its field and semantic key', (code, targetField, message) => {
    expect(mapPlayerProfileServerError(httpError(400, { error: code }))).toEqual({ code, targetField, message });
  });

  it.each([
    ['profile_media_must_be_uploaded', 'playerProfile.errors.profileMediaMustBeUploaded'],
    ['player_account_disabled', 'playerProfile.errors.accountDisabled'],
    ['csrf_origin_required', 'playerProfile.errors.csrfOriginInvalid'],
    ['csrf_origin_forbidden', 'playerProfile.errors.csrfOriginInvalid'],
  ] as const)('maps non-field code %s safely', (code, message) => {
    expect(mapPlayerProfileServerError(httpError(400, { code }))).toEqual({ code, message });
  });

  it('preserves semantic HTTP fallbacks', () => {
    expect(mapPlayerProfileServerError(httpError(401, null))).toEqual({ code: 'unauthorized', message: 'playerProfile.errors.unauthorized' });
    expect(mapPlayerProfileServerError(httpError(409, null))).toEqual({ code: 'slug_unavailable', targetField: 'slug', message: 'playerProfile.errors.slugUnavailable' });
    expect(mapPlayerProfileServerError(httpError(403, { error: 'unmapped_forbidden' }))).toEqual({ code: 'unmapped_forbidden', message: 'playerProfile.errors.forbidden' });
  });

  it('uses safe fallbacks without exposing arbitrary backend payload text', () => {
    const backendCode = 'private_backend_detail';
    const mapped = mapPlayerProfileServerError(httpError(500, { error: backendCode }));
    expect(mapped).toEqual({ code: backendCode, message: 'playerProfile.errors.server' });
    expect(mapped.message).not.toContain(backendCode);
    expect(mapPlayerProfileServerError(new Error('private exception'))).toEqual({ code: 'unknown_error', message: 'playerProfile.errors.unknown' });
  });
});

function httpError(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ error, status, statusText: 'Request failed' });
}
