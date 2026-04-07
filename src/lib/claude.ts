import Anthropic from '@anthropic-ai/sdk';

import { GUIDE_CATALOG, getCatalogDigest, getGuideBySlug } from '@/lib/catalog';
import { GuideRecommendation } from '@/lib/types';

function buildSelectionPrompt(userBrief: string) {
  return `
You are helping a travel guide store choose PDF guides for a buyer.

User brief:
${userBrief}

Available guides:
${JSON.stringify(getCatalogDigest(), null, 2)}

Return a JSON array with up to 3 objects and no extra text:
[
  {
    "slug": "guide-slug",
    "reason": "short Russian explanation"
  }
]
`.trim();
}

export function extractRecommendations(text: string) {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [] as GuideRecommendation[];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as GuideRecommendation[];
    return parsed
      .filter((item) => item?.slug && getGuideBySlug(item.slug))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function scoreGuide(userBrief: string, guide: typeof GUIDE_CATALOG[number]) {
  const normalized = userBrief.toLowerCase();
  const haystack = [
    guide.title,
    guide.destination,
    guide.shortDescription,
    guide.fullDescription,
    guide.curatorSynopsis,
    guide.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return normalized
    .split(/[^a-zA-Zа-яА-Я0-9]+/)
    .filter(Boolean)
    .reduce((total, token) => (haystack.includes(token) ? total + 1 : total), 0);
}

export function fallbackRecommendations(userBrief: string) {
  const ranked = [...GUIDE_CATALOG]
    .map((guide) => ({
      guide,
      score: scoreGuide(userBrief, guide),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ guide }) => ({
      slug: guide.slug,
      reason:
        guide.tags.length > 0
          ? `Подходит по настроению поездки: ${guide.tags.slice(0, 3).join(', ')}.`
          : 'Подходит по описанию вашей поездки.',
    }));

  return ranked.length > 0
    ? ranked
    : GUIDE_CATALOG.slice(0, 3).map((guide) => ({
        slug: guide.slug,
        reason: 'Хороший стартовый вариант для первого выбора.',
      }));
}

export async function recommendGuidesFromBrief(userBrief: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackRecommendations(userBrief);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: buildSelectionPrompt(userBrief),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return fallbackRecommendations(userBrief);
    }

    const parsed = extractRecommendations(textBlock.text);
    return parsed.length > 0 ? parsed : fallbackRecommendations(userBrief);
  } catch {
    return fallbackRecommendations(userBrief);
  }
}
