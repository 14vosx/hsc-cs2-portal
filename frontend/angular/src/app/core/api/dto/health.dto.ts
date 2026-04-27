export interface HealthDto {
  ok: boolean;
  generatedAt: string;
  db?: {
    ok: boolean;
  };
  ranking?: {
    ok: boolean;
    ageSec: number;
  };
  matches?: {
    ok: boolean;
    ageSec: number;
  };
  rankingPlayersMissing?: {
    count: number;
    limit: number;
    items: unknown[];
  };
  content?: {
    news?: {
      ok: boolean;
      ageSec: number;
      count: number;
      generatedAt: string;
      source: string;
    };
  };
  version: string;
}
