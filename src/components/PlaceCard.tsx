'use client';

import { Place } from '@/app/page';

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{place.name}</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {place.city}, {place.country}
        </span>
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">{place.description}</p>

      <div className="flex items-center">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Ideal for: {place.idealFor}
        </span>
      </div>
    </div>
  );
}
