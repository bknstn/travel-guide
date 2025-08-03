'use client';

import { useState } from 'react';

interface DestinationInputProps {
  onSubmit: (place: string) => void;
}

export default function DestinationInput({ onSubmit }: DestinationInputProps) {
  const [destination, setDestination] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      onSubmit(destination.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow px-6 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Where to?</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="City or country"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full rounded-full border px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={!destination.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-full font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate Recommendations
        </button>
      </form>
    </div>
  );
}
