"use client";

import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface ReviewCardProps {
  review: {
    id: string;
    source: string;
    author: string;
    rating: number;
    date: string;
    text: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { source, author, rating, date, text, sentiment } = review;
  
  // Determine sentiment based on rating if not provided
  const determinedSentiment = sentiment || 
    (rating >= 4 ? 'positive' : 
     rating <= 2 ? 'negative' : 
     'neutral');
  
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-400" aria-hidden="true" />);
      } else {
        stars.push(<StarOutline key={i} className="h-5 w-5 text-yellow-400" aria-hidden="true" />);
      }
    }
    return stars;
  };

  const sentimentColors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            {renderStars(rating)}
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">{author}</p>
          <p className="text-xs text-gray-500">
            From Reddit • {date}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sentimentColors[determinedSentiment]}`}>
          {determinedSentiment.charAt(0).toUpperCase() + determinedSentiment.slice(1)}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-700">{text}</p>
    </div>
  );
} 