import { HttpErrorResponse } from '@angular/common/http';

export interface MappedProfileMediaError {
  readonly code: string;
  readonly message: string;
  readonly unauthorized: boolean;
}

const UNKNOWN_MESSAGE = 'playerProfile.media.errors.unknown';

export function mapPlayerProfileMediaError(error: unknown): MappedProfileMediaError {
  if (!(error instanceof HttpErrorResponse)) {
    return mappedError('unknown_error', UNKNOWN_MESSAGE);
  }

  const code = errorCode(error.error);

  if (error.status === 401 || code === 'invalid_session') {
    return {
      code: code || 'unauthorized',
      message: 'playerProfile.media.errors.unauthorized',
      unauthorized: true,
    };
  }

  switch (code) {
    case 'missing_file':
      return mappedError(code, 'playerProfile.media.errors.missingFile');
    case 'invalid_file_type':
      return mappedError(code, 'playerProfile.media.errors.invalidFileType');
    case 'invalid_file_signature':
      return mappedError(
        code,
        'playerProfile.media.errors.invalidFileSignature',
      );
    case 'file_type_mismatch':
      return mappedError(
        code,
        'playerProfile.media.errors.fileTypeMismatch',
      );
    case 'unexpected_file_field':
      return mappedError(code, 'playerProfile.media.errors.unexpectedFileField');
    case 'upload_failed':
      return mappedError(code, 'playerProfile.media.errors.uploadFailed');
    case 'player_account_disabled':
      return mappedError(code, 'playerProfile.media.errors.accountDisabled');
    case 'csrf_origin_required':
    case 'csrf_origin_forbidden':
      return mappedError(
        code,
        'playerProfile.media.errors.csrfOriginInvalid',
      );
    case 'file_too_large':
      return mappedError(code, 'playerProfile.media.errors.fileTooLarge');
    case 'player_profile_media_update_failed':
      return mappedError(
        code,
        'playerProfile.media.errors.updateFailed',
      );
  }

  if (error.status === 413) {
    return mappedError(code || 'file_too_large', 'playerProfile.media.errors.fileTooLarge');
  }

  if (error.status === 429) {
    return mappedError(
      code || 'too_many_requests',
      'playerProfile.media.errors.tooManyRequests',
    );
  }

  return mappedError(code || 'unknown_error', UNKNOWN_MESSAGE);
}

function mappedError(code: string, message: string): MappedProfileMediaError {
  return { code, message, unauthorized: false };
}

function errorCode(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (typeof payload !== 'object' || payload === null) {
    return '';
  }

  const record = payload as Record<string, unknown>;
  const directCode = record['error'] ?? record['code'];

  if (typeof directCode === 'string') {
    return directCode.trim();
  }

  if (typeof directCode === 'object' && directCode !== null) {
    const nestedCode = (directCode as Record<string, unknown>)['code'];
    return typeof nestedCode === 'string' ? nestedCode.trim() : '';
  }

  return '';
}
