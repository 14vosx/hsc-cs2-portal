import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { mapPlayerProfileMediaError } from './player-profile-media-error';

describe('mapPlayerProfileMediaError', () => {
  it.each([
    [
      400,
      'invalid_file_type',
      'playerProfile.media.errors.invalidFileType',
    ],
    [
      400,
      'invalid_file_signature',
      'playerProfile.media.errors.invalidFileSignature',
    ],
    [400, 'missing_file', 'playerProfile.media.errors.missingFile'],
    [400, 'file_type_mismatch', 'playerProfile.media.errors.fileTypeMismatch'],
    [400, 'unexpected_file_field', 'playerProfile.media.errors.unexpectedFileField'],
    [500, 'upload_failed', 'playerProfile.media.errors.uploadFailed'],
    [413, 'file_too_large', 'playerProfile.media.errors.fileTooLarge'],
    [403, 'player_account_disabled', 'playerProfile.media.errors.accountDisabled'],
    [
      403,
      'csrf_origin_forbidden',
      'playerProfile.media.errors.csrfOriginInvalid',
    ],
    [
      500,
      'player_profile_media_update_failed',
      'playerProfile.media.errors.updateFailed',
    ],
  ])('mapeia status %i e código %s', (status, code, message) => {
    expect(mapPlayerProfileMediaError(httpError(status, code))).toEqual({
      code,
      message,
      unauthorized: false,
    });
  });

  it('mapeia rate limit pelo status 429', () => {
    expect(mapPlayerProfileMediaError(httpError(429, 'rate_limited')).message).toBe(
      'playerProfile.media.errors.tooManyRequests',
    );
  });

  it('usa mensagem genérica sem expor detalhes desconhecidos', () => {
    expect(mapPlayerProfileMediaError(httpError(500, 'internal_detail'))).toEqual({
      code: 'internal_detail',
      message: 'playerProfile.media.errors.unknown',
      unauthorized: false,
    });
  });

  it('identifica 401 como sessão não autorizada', () => {
    expect(mapPlayerProfileMediaError(httpError(401, 'invalid_session'))).toEqual({
      code: 'invalid_session',
      message: 'playerProfile.media.errors.unauthorized',
      unauthorized: true,
    });
  });

  it('maps non-HTTP and status fallbacks to safe semantic keys', () => {
    expect(mapPlayerProfileMediaError(new Error('private detail'))).toEqual({ code: 'unknown_error', message: 'playerProfile.media.errors.unknown', unauthorized: false });
    expect(mapPlayerProfileMediaError(httpError(413, ''))).toEqual({ code: 'file_too_large', message: 'playerProfile.media.errors.fileTooLarge', unauthorized: false });
  });
});

function httpError(status: number, code: string): HttpErrorResponse {
  return new HttpErrorResponse({
    error: { error: code },
    status,
    statusText: 'Request failed',
  });
}
