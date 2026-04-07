import { GuideCatalogItem } from '@/lib/types';

export const GUIDE_CATALOG: GuideCatalogItem[] = [
  {
    slug: 'tokyo-after-dark',
    instagramAlias: 'tokyo',
    title: 'Токио после полуночи',
    destination: 'Токио, Япония',
    shortDescription:
      'Неочевидные кварталы, кофейни, бары и маршруты для тех, кто любит ночной ритм города.',
    fullDescription:
      'PDF-гайд по Токио с авторскими маршрутами по вечерним районам, тихими барами, джазовыми местами, кофейнями и практическими подсказками по транспорту.',
    priceLabel: '1 490 ₽',
    priceMinorUnits: 149000,
    currency: 'RUB',
    tributeProductId: 101,
    tributePaymentUrl: 'https://t.me/tribute/app?startapp=p101',
    tags: ['ночная жизнь', 'кофе', 'дизайн', 'урбанистика', 'еда'],
    curatorSynopsis:
      'Подходит тем, кто хочет исследовать Токио без туристической гонки, через атмосферу районов, локальные места и маршруты на 3-5 дней.',
  },
  {
    slug: 'lisbon-weekend-sun',
    instagramAlias: 'lisbon',
    title: 'Лиссабон на длинные выходные',
    destination: 'Лиссабон, Португалия',
    shortDescription:
      'Компактный гайд для мягкого городского отдыха: видовые точки, трамваи, плитка, океан и еда.',
    fullDescription:
      'PDF-гайд по Лиссабону для 3-4 дней: кварталы, кафе, дневные прогулки, океанские вылазки и адреса, которые легко собрать в один спокойный маршрут.',
    priceLabel: '1 290 ₽',
    priceMinorUnits: 129000,
    currency: 'RUB',
    tributeProductId: 102,
    tributePaymentUrl: 'https://t.me/tribute/app?startapp=p102',
    tags: ['выходные', 'океан', 'еда', 'эстетика', 'спокойный темп'],
    curatorSynopsis:
      'Лучший вариант для тех, кто любит светлые города, пешие прогулки, видовые точки и не хочет перегружать поездку чеклистом.',
  },
  {
    slug: 'istanbul-creative-map',
    instagramAlias: 'istanbul',
    title: 'Креативный Стамбул',
    destination: 'Стамбул, Турция',
    shortDescription:
      'Микс из районов, магазинов, террас, современных пространств и маршрутов между двумя берегами.',
    fullDescription:
      'PDF-гайд по Стамбулу с фокусом на дизайнерские районы, камерные кафе, винтаж, галереи и короткие маршруты для тех, кто любит насыщенный, но удобный город.',
    priceLabel: '1 390 ₽',
    priceMinorUnits: 139000,
    currency: 'RUB',
    tributeProductId: 103,
    tributePaymentUrl: 'https://t.me/tribute/app?startapp=p103',
    tags: ['дизайн', 'еда', 'районы', 'шопинг', 'культура'],
    curatorSynopsis:
      'Подходит для первого или повторного визита в Стамбул, когда хочется собрать свой маршрут из районов, еды и современной городской культуры.',
  },
];

export function getGuideBySlug(slug: string): GuideCatalogItem | undefined {
  return GUIDE_CATALOG.find((guide) => guide.slug === slug);
}

export function getGuideByTributeProductId(
  tributeProductId: number
): GuideCatalogItem | undefined {
  return GUIDE_CATALOG.find((guide) => guide.tributeProductId === tributeProductId);
}

export function getGuideByStartParam(startParam?: string | null) {
  if (!startParam) {
    return undefined;
  }

  const normalized = startParam.replace(/^ig_/, '');
  return GUIDE_CATALOG.find(
    (guide) => guide.slug === normalized || guide.instagramAlias === normalized
  );
}

export function getTelegramDeepLink(guide: GuideCatalogItem) {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return '#';
  }

  return `https://t.me/${botUsername}?start=ig_${guide.instagramAlias}`;
}

export function getCatalogDigest() {
  return GUIDE_CATALOG.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    destination: guide.destination,
    shortDescription: guide.shortDescription,
    tags: guide.tags,
    synopsis: guide.curatorSynopsis,
  }));
}

export function validateCatalog() {
  const slugs = new Set<string>();
  const tributeProductIds = new Set<number>();

  for (const guide of GUIDE_CATALOG) {
    if (slugs.has(guide.slug)) {
      throw new Error(`Duplicate guide slug: ${guide.slug}`);
    }

    if (tributeProductIds.has(guide.tributeProductId)) {
      throw new Error(
        `Duplicate Tribute product id: ${guide.tributeProductId}`
      );
    }

    slugs.add(guide.slug);
    tributeProductIds.add(guide.tributeProductId);
  }
}

validateCatalog();
