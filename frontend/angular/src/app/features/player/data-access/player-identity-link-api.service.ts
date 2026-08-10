import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';

export interface EmailLinkRequest {
  readonly email: string;
  readonly password: string;
}

export interface EmailLinkRequestResult {
  readonly ok: true;
  readonly verificationRequired: true;
}

export interface EmailLinkConfirmationResult {
  readonly ok: true;
  readonly linked: true;
  readonly identity: {
    readonly type: 'email';
    readonly email: string;
  };
}

export class PlayerIdentityLinkContractError extends Error {
  constructor(operation: string) {
    super(`Invalid player identity ${operation} response envelope`);
    this.name = 'PlayerIdentityLinkContractError';
  }
}

@Injectable({ providedIn: 'root' })
export class PlayerIdentityLinkApiService {
  private readonly http = inject(HttpClient);

  requestEmailLink(request: EmailLinkRequest): Observable<EmailLinkRequestResult> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerAuthEmailLinkRequest, request, { withCredentials: true })
      .pipe(
        map((payload) => {
          if (!isEmailLinkRequestResult(payload)) {
            throw new PlayerIdentityLinkContractError('request');
          }
          return payload;
        }),
      );
  }

  confirmEmailLink(token: string): Observable<EmailLinkConfirmationResult> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerAuthEmailLinkConfirm, { token }, { withCredentials: true })
      .pipe(
        map((payload) => {
          if (!isEmailLinkConfirmationResult(payload)) {
            throw new PlayerIdentityLinkContractError('confirmation');
          }
          return payload;
        }),
      );
  }
}

function isEmailLinkRequestResult(value: unknown): value is EmailLinkRequestResult {
  return isRecord(value) && value['ok'] === true && value['verificationRequired'] === true;
}

function isEmailLinkConfirmationResult(value: unknown): value is EmailLinkConfirmationResult {
  if (!isRecord(value) || value['ok'] !== true || value['linked'] !== true) return false;
  const identity = value['identity'];
  return (
    isRecord(identity) &&
    identity['type'] === 'email' &&
    typeof identity['email'] === 'string' &&
    identity['email'].trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
