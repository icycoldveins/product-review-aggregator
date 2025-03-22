"use client";

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface ReviewSummaryProps {
  productName: string;
  averageRating: number;
  reviewCount: number;
  sentimentScore: number;
  pros: string[];
  cons: string[];
}

export default function ReviewSummary({
  productName,
  averageRating,
  reviewCount,
  sentimentScore,
  pros,
  cons
}: ReviewSummaryProps) {
  // Calculate whether the recommendation is to buy or not
  const recommendation = sentimentScore >= 0.6 ? 'Buy' : sentimentScore <= 0.4 ? 'Don\'t Buy' : 'Consider';
  
  // Define colors based on sentiment score
  const getRecommendationColor = () => {
    if (sentimentScore >= 0.6) return 'bg-green-100 border-green-500 text-green-800';
    if (sentimentScore <= 0.4) return 'bg-red-100 border-red-500 text-red-800';
    return 'bg-yellow-100 border-yellow-500 text-yellow-800';
  };

  // Convert sentiment score to percentage
  const sentimentPercentage = Math.round(sentimentScore * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{productName}</h2>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-lg text-gray-500 ml-1">/5</span>
          </div>
          <p className="text-sm text-gray-600">{reviewCount} reviews</p>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-medium mb-1">Sentiment Score</div>
          <div className="text-3xl font-bold">{sentimentPercentage}%</div>
        </div>
        
        <div className={`border-2 rounded-lg p-4 ${getRecommendationColor()}`}>
          <div className="text-lg font-bold">Recommendation</div>
          <div className="text-2xl font-bold">{recommendation}</div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="flex items-center text-lg font-semibold text-green-700 mb-2">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Pros
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {pros.map((pro, index) => (
              <li key={index} className="text-gray-700">{pro}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="flex items-center text-lg font-semibold text-red-700 mb-2">
            <XCircleIcon className="h-5 w-5 mr-2" />
            Cons
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {cons.map((con, index) => (
              <li key={index} className="text-gray-700">{con}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 