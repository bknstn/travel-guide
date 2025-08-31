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
    if (answers.length < 5) {
      alert('Please complete the personality quiz first');
      return;
    }

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
    <main className="h-screen bg-background p-4 overflow-hidden">
      <div className="h-full max-w-4xl mx-auto flex flex-col">
        {/* Header - More Compact */}
        <div className="text-center py-3">
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-1">
            Your Travel Guide
          </h1>
        </div>

        {/* Main Content - Centered Single Column */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Personality Quiz */}
          <div className="w-full max-w-2xl">
            <PersonalityQuiz onChange={handleAnswersChange} />
          </div>

          {/* Destination Input */}
          <div className="w-full max-w-2xl">
            <DestinationInput onSubmit={handleDestinationSubmit} />
          </div>
        </div>

        {/* Results Section - Full Width Below */}
        {isLoading && (
          <div className="w-full text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            <p className="mt-2 text-sm text-secondary">Finding your perfect destinations...</p>
          </div>
        )}

        {places.length > 0 && (
          <div className="w-full space-y-4 overflow-y-auto max-h-64">
            <h2 className="text-lg font-medium text-foreground text-center">
              Your Recommendations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {places.map((place, index) => (
                <PlaceCard key={index} place={place} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && places.length === 0 && (
          <div className="w-full text-center py-4">
            <div className="text-center space-y-3 text-secondary">
              <div className="text-4xl">✈️</div>
              <p className="text-base">Complete the quiz and enter a destination</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
