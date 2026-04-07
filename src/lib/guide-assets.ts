import fs from 'node:fs';
import path from 'node:path';

import { GuideCatalogItem } from '@/lib/types';

const DEFAULT_GUIDES_ROOT = path.join(process.cwd(), 'data', 'guides');

export function getGuidesRoot() {
  return (
    process.env.GUIDES_ROOT ||
    process.env.GUIDE_ASSETS_DIR ||
    DEFAULT_GUIDES_ROOT
  );
}

export function getGuideDirectory(guide: GuideCatalogItem) {
  return path.join(getGuidesRoot(), guide.slug);
}

export function getGuideAssetPath(
  guide: GuideCatalogItem,
  asset: 'cover' | 'preview' | 'full'
) {
  const fileName =
    asset === 'cover'
      ? 'cover.jpg'
      : asset === 'preview'
        ? 'preview.pdf'
        : 'full.pdf';

  return path.join(getGuideDirectory(guide), fileName);
}

export function guideAssetExists(
  guide: GuideCatalogItem,
  asset: 'cover' | 'preview' | 'full'
) {
  return fs.existsSync(getGuideAssetPath(guide, asset));
}
