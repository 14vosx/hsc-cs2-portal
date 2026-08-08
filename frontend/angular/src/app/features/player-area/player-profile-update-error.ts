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
      message: 'Ocorreu um erro ao salvar o perfil. Tente novamente.',
    };
  }

  if (error.status === 401) {
    return {
      code: 'unauthorized',
      message: 'Sua sessão expirou. Faça login novamente.',
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
        message: 'Este endereço de perfil já está em uso por outro jogador.',
      };
    case 'slug_reserved':
      return {
        targetField: 'slug',
        code: 'slug_reserved',
        message: 'Este endereço de perfil é reservado e não pode ser utilizado.',
      };
    case 'invalid_slug':
      return {
        targetField: 'slug',
        code: 'invalid_slug',
        message: 'Endereço de perfil (slug) inválido.',
      };
    case 'public_profile_requires_custom_slug':
      return {
        targetField: 'slug',
        code: 'public_profile_requires_custom_slug',
        message:
          'Para tornar o perfil visível para membros HSC, você precisa escolher um endereço de perfil personalizado.',
      };
    case 'invalid_display_name':
      return {
        targetField: 'displayName',
        code: 'invalid_display_name',
        message: 'Nome de exibição inválido.',
      };
    case 'invalid_bio':
      return {
        targetField: 'bio',
        code: 'invalid_bio',
        message: 'Biografia excede o limite ou contém caracteres inválidos.',
      };
    case 'invalid_discord_handle':
      return {
        targetField: 'discordHandle',
        code: 'invalid_discord_handle',
        message: 'Handle do Discord inválido.',
      };
    case 'invalid_preferred_role':
      return {
        targetField: 'preferredRole',
        code: 'invalid_preferred_role',
        message: 'Função preferida inválida.',
      };
    case 'invalid_preferred_map':
      return {
        targetField: 'preferredMap',
        code: 'invalid_preferred_map',
        message: 'Mapa preferido inválido.',
      };
    case 'invalid_visibility':
      return {
        targetField: 'visibility',
        code: 'invalid_visibility',
        message: 'Opção de visibilidade inválida.',
      };
    case 'profile_media_must_be_uploaded':
      return {
        code: 'profile_media_must_be_uploaded',
        message: 'Mídia do perfil precisa ser enviada.',
      };
    case 'player_account_disabled':
      return {
        code: 'player_account_disabled',
        message: 'Sua conta HSC está desativada.',
      };
    case 'csrf_origin_required':
    case 'csrf_origin_forbidden':
      return {
        code,
        message: 'Requisição não autorizada pelo servidor (origem inválida).',
      };
    default:
      if (error.status === 403) {
        return {
          code: code || 'forbidden',
          message: 'Ação não permitida para a sua conta.',
        };
      }
      return {
        code: code || 'server_error',
        message: 'Não foi possível salvar as alterações no perfil. Tente novamente.',
      };
  }
}
