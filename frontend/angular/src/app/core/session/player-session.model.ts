export interface AuthenticatedPlayerSession {
  readonly status: 'authenticated';
  readonly displayName: string;
  readonly steamId64: string | null;
  readonly avatarMedium: string | null;
}

export type PlayerSession =
  | { readonly status: 'loading' }
  | { readonly status: 'anonymous' }
  | AuthenticatedPlayerSession
  | { readonly status: 'unavailable' };
