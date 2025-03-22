export interface Review {
  id: string;
  source: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface FeatureMention {
  feature: string;
  count: number;
  sentiment: number;
}

export interface ProductData {
  name: string;
  averageRating: number;
  reviewCount: number;
  sentimentScore: number;
  confidenceScore: number;
  sentimentConsistency: number;
  pros: string[];
  cons: string[];
  keyTopics: string[];
  featureMentions: FeatureMention[];
  reviews: Review[];
  source: 'real' | 'mock';
} 