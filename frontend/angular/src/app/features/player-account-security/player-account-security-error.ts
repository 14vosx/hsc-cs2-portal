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
    return 'Não foi possível solicitar o vínculo agora. Tente novamente.';
  }
  const code = readCode(error.error);
  if (error.status === 401 && code === 'invalid_session') return 'Sua sessão expirou. Entre novamente.';
  if (error.status === 403 && code === 'player_account_disabled') return 'Esta conta está indisponível para acesso.';
  if (error.status === 429) return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  if (error.status === 501 && code === 'player_email_auth_unavailable') return 'O vínculo por e-mail está temporariamente indisponível.';
  return 'Não foi possível solicitar o vínculo agora. Tente novamente.';
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
    if (error.status === 400 && code === 'invalid_link_intent') return { state: 'invalid', message: 'Link de vínculo inválido ou expirado.' };
    if (error.status === 409 && code === 'identity_conflict') return { state: 'conflict', message: 'Este e-mail já está vinculado a outra conta HSC.' };
    if (error.status === 403 && code === 'player_account_disabled') return { state: 'disabled', message: 'Esta conta está indisponível para acesso.' };
    if (error.status === 501 && code === 'player_email_auth_unavailable') return { state: 'unavailable', message: 'O vínculo por e-mail está temporariamente indisponível.' };
  }
  return { state: 'error', message: 'Não foi possível concluir o vínculo agora. Tente novamente mais tarde.' };
}

function readCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>)['error'];
  return typeof value === 'string' ? value : null;
}
