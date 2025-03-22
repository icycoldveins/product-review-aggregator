export interface Review {
  id: string;
  source: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ProductData {
  name: string;
  averageRating: number;
  reviewCount: number;
  sentimentScore: number;
  pros: string[];
  cons: string[];
  reviews: Review[];
  source?: 'real' | 'mock';
} 