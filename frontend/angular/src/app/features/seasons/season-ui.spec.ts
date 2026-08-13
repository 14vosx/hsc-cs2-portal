import { describe, expect, it } from 'vitest';

import { eligibilityLabel, eligibilityReason, podiumPlacementLabel, seasonStatusLabel } from './season-ui';

describe('season presentation descriptors', () => {
  it('maps known statuses and preserves unknown status', () => {
    expect(seasonStatusLabel('active')).toEqual({ translationKey: 'seasons.shared.status.active', raw: null });
    expect(seasonStatusLabel('closed')).toEqual({ translationKey: 'seasons.shared.status.closed', raw: null });
    expect(seasonStatusLabel()).toEqual({ translationKey: 'seasons.shared.status.unavailable', raw: null });
    expect(seasonStatusLabel('upstream-status')).toEqual({ translationKey: null, raw: 'upstream-status' });
  });

  it('maps eligibility and preserves an unknown reason', () => {
    expect(eligibilityLabel({ prizeEligible: true }).translationKey).toBe('seasons.shared.eligibility.eligible');
    expect(eligibilityLabel({ prizeEligible: false }).translationKey).toBe('seasons.shared.eligibility.inProgress');
    expect(eligibilityLabel({ prizeEligible: null }).translationKey).toBe('seasons.shared.eligibility.unknown');
    expect(eligibilityReason({ prizeEligible: false, prizeEligibilityReason: 'future-code' })).toEqual({ translationKey: null, raw: 'future-code' });
  });

  it('maps placements to semantic keys', () => {
    expect(podiumPlacementLabel({ prizeRank: 1, rank: 9 }).translationKey).toBe('seasons.podium.placement.first');
    expect(podiumPlacementLabel({ prizeRank: null, rank: 2 }).translationKey).toBe('seasons.podium.placement.second');
    expect(podiumPlacementLabel({ prizeRank: 8, rank: 8 }).translationKey).toBe('seasons.podium.placement.top');
  });
});
