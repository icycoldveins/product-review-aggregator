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

// New metrics functions below

// Calculate review confidence score based on various factors
export function calculateConfidenceScore(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  
  // More reviews = higher confidence
  const reviewCountScore = Math.min(reviews.length / 20, 1); // Max out at 20 reviews
  
  // More diverse sources = higher confidence
  const uniqueAuthors = new Set(reviews.map(r => r.author)).size;
  const authorDiversityScore = Math.min(uniqueAuthors / reviews.length, 1);
  
  // Longer reviews = higher confidence
  const avgTextLength = reviews.reduce((sum, review) => sum + review.text.length, 0) / reviews.length;
  const textLengthScore = Math.min(avgTextLength / 500, 1); // Max out at 500 chars
  
  // Weigh the factors (can be adjusted based on importance)
  return (reviewCountScore * 0.5) + (authorDiversityScore * 0.3) + (textLengthScore * 0.2);
}

// Extract key topics discussed in reviews using TF-IDF
export function extractKeyTopics(reviews: Review[]): string[] {
  if (reviews.length === 0) return [];
  
  const tokenizer = new natural.WordTokenizer();
  const stopwords = ['the', 'and', 'is', 'of', 'in', 'to', 'a', 'for', 'with', 'on', 'at', 'from', 'by', 'it', 'this', 'that'];
  
  // Tokenize and filter all documents
  const documents = reviews.map(review => {
    const tokens = tokenizer.tokenize(review.text.toLowerCase()) || [];
    return tokens.filter(token => 
      token.length > 2 && 
      !stopwords.includes(token) && 
      !/^\d+$/.test(token) // Remove numbers
    );
  });
  
  // Create a frequency map
  const wordFrequency: {[key: string]: number} = {};
  const documentFrequency: {[key: string]: number} = {};
  
  // Calculate term frequency in all documents
  documents.forEach(doc => {
    const uniqueWords = new Set(doc);
    
    doc.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Count document frequency 
    uniqueWords.forEach(word => {
      documentFrequency[word] = (documentFrequency[word] || 0) + 1;
    });
  });
  
  // Calculate TF-IDF scores
  const tfidfScores: {term: string, score: number}[] = [];
  const numDocs = documents.length;
  
  Object.keys(wordFrequency).forEach(term => {
    const tf = wordFrequency[term]; // Term frequency
    const df = documentFrequency[term] || 1; // Document frequency
    const idf = Math.log(numDocs / df); // Inverse document frequency
    const tfidf = tf * idf;
    
    tfidfScores.push({ term, score: tfidf });
  });
  
  // Sort by score and take top 10
  return tfidfScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.term);
}

// Calculate sentiment consistency among reviews
export function calculateSentimentConsistency(reviews: Review[]): number {
  if (reviews.length <= 1) return 1; // Perfect consistency with 0-1 reviews
  
  const sentiments = reviews.map(review => {
    if (review.sentiment) {
      return review.sentiment === 'positive' ? 1 : 
             review.sentiment === 'negative' ? -1 : 0;
    } else {
      return review.rating >= 4 ? 1 : 
             review.rating <= 2 ? -1 : 0;
    }
  });
  
  // Count sentiment frequencies
  const positiveCount = sentiments.filter(s => s === 1).length;
  const neutralCount = sentiments.filter(s => s === 0).length;
  const negativeCount = sentiments.filter(s => s === -1).length;
  
  // Calculate the dominant sentiment's percentage
  const maxCount = Math.max(positiveCount, neutralCount, negativeCount);
  const consistencyScore = maxCount / reviews.length;
  
  return consistencyScore;
}

// Calculate feature mentions frequency
export function analyzeFeatureMentions(reviews: Review[]): {feature: string, count: number, sentiment: number}[] {
  if (reviews.length === 0) return [];
  
  // Common product features (could be customized by product category)
  const featureKeywords = {
    'battery': ['battery', 'charge', 'power', 'battery life'],
    'price': ['price', 'cost', 'expensive', 'cheap', 'affordable', 'value'],
    'quality': ['quality', 'build', 'construction', 'durable', 'sturdy'],
    'performance': ['performance', 'speed', 'fast', 'slow', 'responsive'],
    'design': ['design', 'look', 'aesthetics', 'style', 'color', 'size'],
    'usability': ['easy to use', 'intuitive', 'user friendly', 'interface', 'controls'],
    'reliability': ['reliable', 'consistent', 'dependable', 'trust', 'issues', 'problems'],
    'customer support': ['support', 'customer service', 'warranty', 'return'],
    'features': ['features', 'functionality', 'options', 'capability'],
    'software': ['software', 'app', 'application', 'updates', 'bugs']
  };
  
  const featureMentions: {[key: string]: {count: number, sentimentTotal: number}} = {};
  
  // Initialize features with zero counts
  Object.keys(featureKeywords).forEach(feature => {
    featureMentions[feature] = { count: 0, sentimentTotal: 0 };
  });
  
  // Find feature mentions in reviews
  reviews.forEach(review => {
    const text = review.text.toLowerCase();
    const reviewSentiment = review.sentiment === 'positive' ? 1 : 
                           review.sentiment === 'negative' ? -1 : 0;
    
    Object.entries(featureKeywords).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        featureMentions[feature].count += 1;
        featureMentions[feature].sentimentTotal += reviewSentiment;
      }
    });
  });
  
  // Format results and sort by count
  return Object.entries(featureMentions)
    .map(([feature, data]) => ({
      feature,
      count: data.count,
      sentiment: data.count > 0 ? data.sentimentTotal / data.count : 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}