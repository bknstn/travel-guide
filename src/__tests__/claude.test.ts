/**
 * @jest-environment node
 */

import {
  extractRecommendations,
  fallbackRecommendations,
} from '@/lib/claude';

describe('guide recommendations', () => {
  it('extracts structured recommendations from model text', () => {
    const recommendations = extractRecommendations(`
      Here you go:
      [
        { "slug": "tokyo-after-dark", "reason": "Подойдет для ночного города." },
        { "slug": "lisbon-weekend-sun", "reason": "Подойдет для мягкого уикенда." }
      ]
    `);

    expect(recommendations).toEqual([
      { slug: 'tokyo-after-dark', reason: 'Подойдет для ночного города.' },
      { slug: 'lisbon-weekend-sun', reason: 'Подойдет для мягкого уикенда.' },
    ]);
  });

  it('falls back to a short list when model output is unavailable', () => {
    const recommendations = fallbackRecommendations(
      'Хочу спокойный уикенд у океана с едой и прогулками'
    );

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]?.slug).toBe('lisbon-weekend-sun');
  });
});
