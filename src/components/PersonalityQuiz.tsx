'use client';

import { useState, useEffect } from 'react';
import { Answer } from '@/app/page';

interface PersonalityQuizProps {
  onChange: (answers: Answer[]) => void;
}

interface Question {
  id: number;
  text: string;
  type: 'slider' | 'text';
  min?: number;
  max?: number;
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'Planned vs. Spontaneous',
    type: 'slider',
    min: 1,
    max: 5,
  },
  {
    id: 2,
    text: 'Energy Level',
    type: 'slider',
    min: 1,
    max: 4,
  },
  {
    id: 3,
    text: 'Culture vs. Comfort',
    type: 'slider',
    min: 1,
    max: 5,
  },
  {
    id: 4,
    text: 'Crowds',
    type: 'slider',
    min: 1,
    max: 3,
  },
  {
    id: 5,
    text: 'Perfect travel day (3 words)',
    type: 'text',
    placeholder: 'adventure, culture, food',
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

  const getSliderLabel = (questionId: number, value: number) => {
    if (questionId === 1) { // Planned vs. Spontaneous
      const labels = ['Very Planned', 'Planned', 'Neutral', 'Spontaneous', 'Very Spontaneous'];
      return labels[value - 1] || 'Neutral';
    } else if (questionId === 2) { // Energy Level
      const labels = ['Relaxed', 'Moderate', 'Active', 'Hyperactive'];
      return labels[value - 1] || 'Moderate';
    } else if (questionId === 3) { // Culture vs. Comfort
      const labels = ['Comfort First', 'Balanced', 'Neutral', 'Culture First', 'Very Cultural'];
      return labels[value - 1] || 'Balanced';
    } else if (questionId === 4) { // Crowds
      const labels = ['Drain me', 'Neutral', 'Energize me'];
      return labels[value - 1] || 'Neutral';
    }
    return 'Neutral';
  };

  return (
    <div className="apple-card p-4 h-full">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium tracking-tight text-foreground mb-1">
          How to?
        </h2>
        <p className="text-xs text-secondary">
          Help us understand your travel style
        </p>
      </div>
      
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            {question.type === 'slider' && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground whitespace-nowrap min-w-[120px]">
                  {question.text}
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative w-[200px]">
                    <input
                      type="range"
                      min={question.min}
                      max={question.max}
                      defaultValue={Math.ceil((question.min! + question.max!) / 2)}
                      className="w-[200px] h-1.5 rounded-full appearance-none cursor-pointer slider-thumb"
                      onChange={(e) =>
                        handleAnswerChange(question.id, parseInt(e.target.value))
                      }
                    />
                    {/* Visual track indicator - normalized to same length */}
                    <div className="absolute top-0 left-0 h-1.5 bg-accent/30 rounded-full pointer-events-none" 
                         style={{ 
                           width: `${((answers.find((a) => a.questionId === question.id)?.value as number) || Math.ceil((question.min! + question.max!) / 2)) / question.max! * 100}%` 
                         }} />
                  </div>
                  <span className="text-xs text-accent font-medium min-w-[80px] text-right">
                    {getSliderLabel(
                      question.id,
                      (answers.find((a) => a.questionId === question.id)
                        ?.value as number) || Math.ceil((question.min! + question.max!) / 2)
                    )}
                  </span>
                </div>
              </div>
            )}

            {question.type === 'text' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {question.text}
                </label>
                <input
                  type="text"
                  placeholder={question.placeholder}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  maxLength={50}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
