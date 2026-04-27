import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';

@Component({
  selector: 'app-api-smoke',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './api-smoke.html',
  styleUrl: './api-smoke.css',
})
export class ApiSmoke {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$ = forkJoin({
    health: this.cs2Api.getHealth(),
    ranking: this.cs2Api.getRanking(),
    matches: this.cs2Api.getMatches(),
    maps: this.cs2Api.getMaps(),
  });
}
