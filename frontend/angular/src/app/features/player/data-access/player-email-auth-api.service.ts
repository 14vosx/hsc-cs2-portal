import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';

export interface PlayerEmailRegistrationRequest {
  email: string;
  password: string;
  displayName?: string | null;
}

export interface PlayerEmailRegistrationResult {
  ok: true;
  verificationRequired: true;
}

export interface PlayerEmailVerificationRequest {
  token: string;
}

export interface PlayerEmailAuthenticationResult {
  ok: true;
  authenticated: true;
  session: {
    issued: true;
  };
}

export interface PlayerEmailVerificationResult extends PlayerEmailAuthenticationResult {
  verified: true;
}

export interface PlayerEmailLoginRequest {
  email: string;
  password: string;
}

export interface PlayerPasswordResetRequest {
  email: string;
}

export interface PlayerPasswordResetRequestResult {
  ok: true;
  message: string;
}

export interface PlayerPasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface PlayerPasswordResetConfirmResult {
  ok: true;
  passwordReset: true;
  authenticated: false;
}

export class PlayerEmailAuthContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerEmailAuthContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class PlayerEmailAuthApiService {
  private readonly http = inject(HttpClient);

  register(request: PlayerEmailRegistrationRequest): Observable<PlayerEmailRegistrationResult> {
    return this.post(
      cs2ApiPaths.playerAuthEmailRegister,
      request,
      isRegistrationResult,
      'registration',
    );
  }

  verify(request: PlayerEmailVerificationRequest): Observable<PlayerEmailVerificationResult> {
    return this.post(
      cs2ApiPaths.playerAuthEmailVerify,
      request,
      isVerificationResult,
      'verification',
    );
  }

  login(request: PlayerEmailLoginRequest): Observable<PlayerEmailAuthenticationResult> {
    return this.post(
      cs2ApiPaths.playerAuthEmailLogin,
      request,
      isAuthenticationResult,
      'login',
    );
  }

  requestPasswordReset(
    request: PlayerPasswordResetRequest,
  ): Observable<PlayerPasswordResetRequestResult> {
    return this.post(
      cs2ApiPaths.playerAuthEmailPasswordResetRequest,
      request,
      isPasswordResetRequestResult,
      'password reset request',
    );
  }

  confirmPasswordReset(
    request: PlayerPasswordResetConfirmRequest,
  ): Observable<PlayerPasswordResetConfirmResult> {
    return this.post(
      cs2ApiPaths.playerAuthEmailPasswordResetConfirm,
      request,
      isPasswordResetConfirmResult,
      'password reset confirmation',
    );
  }

  private post<TRequest, TResult>(
    path: string,
    request: TRequest,
    isResult: (payload: unknown) => payload is TResult,
    operation: string,
  ): Observable<TResult> {
    return this.http
      .post<unknown>(path, request, { withCredentials: true })
      .pipe(
        map((payload) => {
          if (!isResult(payload)) {
            throw new PlayerEmailAuthContractError(
              `Invalid player email ${operation} response envelope`,
            );
          }
          return payload;
        }),
      );
  }
}

function isRegistrationResult(payload: unknown): payload is PlayerEmailRegistrationResult {
  return isRecord(payload) && payload['ok'] === true && payload['verificationRequired'] === true;
}

function isVerificationResult(payload: unknown): payload is PlayerEmailVerificationResult {
  if (
    !isRecord(payload) ||
    payload['ok'] !== true ||
    payload['verified'] !== true ||
    payload['authenticated'] !== true
  ) {
    return false;
  }
  const session = payload['session'];
  return isRecord(session) && session['issued'] === true;
}

function isAuthenticationResult(payload: unknown): payload is PlayerEmailAuthenticationResult {
  if (!isRecord(payload) || payload['ok'] !== true || payload['authenticated'] !== true) {
    return false;
  }
  const session = payload['session'];
  return isRecord(session) && session['issued'] === true;
}

function isPasswordResetRequestResult(
  payload: unknown,
): payload is PlayerPasswordResetRequestResult {
  return isRecord(payload) && payload['ok'] === true && typeof payload['message'] === 'string';
}

function isPasswordResetConfirmResult(
  payload: unknown,
): payload is PlayerPasswordResetConfirmResult {
  return (
    isRecord(payload) &&
    payload['ok'] === true &&
    payload['passwordReset'] === true &&
    payload['authenticated'] === false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
