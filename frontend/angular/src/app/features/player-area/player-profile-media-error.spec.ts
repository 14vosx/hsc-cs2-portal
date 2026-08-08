import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { mapPlayerProfileMediaError } from './player-profile-media-error';

describe('mapPlayerProfileMediaError', () => {
  it.each([
    [
      400,
      'invalid_file_type',
      'Formato de imagem não permitido. Use JPEG, PNG ou WebP.',
    ],
    [
      400,
      'invalid_file_signature',
      'O conteúdo do arquivo não corresponde a uma imagem válida.',
    ],
    [413, 'file_too_large', 'A imagem excede o tamanho máximo permitido.'],
    [403, 'player_account_disabled', 'Sua conta HSC está desativada.'],
    [
      403,
      'csrf_origin_forbidden',
      'Não foi possível validar esta operação com segurança. Recarregue a página e tente novamente.',
    ],
    [
      500,
      'player_profile_media_update_failed',
      'Não foi possível atualizar a imagem agora. Tente novamente.',
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
      'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
    );
  });

  it('usa mensagem genérica sem expor detalhes desconhecidos', () => {
    expect(mapPlayerProfileMediaError(httpError(500, 'internal_detail'))).toEqual({
      code: 'internal_detail',
      message: 'Não foi possível atualizar a imagem. Tente novamente.',
      unauthorized: false,
    });
  });

  it('identifica 401 como sessão não autorizada', () => {
    expect(mapPlayerProfileMediaError(httpError(401, 'invalid_session')).unauthorized).toBe(
      true,
    );
  });
});

function httpError(status: number, code: string): HttpErrorResponse {
  return new HttpErrorResponse({
    error: { error: code },
    status,
    statusText: 'Request failed',
  });
}
