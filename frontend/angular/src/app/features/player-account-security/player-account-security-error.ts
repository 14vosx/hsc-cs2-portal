import { HttpErrorResponse } from '@angular/common/http';

import { PlayerIdentityLinkContractError } from '../player/data-access/player-identity-link-api.service';

export type SteamLinkResult =
  | 'success'
  | 'identity_conflict'
  | 'already_linked'
  | 'unavailable'
  | 'failed';

export function mapSteamLinkResult(result: string | null): string | null {
  const messages: Record<SteamLinkResult, string> = {
    success: 'Steam vinculada com sucesso.',
    identity_conflict: 'Esta conta Steam já está vinculada a outra conta HSC.',
    already_linked: 'Sua conta HSC já possui uma Steam vinculada.',
    unavailable: 'O vínculo com a Steam está temporariamente indisponível.',
    failed: 'Não foi possível vincular a Steam. Tente novamente.',
  };
  return result && result in messages ? messages[result as SteamLinkResult] : null;
}

export function mapEmailLinkRequestError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse) || error instanceof PlayerIdentityLinkContractError) {
    return 'playerAccount.emailLink.request.errors.generic';
  }
  const code = readCode(error.error);
  if (error.status === 401 && code === 'invalid_session') return 'playerAccount.emailLink.request.errors.invalidSession';
  if (error.status === 403 && code === 'player_account_disabled') return 'playerAccount.emailLink.request.errors.accountDisabled';
  if (error.status === 429) return 'playerAccount.emailLink.request.errors.tooManyRequests';
  if (error.status === 501 && code === 'player_email_auth_unavailable') return 'playerAccount.emailLink.request.errors.unavailable';
  return 'playerAccount.emailLink.request.errors.generic';
}

export type EmailLinkConfirmationErrorState =
  | 'invalid'
  | 'conflict'
  | 'disabled'
  | 'unavailable'
  | 'error';

export function mapEmailLinkConfirmationError(error: unknown): {
  state: EmailLinkConfirmationErrorState;
  message: string;
} {
  if (error instanceof HttpErrorResponse) {
    const code = readCode(error.error);
    if (error.status === 400 && code === 'invalid_link_intent') return { state: 'invalid', message: 'playerAccount.emailLink.confirmation.errors.invalid' };
    if (error.status === 409 && code === 'identity_conflict') return { state: 'conflict', message: 'playerAccount.emailLink.confirmation.errors.conflict' };
    if (error.status === 403 && code === 'player_account_disabled') return { state: 'disabled', message: 'playerAccount.emailLink.confirmation.errors.disabled' };
    if (error.status === 501 && code === 'player_email_auth_unavailable') return { state: 'unavailable', message: 'playerAccount.emailLink.confirmation.errors.unavailable' };
  }
  return { state: 'error', message: 'playerAccount.emailLink.confirmation.errors.generic' };
}

function readCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>)['error'];
  return typeof value === 'string' ? value : null;
}
