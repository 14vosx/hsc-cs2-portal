import { HttpErrorResponse } from '@angular/common/http';

import { PlayerEmailAuthContractError } from '../player/data-access/player-email-auth-api.service';

export type PlayerEmailAuthOperation =
  | 'login'
  | 'registration'
  | 'reset-request'
  | 'verification'
  | 'reset-confirm';

export type PlayerEmailAuthErrorKind =
  | 'invalid-credentials'
  | 'email-not-verified'
  | 'invalid-email'
  | 'invalid-password'
  | 'invalid-display-name'
  | 'invalid-verification-link'
  | 'invalid-password-reset-link'
  | 'account-disabled'
  | 'too-many-requests'
  | 'email-auth-unavailable'
  | 'generic';

export interface PlayerEmailAuthErrorPresentation {
  kind: PlayerEmailAuthErrorKind;
  messageKey: string;
}

export function mapPlayerEmailAuthError(
  error: unknown,
  operation: PlayerEmailAuthOperation,
): PlayerEmailAuthErrorPresentation {
  if (error instanceof PlayerEmailAuthContractError) {
    return presentation('generic', 'playerAuth.errors.generic');
  }

  if (!(error instanceof HttpErrorResponse)) {
    return presentation('generic', 'playerAuth.errors.generic');
  }

  const code = readErrorCode(error.error);

  if (operation === 'login') {
    if (error.status === 401 && code === 'invalid_credentials') {
      return presentation('invalid-credentials', 'playerAuth.errors.invalidCredentials');
    }
    if (error.status === 403 && code === 'email_not_verified') {
      return presentation('email-not-verified', 'playerAuth.errors.emailNotVerified');
    }
  }

  if (operation === 'registration') {
    if (code === 'invalid_email') {
      return presentation('invalid-email', 'playerAuth.errors.invalidEmail');
    }
    if (code === 'invalid_password') {
      return presentation('invalid-password', 'playerAuth.errors.invalidPassword');
    }
    if (code === 'invalid_display_name') {
      return presentation('invalid-display-name', 'playerAuth.errors.invalidDisplayName');
    }
  }

  if (operation === 'verification' && code === 'invalid_or_expired_verification') {
    return presentation(
      'invalid-verification-link',
      'playerAuth.verifyEmail.errors.invalidLink',
    );
  }

  if (operation === 'reset-confirm') {
    if (code === 'invalid_or_expired_password_reset') {
      return presentation(
        'invalid-password-reset-link',
        'playerAuth.resetPassword.errors.invalidLink',
      );
    }
    if (code === 'invalid_password') {
      return presentation('invalid-password', 'playerAuth.errors.invalidPassword');
    }
  }

  if (error.status === 403 && code === 'player_account_disabled') {
    return presentation('account-disabled', 'playerAuth.errors.accountDisabled');
  }
  if (error.status === 429) {
    return presentation('too-many-requests', 'playerAuth.errors.tooManyRequests');
  }
  if (error.status === 501 && code === 'player_email_auth_unavailable') {
    return presentation('email-auth-unavailable', 'playerAuth.errors.unavailable');
  }

  return presentation('generic', 'playerAuth.errors.generic');
}

function presentation(
  kind: PlayerEmailAuthErrorKind,
  messageKey: string,
): PlayerEmailAuthErrorPresentation {
  return { kind, messageKey };
}

function readErrorCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const code = (body as Record<string, unknown>)['error'];
  return typeof code === 'string' ? code : null;
}
