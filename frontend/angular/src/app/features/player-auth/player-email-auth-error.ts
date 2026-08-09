import { HttpErrorResponse } from '@angular/common/http';

import { PlayerEmailAuthContractError } from '../player/data-access/player-email-auth-api.service';

export type PlayerEmailAuthOperation =
  | 'login'
  | 'registration'
  | 'reset-request'
  | 'verification'
  | 'reset-confirm';

export function mapPlayerEmailAuthError(
  error: unknown,
  operation: PlayerEmailAuthOperation,
): string {
  if (error instanceof PlayerEmailAuthContractError) {
    return 'Não foi possível concluir a operação agora. Tente novamente.';
  }

  if (!(error instanceof HttpErrorResponse)) {
    return 'Não foi possível concluir a operação agora. Tente novamente.';
  }

  const code = readErrorCode(error.error);

  if (operation === 'login') {
    if (error.status === 401 && code === 'invalid_credentials') return 'E-mail ou senha inválidos.';
    if (error.status === 403 && code === 'email_not_verified') {
      return 'Seu e-mail ainda precisa ser verificado antes do acesso.';
    }
  }

  if (operation === 'registration') {
    if (code === 'invalid_email') return 'Informe um endereço de e-mail válido.';
    if (code === 'invalid_password') return 'A senha deve ter entre 10 e 128 caracteres.';
    if (code === 'invalid_display_name') return 'Informe um nome de exibição válido.';
  }

  if (operation === 'verification' && code === 'invalid_or_expired_verification') {
    return 'Link de verificação inválido ou expirado.';
  }

  if (operation === 'reset-confirm') {
    if (code === 'invalid_or_expired_password_reset') {
      return 'Link de redefinição inválido ou expirado.';
    }
    if (code === 'invalid_password') return 'A senha deve ter entre 10 e 128 caracteres.';
  }

  if (error.status === 403 && code === 'player_account_disabled') {
    return 'Esta conta está indisponível para acesso.';
  }
  if (error.status === 429) return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  if (error.status === 501 && code === 'player_email_auth_unavailable') {
    return 'A autenticação por e-mail está indisponível no momento.';
  }

  return 'Não foi possível concluir a operação agora. Tente novamente.';
}

function readErrorCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const code = (body as Record<string, unknown>)['error'];
  return typeof code === 'string' ? code : null;
}
