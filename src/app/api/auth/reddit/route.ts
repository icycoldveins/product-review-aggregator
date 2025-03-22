import { NextResponse } from 'next/server';
import { getRedditAuthUrl } from '@/lib/reddit';

export async function GET() {
  try {
    // Generate a random state string to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);
    
    // Generate the Reddit auth URL with our state parameter
    const url = getRedditAuthUrl(state);
    
    // Log the auth URL generation
    console.log('Generated Reddit auth URL with state:', state);
    
    // Create response with the auth URL
    const response = NextResponse.json({ url });
    
    // Store the state in a cookie for validation during callback
    response.cookies.set('reddit_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 // 10 minutes
    });
    
    // Return the auth URL to the client
    return response;
  } catch (error) {
    console.error('Error generating Reddit auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Reddit authentication URL' },
      { status: 500 }
    );
  }
} 