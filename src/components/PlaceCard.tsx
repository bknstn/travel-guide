'use client';

import { Place } from '@/app/page';

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  return (
    <div className="apple-card p-3 transition-all duration-300 hover:scale-102 hover:shadow-md">
      <div className="space-y-2">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-base font-medium tracking-tight text-foreground leading-tight">
            {place.name}
          </h3>
          <span className="inline-block text-xs text-secondary bg-border/50 px-2 py-1 rounded-full font-medium">
            {place.city}, {place.country}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-secondary leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {place.description}
        </p>

        {/* Ideal For */}
        <div className="pt-1">
          <span className="inline-block text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
            {place.idealFor}
          </span>
        </div>
      </div>
    </div>
  );
}
