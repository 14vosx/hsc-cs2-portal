import { HttpErrorResponse } from '@angular/common/http';

export interface MappedProfileMediaError {
  readonly code: string;
  readonly message: string;
  readonly unauthorized: boolean;
}

const UNKNOWN_MESSAGE = 'Não foi possível atualizar a imagem. Tente novamente.';

export function mapPlayerProfileMediaError(error: unknown): MappedProfileMediaError {
  if (!(error instanceof HttpErrorResponse)) {
    return mappedError('unknown_error', UNKNOWN_MESSAGE);
  }

  const code = errorCode(error.error);

  if (error.status === 401 || code === 'invalid_session') {
    return {
      code: code || 'unauthorized',
      message: 'Sua sessão expirou. Faça login novamente.',
      unauthorized: true,
    };
  }

  switch (code) {
    case 'missing_file':
      return mappedError(code, 'Selecione uma imagem antes de enviar.');
    case 'invalid_file_type':
      return mappedError(code, 'Formato de imagem não permitido. Use JPEG, PNG ou WebP.');
    case 'invalid_file_signature':
      return mappedError(
        code,
        'O conteúdo do arquivo não corresponde a uma imagem válida.',
      );
    case 'file_type_mismatch':
      return mappedError(
        code,
        'O formato real do arquivo não corresponde ao tipo informado.',
      );
    case 'unexpected_file_field':
      return mappedError(code, 'Não foi possível processar o arquivo selecionado.');
    case 'upload_failed':
      return mappedError(code, 'Não foi possível processar o upload da imagem.');
    case 'player_account_disabled':
      return mappedError(code, 'Sua conta HSC está desativada.');
    case 'csrf_origin_required':
    case 'csrf_origin_forbidden':
      return mappedError(
        code,
        'Não foi possível validar esta operação com segurança. Recarregue a página e tente novamente.',
      );
    case 'file_too_large':
      return mappedError(code, 'A imagem excede o tamanho máximo permitido.');
    case 'player_profile_media_update_failed':
      return mappedError(
        code,
        'Não foi possível atualizar a imagem agora. Tente novamente.',
      );
  }

  if (error.status === 413) {
    return mappedError(code || 'file_too_large', 'A imagem excede o tamanho máximo permitido.');
  }

  if (error.status === 429) {
    return mappedError(
      code || 'too_many_requests',
      'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
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
