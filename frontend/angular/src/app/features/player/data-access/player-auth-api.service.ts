import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';

@Injectable({
  providedIn: 'root',
})
export class PlayerAuthApiService {
  private readonly http = inject(HttpClient);

  readonly steamLoginUrl = cs2ApiPaths.playerAuthSteamStart;

  logout(): Observable<void> {
    return this.http
      .post(
        cs2ApiPaths.playerAuthLogout,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map(() => undefined));
  }
}
