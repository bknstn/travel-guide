'use client';

import { useState } from 'react';
import PersonalityQuiz from '@/components/PersonalityQuiz';
import DestinationInput from '@/components/DestinationInput';
import PlaceCard from '@/components/PlaceCard';

export interface Answer {
  questionId: number;
  value: string | number;
}

export interface Place {
  name: string;
  city: string;
  country: string;
  description: string;
  idealFor: string;
}

export default function Home() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswersChange = (newAnswers: Answer[]) => {
    setAnswers(newAnswers);
  };

  const handleDestinationSubmit = async (place: string) => {
    setIsLoading(true);
    setPlaces([]);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, place }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const places = await response.json();
      setPlaces(places);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - More Compact */}
        <div className="text-center py-3">
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-1">
            Your Travel Guide
          </h1>
        </div>

        {/* Main Content - Centered Single Column */}
        <div className={`flex flex-col items-center space-y-6 ${
          places.length === 0 ? 'justify-center min-h-[calc(100vh-8rem)]' : 'pb-8'
        }`}>
          {/* Personality Quiz */}
          <div className="w-full max-w-2xl">
            <PersonalityQuiz onChange={handleAnswersChange} />
          </div>

          {/* Destination Input */}
          <div className="w-full max-w-2xl">
            <DestinationInput onSubmit={handleDestinationSubmit} />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="w-full text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
              <p className="mt-2 text-sm text-secondary">Finding your perfect destinations...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && places.length === 0 && (
            <div className="w-full text-center py-8">
              <div className="text-center space-y-3 text-secondary">
                <div className="text-4xl">✈️</div>
                <p className="text-base">Enter a destination to get recommendations</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section - Full Width Below, Separate from Main Content */}
        {places.length > 0 && (
          <div className="w-full space-y-6 mt-8">
            <h2 className="text-xl font-medium text-foreground text-center">
              Your Recommendations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-8">
              {places.map((place, index) => (
                <PlaceCard key={index} place={place} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
