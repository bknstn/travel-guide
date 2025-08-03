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
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          AI Travel Guide
        </h1>

        <PersonalityQuiz onChange={handleAnswersChange} />
        <DestinationInput onSubmit={handleDestinationSubmit} />

        {isLoading && (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {places.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Personalized Recommendations
            </h2>
            {places.map((place, index) => (
              <PlaceCard key={index} place={place} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
