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
    <div className="apple-card p-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium tracking-tight text-foreground mb-1">
          Where to?
        </h2>
        <p className="text-xs text-secondary">
          City, country, or region
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="e.g., Tokyo, Japan"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 text-center"
          />
        </div>
        <button
          type="submit"
          disabled={!destination.trim()}
          className="w-full bg-accent text-white py-2 px-4 rounded-lg font-medium hover:bg-accent/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
        >
          Get Recommendations
        </button>
      </form>
    </div>
  );
}
