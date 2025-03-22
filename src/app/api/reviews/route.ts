import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRedditReviews } from '@/lib/reddit';
import { extractProsAndCons, calculateOverallSentiment } from '@/lib/sentiment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Check for Reddit authentication token
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('reddit_auth_token');
    
    if (!tokenCookie?.value) {
      console.log('No reddit_auth_token cookie found');
      return NextResponse.json(
        { error: 'Reddit authentication required' },
        { status: 401 }
      );
    }

    try {
      console.log('Found auth token in cookies, attempting to use it');
      
      // Use the stored access token directly
      const accessToken = tokenCookie.value;
      
      // Get reviews from Reddit
      console.log('Fetching reviews for query:', query);
      const reviews = await fetchRedditReviews(query, accessToken);
      console.log(`Received ${reviews.length} reviews from Reddit`);
      
      if (reviews.length === 0) {
        return NextResponse.json(
          { error: 'No reviews found on Reddit for this product' },
          { status: 404 }
        );
      }
      
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      // Extract review texts for pros and cons analysis
      const reviewTexts = reviews.map(review => review.text);
      
      // Calculate overall sentiment based on reviews
      const sentimentScore = calculateOverallSentiment(reviews);
      
      // Extract pros and cons from the review texts
      const { pros, cons } = extractProsAndCons(reviewTexts);
      
      // Format the response
      const productData = {
        name: query,
        averageRating,
        reviewCount: reviews.length,
        sentimentScore,
        pros,
        cons,
        reviews,
        source: 'real'
      };

      return NextResponse.json(productData);
    } catch (error) {
      console.error('Error fetching Reddit reviews:', error);
      
      // Handle errors from fetchRedditReviews
      if (error.message?.includes('authentication required') || 
          error.message?.includes('authentication failed') ||
          error.message?.includes('unauthorized') ||
          error.message?.includes('token') ||
          error.status === 401) {
        // Clear the expired token cookies
        const response = NextResponse.json(
          { error: 'Reddit authentication required or expired' },
          { status: 401 }
        );
        response.cookies.delete('reddit_auth_token');
        response.cookies.delete('reddit_auth_expires');
        return response;
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch reviews from Reddit: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing reviews:', error);
    return NextResponse.json(
      { error: 'Failed to process reviews: ' + error.message },
      { status: 500 }
    );
  }
} 