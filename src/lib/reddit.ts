import { Review } from './types';
import { analyzeSentiment } from './sentiment';

// Generate Reddit OAuth URL
export function getRedditAuthUrl(state: string): string {
  // For debugging
  console.log('Reddit credentials being used:',
    process.env.REDDIT_CLIENT_ID ? 'ID provided' : 'ID missing',
    process.env.REDDIT_CLIENT_SECRET ? 'Secret provided' : 'Secret missing',
    process.env.REDDIT_REDIRECT_URI
  );
  
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.REDDIT_REDIRECT_URI || 'http://localhost:3000/api/auth/reddit/callback';
  
  // Parameters for Reddit OAuth
  const params = new URLSearchParams({
    client_id: clientId as string,
    response_type: 'code',
    state,
    redirect_uri: redirectUri,
    duration: 'temporary',
    scope: 'read',
  });
  
  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

// Function to exchange authorization code for access token
export async function getAccessToken(code: string): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const redirectUri = process.env.REDDIT_REDIRECT_URI || 'http://localhost:3000/api/auth/reddit/callback';
  
  // Check if credentials are available
  if (!clientId || !clientSecret) {
    console.error('Missing Reddit API credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });
    throw new Error('Missing Reddit API credentials in server environment');
  }
  
  // For debugging - log the credentials being used (without exposing actual values)
  console.log('Exchanging code for token with credentials:',
    clientId ? 'ID provided' : 'ID missing',
    clientSecret ? 'Secret provided' : 'Secret missing',
    redirectUri
  );

  try {
    // Log full credentials for debugging (temporarily)
    console.log('DEBUG - Credentials (remove in production):', {
      clientId,
      redirectUri
    });
  
    // Reddit requires Basic Authentication for this endpoint
    // The auth string is "client_id:client_secret" encoded in base64
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Create a controller to enable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'web:product-review-aggregator:v1.0 (by /u/yourusername)'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
        signal: controller.signal
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      // Log response status for debugging
      console.log('Token exchange response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Reddit authentication failed: Invalid client credentials');
        } else if (response.status === 404) {
          throw new Error('Reddit authentication failed: API endpoint not found. Check client_id and secret format.');
        } else {
          throw new Error(`Reddit authentication failed: ${response.status} ${errorText}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.access_token) {
        console.error('No access token in response:', data);
        throw new Error('Failed to receive access token from Reddit');
      }
      
      return data.access_token;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Reddit API request timed out');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw new Error('Reddit authentication required');
  }
}

// Fetch product reviews from Reddit
export async function fetchRedditReviews(productName: string, accessToken: string): Promise<Review[]> {
  if (!accessToken) {
    console.error('No access token provided to fetchRedditReviews');
    throw new Error('Reddit authentication required');
  }

  try {
    // Add more subreddits to increase chances of finding content
    const subreddits = [
      'reviews', 'gadgets', 'technology', 'TechConsumerAdvice', 'ProductReviews',
      'BuyItForLife', 'GoodValue', 'ProductTesting', 'tech', 'Smartphones', 'laptops',
      'headphones', 'buildapc', 'techsupport', 'AskTechnology'
    ];
    
    // Create more variations of search terms
    const searchTerms = [
      `${productName} review`,
      `${productName} experience`,
      `${productName} pros cons`,
      productName, // Just the product name
      `${productName} thoughts`,
      `${productName} worth it`,
      `${productName} recommend`,
    ];
    
    console.log(`Searching for "${productName}" reviews in ${subreddits.length} subreddits with ${searchTerms.length} search terms`);
    
    const reviews: Review[] = [];
    
    // First try searching all of Reddit (not just specific subreddits)
    console.log(`Searching all of Reddit for: ${productName} review`);
    try {
      const response = await fetch(
        `https://oauth.reddit.com/search?q=${encodeURIComponent(productName + ' review')}&sort=relevance&t=all`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'web:product-review-aggregator:v1.0 (by /u/yourusername)',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const posts = data.data.children;
        
        console.log(`Found ${posts.length} posts in all-Reddit search`);
        
        // Process each post with less strict filtering
        for (const post of posts) {
          // Check if post content or title contains the product name (case insensitive)
          const titleLower = post.data.title.toLowerCase();
          const textLower = post.data.selftext ? post.data.selftext.toLowerCase() : '';
          const productNameLower = productName.toLowerCase();
          
          if (titleLower.includes(productNameLower) || textLower.includes(productNameLower)) {
            // Extract text from post
            const text = extractReviewText(post.data.title, post.data.selftext || '');
            
            // Skip very short texts
            if (text.length < 30 && !post.data.is_self) continue;
            
            // Analyze sentiment of the review text
            const sentimentScore = analyzeSentiment(text);
            
            // Determine sentiment category based on score
            let sentiment: 'positive' | 'neutral' | 'negative';
            if (sentimentScore >= 0.3) {
              sentiment = 'positive';
            } else if (sentimentScore <= -0.3) {
              sentiment = 'negative';
            } else {
              sentiment = 'neutral';
            }
            
            // Convert to our Review format
            reviews.push({
              id: post.data.id,
              source: 'Reddit',
              author: post.data.author,
              rating: convertRedditScoreToRating(post.data.score, post.data.upvote_ratio || 0.5),
              date: new Date(post.data.created_utc * 1000).toISOString().split('T')[0],
              text,
              sentiment
            });
          }
          
          // If we have enough reviews, stop
          if (reviews.length >= 20) break;
        }
      }
    } catch (error) {
      console.log('Error with all-Reddit search:', error.message);
      // Continue to the subreddit-specific searches
    }
    
    // If we still need more reviews, search specific subreddits
    if (reviews.length < 10) {
      // Search for reviews in multiple subreddits
      for (const subreddit of subreddits) {
        // Try different search terms
        for (const searchTerm of searchTerms) {
          console.log(`Searching r/${subreddit} for: ${searchTerm}`);
          
          try {
            const response = await fetch(
              `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(searchTerm)}&restrict_sr=on&sort=relevance&t=all`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'User-Agent': 'web:product-review-aggregator:v1.0 (by /u/yourusername)',
                },
              }
            );
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error searching r/${subreddit}:`, response.status, errorText);
              
              if (response.status === 401 || response.status === 403) {
                throw new Error('Reddit authentication failed or expired');
              }
              
              continue; // Try next subreddit/search term
            }
            
            const data = await response.json();
            const posts = data.data.children;
            
            console.log(`Found ${posts.length} posts in r/${subreddit} for "${searchTerm}"`);
            
            // Process each post with less strict filtering
            for (const post of posts) {
              // Check if we already have this post
              if (reviews.some(r => r.id === post.data.id)) {
                continue;
              }
              
              // Extract text from post - don't require the post to be a self post
              const text = extractReviewText(post.data.title, post.data.selftext || '');
              
              // Skip very short texts
              if (text.length < 30 && !post.data.is_self) continue;
              
              // Analyze sentiment of the review text
              const sentimentScore = analyzeSentiment(text);
              
              // Determine sentiment category based on score
              let sentiment: 'positive' | 'neutral' | 'negative';
              if (sentimentScore >= 0.3) {
                sentiment = 'positive';
              } else if (sentimentScore <= -0.3) {
                sentiment = 'negative';
              } else {
                sentiment = 'neutral';
              }
              
              // Convert to our Review format
              reviews.push({
                id: post.data.id,
                source: 'Reddit',
                author: post.data.author,
                rating: convertRedditScoreToRating(post.data.score, post.data.upvote_ratio || 0.5),
                date: new Date(post.data.created_utc * 1000).toISOString().split('T')[0],
                text,
                sentiment
              });
              
              // If we have enough reviews, stop
              if (reviews.length >= 20) break;
            }
          } catch (searchError) {
            console.error(`Error searching r/${subreddit} for "${searchTerm}":`, searchError);
            // If it's an auth error, propagate it up
            if (searchError.message?.includes('authentication')) {
              throw searchError;
            }
            // Otherwise continue to next search
            continue;
          }
          
          // If we have enough reviews from this subreddit, move to next one
          if (reviews.length >= 5) break;
        }
        
        // If we have enough reviews total, stop searching other subreddits
        if (reviews.length >= 20) break;
      }
    }
    
    console.log(`Total reviews found for "${productName}": ${reviews.length}`);
    return reviews;
  } catch (error) {
    console.error('Error fetching Reddit reviews:', error);
    // Re-throw auth errors
    if (error.message?.includes('authentication')) {
      throw error;
    }
    // Return empty array for other errors
    return [];
  }
}

// Helper function to convert Reddit score and upvote ratio to a 1-5 rating
function convertRedditScoreToRating(score: number, upvoteRatio: number): number {
  // Default values if data is missing
  if (typeof score !== 'number') score = 1;
  if (typeof upvoteRatio !== 'number') upvoteRatio = 0.5;
  
  // Basic rating scale:
  // - Very negative posts (negative score): 1-2 stars
  // - Neutral posts (low score, average ratio): 3 stars
  // - Positive posts (high score, high ratio): 4-5 stars
  
  if (score < 0) return 1; // Downvoted content is likely negative
  
  // Start with a base rating from upvote ratio
  // 50% upvoted (controversial) = 2.5 stars
  // 100% upvoted = 5 stars
  let baseRating = upvoteRatio * 5;
  
  // Adjust for score (popularity)
  let scoreBonus = 0;
  if (score > 100) scoreBonus = 1;     // Very popular
  else if (score > 50) scoreBonus = 0.8; // Popular
  else if (score > 20) scoreBonus = 0.6; // Somewhat popular
  else if (score > 10) scoreBonus = 0.4; // Slightly popular
  else if (score > 5) scoreBonus = 0.2;  // Few upvotes
  
  // Calculate final rating
  const rating = Math.round(baseRating + scoreBonus);
  
  // Ensure rating is between 1-5
  return Math.max(1, Math.min(rating, 5));
}

// Extract meaningful review text from Reddit posts
function extractReviewText(title: string, selftext: string): string {
  // Use self text if it's substantial, otherwise use title
  // For link posts (not self posts), title is often the review summary
  let text = '';
  
  if (selftext && selftext.length > 50) {
    text = selftext;
  } else {
    text = title;
  }
  
  // Remove common Reddit formatting and unnecessary content
  text = text
    .replace(/\[removed\]/gi, '')
    .replace(/\[deleted\]/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x200B;/g, '') // zero-width space
    .trim();
  
  // If text is still too short, return the title
  if (text.length < 20) {
    text = title;
  }
  
  // Truncate if too long (for UI purposes)
  if (text.length > 1000) {
    return text.substring(0, 997) + '...';
  }
  
  return text;
} 