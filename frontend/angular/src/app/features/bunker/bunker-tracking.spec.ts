import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const templates = [
  'components/bunker-section-nav/bunker-section-nav.html',
  'components/bunker-combat-panel/bunker-combat-panel.html',
  'components/bunker-maps-panel/bunker-maps-panel.html',
  'components/bunker-match-history-panel/bunker-match-history-panel.html',
] as const;

const expectedTracking = [
  'track tab.id',
  'track row.label',
  'track map.mapName',
  'track matchStableKey(recent)',
  'track matchStableKey(match)',
  'track mapName',
  'track $index',
  'track item.label',
] as const;

describe('Bunker repeater tracking', () => {
  const sources = templates.map((path) => ({
    path,
    content: readFileSync(join(__dirname, path), 'utf8'),
  }));

  it('não permite tracking direto pela identidade de objetos', () => {
    for (const source of sources) {
      expect(source.content, source.path).not.toMatch(
        /track\s+(?:tab|row|map|recent|match|pip|item)\s*[;)]/,
      );
    }
  });

  it('preserva todas as expressões factuais e posicionais aprovadas', () => {
    const combined = sources.map((source) => source.content).join('\n');

    for (const tracking of expectedTracking) {
      expect(combined).toContain(tracking);
    }
  });

  it('não usa repeater para entidades selecionadas singulares', () => {
    const maps = sources.find((source) => source.path.includes('bunker-maps-panel'))?.content;
    const history = sources.find((source) => source.path.includes('bunker-match-history-panel'))?.content;

    expect(maps).toContain('@if (selectedMap(); as map)');
    expect(history).toContain('@if (selectedMatch(); as match)');
  });
});
