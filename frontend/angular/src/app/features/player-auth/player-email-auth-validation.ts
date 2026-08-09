export const PLAYER_EMAIL_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const PLAYER_PASSWORD_MIN_CODE_POINTS = 10;
export const PLAYER_PASSWORD_MAX_CODE_POINTS = 128;

export function isValidPlayerEmailToken(token: string | null): token is string {
  return token !== null && PLAYER_EMAIL_TOKEN_PATTERN.test(token.trim());
}

export function isValidPlayerPassword(password: string): boolean {
  const length = Array.from(password).length;
  return length >= PLAYER_PASSWORD_MIN_CODE_POINTS && length <= PLAYER_PASSWORD_MAX_CODE_POINTS;
}
