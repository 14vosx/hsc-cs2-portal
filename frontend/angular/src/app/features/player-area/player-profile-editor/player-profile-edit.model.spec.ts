import { describe, expect, it } from 'vitest';

import type { PlayerProfile } from '../../player/domain/player-profile.model';
import {
  createPlayerProfileEditModel,
  buildPlayerProfilePatch,
  isTechnicalSlug,
} from './player-profile-edit.model';

describe('PlayerProfileEditModel', () => {
  const sampleProfile: PlayerProfile = {
    displayName: 'Fallen',
    slug: 'fallen',
    bio: 'Professor do CS',
    avatarUrl: null,
    bannerUrl: null,
    discordHandle: 'fallen#0001',
    preferredRole: 'awper',
    preferredMap: 'de_mirage',
    visibility: 'public',
    joinedAt: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  it('initializes edit model correctly from canonical profile', () => {
    const editModel = createPlayerProfileEditModel(sampleProfile);
    expect(editModel).toEqual({
      displayName: 'Fallen',
      slug: 'fallen',
      bio: 'Professor do CS',
      discordHandle: 'fallen#0001',
      preferredRole: 'awper',
      preferredMap: 'de_mirage',
      visibility: 'public',
    });
  });

  describe('isTechnicalSlug', () => {
    it('returns true for a valid lowercase technical slug', () => {
      expect(isTechnicalSlug('player-1234567890abcdef1234567890abcdef')).toBe(true);
    });

    it('returns false for uppercase variants (canonical format is lowercase-exact)', () => {
      expect(isTechnicalSlug('PLAYER-1234567890ABCDEF1234567890ABCDEF')).toBe(false);
    });

    it('returns false for mixed-case variants', () => {
      expect(isTechnicalSlug('Player-1234567890Abcdef1234567890Abcdef')).toBe(false);
    });

    it('returns false for non-technical custom slugs', () => {
      expect(isTechnicalSlug('fallen')).toBe(false);
      expect(isTechnicalSlug('player-short')).toBe(false);
    });
  });

  it('returns null when buildPlayerProfilePatch has no effective changes', () => {
    const editModel = createPlayerProfileEditModel(sampleProfile);
    // Add extra spaces that normalize away
    editModel.displayName = ' Fallen  ';
    const patch = buildPlayerProfilePatch(editModel, sampleProfile);
    expect(patch).toBeNull();
  });

  it('returns null when all final values are effectively unchanged after normalization', () => {
  const editModel = createPlayerProfileEditModel(sampleProfile);

  editModel.displayName = '  Fallen  ';
  editModel.slug = '  FALLEN  ';
  editModel.bio = '  Professor do CS  ';
  editModel.discordHandle = '  fallen#0001  ';
  editModel.preferredRole = 'awper';
  editModel.preferredMap = 'de_mirage';
  editModel.visibility = 'public';

  expect(buildPlayerProfilePatch(editModel, sampleProfile)).toBeNull();
});

it('treats empty edit values as equivalent to canonical null optional fields', () => {
  const profileWithNullOptionals: PlayerProfile = {
    ...sampleProfile,
    bio: null,
    discordHandle: null,
    preferredRole: null,
    preferredMap: null,
  };

  const editModel = createPlayerProfileEditModel(profileWithNullOptionals);

  editModel.bio = '   ';
  editModel.discordHandle = '   ';
  editModel.preferredRole = '';
  editModel.preferredMap = '';

  expect(buildPlayerProfilePatch(editModel, profileWithNullOptionals)).toBeNull();
});

it('builds patch with only modified fields', () => {
    const editModel = createPlayerProfileEditModel(sampleProfile);
    editModel.bio = 'Novo bio';
    editModel.preferredRole = 'igl';
    const patch = buildPlayerProfilePatch(editModel, sampleProfile);
    expect(patch).toEqual({
      bio: 'Novo bio',
      preferredRole: 'igl',
    });
  });

  it('normalizes empty strings to null for optional bio, discordHandle, role, and map', () => {
    const editModel = createPlayerProfileEditModel(sampleProfile);
    editModel.bio = '   ';
    editModel.discordHandle = '';
    editModel.preferredRole = '';
    editModel.preferredMap = '';
    const patch = buildPlayerProfilePatch(editModel, sampleProfile);
    expect(patch).toEqual({
      bio: null,
      discordHandle: null,
      preferredRole: null,
      preferredMap: null,
    });
  });
});
