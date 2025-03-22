"use client";

import { useState } from 'react';
import ReviewCard from './ReviewCard';

interface Review {
  id: string;
  source: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  
  // Helper function to determine sentiment based on rating if not provided
  const getSentiment = (review: Review): 'positive' | 'neutral' | 'negative' => {
    if (review.sentiment) return review.sentiment;
    
    return review.rating >= 4 
      ? 'positive' 
      : review.rating <= 2 
        ? 'negative' 
        : 'neutral';
  };
  
  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return getSentiment(review) === filter;
  });

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'positive'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => setFilter('neutral')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'neutral'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'negative'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Negative
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No reviews match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
} 