'use client';

import { useState, useEffect } from 'react';
import { Answer } from '@/app/page';

interface PersonalityQuizProps {
  onChange: (answers: Answer[]) => void;
}

interface Question {
  id: number;
  text: string;
  type: 'slider' | 'radio' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'I prefer planned itineraries vs. spontaneous adventures',
    type: 'slider',
    min: 1,
    max: 5,
  },
  {
    id: 2,
    text: 'My energy level on trips is usually...',
    type: 'radio',
    options: ['Relaxed', 'Moderate', 'Active', 'Hyperactive'],
  },
  {
    id: 3,
    text: 'I value cultural immersion over comfort',
    type: 'slider',
    min: 1,
    max: 5,
  },
  {
    id: 4,
    text: 'Crowds drain or energize me',
    type: 'radio',
    options: ['Drain me', 'Neutral', 'Energize me'],
  },
  {
    id: 5,
    text: 'Describe a perfect travel day in three words',
    type: 'text',
    placeholder: 'e.g., adventure, culture, food',
  },
];

export default function PersonalityQuiz({ onChange }: PersonalityQuizProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    onChange(answers);
  }, [answers, onChange]);

  const handleAnswerChange = (questionId: number, value: string | number) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      if (existing >= 0) {
        const newAnswers = [...prev];
        newAnswers[existing] = { questionId, value };
        return newAnswers;
      } else {
        return [...prev, { questionId, value }];
      }
    });
  };

  const getSliderLabel = (value: number) => {
    const labels = [
      'Strongly Disagree',
      'Disagree',
      'Neutral',
      'Agree',
      'Strongly Agree',
    ];
    return labels[value - 1] || 'Neutral';
  };

  return (
    <div className="bg-white rounded-2xl shadow px-6 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Who you are?</h2>
      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {question.text}
            </label>

            {question.type === 'slider' && (
              <div className="space-y-2">
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  defaultValue={3}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  onChange={(e) =>
                    handleAnswerChange(question.id, parseInt(e.target.value))
                  }
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <p className="text-sm text-gray-600">
                  {getSliderLabel(
                    (answers.find((a) => a.questionId === question.id)
                      ?.value as number) || 3
                  )}
                </p>
              </div>
            )}

            {question.type === 'radio' && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <input
                type="text"
                placeholder={question.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                maxLength={50}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
