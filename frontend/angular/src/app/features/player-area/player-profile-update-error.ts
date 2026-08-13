import { HttpErrorResponse } from '@angular/common/http';

export interface MappedProfileError {
  readonly targetField?:
    | 'displayName'
    | 'slug'
    | 'bio'
    | 'discordHandle'
    | 'preferredRole'
    | 'preferredMap'
    | 'visibility';
  readonly message: string;
  readonly code: string;
}

export function mapPlayerProfileServerError(error: unknown): MappedProfileError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      code: 'unknown_error',
      message: 'playerProfile.errors.unknown',
    };
  }

  if (error.status === 401) {
    return {
      code: 'unauthorized',
      message: 'playerProfile.errors.unauthorized',
    };
  }

  const payload = error.error;
  let code = '';

  if (typeof payload === 'string' && payload.trim()) {
    code = payload.trim();
  } else if (typeof payload === 'object' && payload !== null) {
    const errProp = (payload as Record<string, unknown>)['error'];
    const codeProp = (payload as Record<string, unknown>)['code'];

    if (typeof errProp === 'string' && errProp.trim()) {
      code = errProp.trim();
    } else if (typeof codeProp === 'string' && codeProp.trim()) {
      code = codeProp.trim();
    } else if (typeof errProp === 'object' && errProp !== null) {
      const nestedCode = (errProp as Record<string, unknown>)['code'];
      if (typeof nestedCode === 'string' && nestedCode.trim()) {
        code = nestedCode.trim();
      }
    }
  }

  if (!code && error.status === 409) {
    code = 'slug_unavailable';
  }

  switch (code) {
    case 'slug_unavailable':
      return {
        targetField: 'slug',
        code: 'slug_unavailable',
        message: 'playerProfile.errors.slugUnavailable',
      };
    case 'slug_reserved':
      return {
        targetField: 'slug',
        code: 'slug_reserved',
        message: 'playerProfile.errors.slugReserved',
      };
    case 'invalid_slug':
      return {
        targetField: 'slug',
        code: 'invalid_slug',
        message: 'playerProfile.errors.invalidSlug',
      };
    case 'public_profile_requires_custom_slug':
      return {
        targetField: 'slug',
        code: 'public_profile_requires_custom_slug',
        message: 'playerProfile.errors.publicProfileRequiresCustomSlug',
      };
    case 'invalid_display_name':
      return {
        targetField: 'displayName',
        code: 'invalid_display_name',
        message: 'playerProfile.errors.invalidDisplayName',
      };
    case 'invalid_bio':
      return {
        targetField: 'bio',
        code: 'invalid_bio',
        message: 'playerProfile.errors.invalidBio',
      };
    case 'invalid_discord_handle':
      return {
        targetField: 'discordHandle',
        code: 'invalid_discord_handle',
        message: 'playerProfile.errors.invalidDiscordHandle',
      };
    case 'invalid_preferred_role':
      return {
        targetField: 'preferredRole',
        code: 'invalid_preferred_role',
        message: 'playerProfile.errors.invalidPreferredRole',
      };
    case 'invalid_preferred_map':
      return {
        targetField: 'preferredMap',
        code: 'invalid_preferred_map',
        message: 'playerProfile.errors.invalidPreferredMap',
      };
    case 'invalid_visibility':
      return {
        targetField: 'visibility',
        code: 'invalid_visibility',
        message: 'playerProfile.errors.invalidVisibility',
      };
    case 'profile_media_must_be_uploaded':
      return {
        code: 'profile_media_must_be_uploaded',
        message: 'playerProfile.errors.profileMediaMustBeUploaded',
      };
    case 'player_account_disabled':
      return {
        code: 'player_account_disabled',
        message: 'playerProfile.errors.accountDisabled',
      };
    case 'csrf_origin_required':
    case 'csrf_origin_forbidden':
      return {
        code,
        message: 'playerProfile.errors.csrfOriginInvalid',
      };
    default:
      if (error.status === 403) {
        return {
          code: code || 'forbidden',
          message: 'playerProfile.errors.forbidden',
        };
      }
      return {
        code: code || 'server_error',
        message: 'playerProfile.errors.server',
      };
  }
}
