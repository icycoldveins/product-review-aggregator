import natural from 'natural';
import { Review } from './types';

// Analyze sentiment of a given text
export function analyzeSentiment(texts: string | string[]): number {
  const analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
  
  if (Array.isArray(texts)) {
    // If an array of texts is provided, analyze each and return average
    let totalScore = 0;
    texts.forEach(text => {
      const tokenized = new natural.WordTokenizer().tokenize(text);
      if (tokenized) {
        const score = analyzer.getSentiment(tokenized);
        totalScore += score;
      }
    });
    return texts.length > 0 ? totalScore / texts.length : 0;
  } else {
    // Single text analysis
    const tokenized = new natural.WordTokenizer().tokenize(texts);
    return tokenized ? analyzer.getSentiment(tokenized) : 0;
  }
}

// Extract pros and cons from reviews
export function extractProsAndCons(texts: string[]): { pros: string[], cons: string[] } {
  const positiveIndicators = ['love', 'great', 'excellent', 'good', 'best', 'perfect', 'awesome', 'amazing', 'fantastic', 'recommend'];
  const negativeIndicators = ['bad', 'poor', 'terrible', 'awful', 'worst', 'disappointed', 'issue', 'problem', 'difficult', 'annoying', 'broke'];
  
  const pros: string[] = [];
  const cons: string[] = [];
  
  // Use a simple regex-based sentence tokenizer instead
  const tokenizeSentences = (text: string): string[] => {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());
  };
  
  texts.forEach(text => {
    const sentences = tokenizeSentences(text);
    
    sentences.forEach(sentence => {
      sentence = sentence.toLowerCase();
      
      // Check if sentence contains positive indicators
      if (positiveIndicators.some(term => sentence.includes(term))) {
        // Clean up the sentence and add to pros if not a duplicate
        const cleanedSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        if (!pros.includes(cleanedSentence) && pros.length < 5) {
          pros.push(cleanedSentence);
        }
      }
      
      // Check if sentence contains negative indicators
      if (negativeIndicators.some(term => sentence.includes(term))) {
        // Clean up the sentence and add to cons if not a duplicate
        const cleanedSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        if (!cons.includes(cleanedSentence) && cons.length < 5) {
          cons.push(cleanedSentence);
        }
      }
    });
  });
  
  return { pros, cons };
}

// Calculate overall sentiment score from a list of reviews
export function calculateOverallSentiment(reviews: Review[]): number {
  if (reviews.length === 0) return 0.5;
  
  // Calculate based on ratings and existing sentiment values
  const totalSentiment = reviews.reduce((sum, review) => {
    if (review.sentiment) {
      // If sentiment is explicitly set, use it
      return sum + (
        review.sentiment === 'positive' ? 1 :
        review.sentiment === 'negative' ? 0 : 0.5
      );
    } else {
      // Otherwise derive from rating
      return sum + (
        review.rating >= 4 ? 1 :
        review.rating <= 2 ? 0 : 0.5
      );
    }
  }, 0);
  
  return totalSentiment / reviews.length;
}