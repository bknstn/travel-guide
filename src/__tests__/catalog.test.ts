/**
 * @jest-environment node
 */

import {
  getGuideByStartParam,
  getGuideByTributeProductId,
  GUIDE_CATALOG,
} from '@/lib/catalog';

describe('catalog helpers', () => {
  it('resolves Instagram deep links by alias', () => {
    expect(getGuideByStartParam('ig_tokyo')?.slug).toBe('tokyo-after-dark');
  });

  it('resolves Tribute product ids', () => {
    expect(getGuideByTributeProductId(102)?.slug).toBe('lisbon-weekend-sun');
  });

  it('keeps a unique set of Tribute products', () => {
    const ids = GUIDE_CATALOG.map((guide) => guide.tributeProductId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
