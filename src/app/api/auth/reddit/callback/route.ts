import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAccessToken } from '@/lib/reddit';

export async function GET(request: Request) {
  console.log('Reddit callback received');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  console.log('Reddit callback params:', { 
    hasCode: !!code,
    state,
    error
  });
  
  // Create a response for error cases that clears any existing cookies
  const createErrorResponse = (errorPath: string) => {
    const response = NextResponse.redirect(new URL(errorPath, request.url));
    response.cookies.delete('reddit_auth_token');
    response.cookies.delete('reddit_auth_expires');
    response.cookies.delete('reddit_auth_state');
    return response;
  };
  
  // If Reddit returned an error
  if (error) {
    console.error('Reddit returned error:', error);
    return createErrorResponse(`/?error=reddit_${error}`);
  }
  
  // Get the state we stored in cookie
  const cookieStore = await cookies();
  const storedState = cookieStore.get('reddit_auth_state')?.value;
  
  // Verify state to prevent CSRF attacks
  if (!state || !storedState || state !== storedState) {
    console.error('State validation failed:', { received: state, stored: storedState });
    return createErrorResponse('/?error=invalid_state');
  }
  
  if (!code) {
    console.error('No authorization code received');
    return createErrorResponse('/?error=no_code');
  }
  
  try {
    // Exchange the authorization code for an access token immediately
    console.log('Exchanging code for access token');
    const accessToken = await getAccessToken(code);
    console.log('Successfully obtained access token');
    
    // Calculate expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 60 * 60 * 1000); // 1 hour in milliseconds
    
    console.log('Storing access token in cookie');
    
    const response = NextResponse.redirect(new URL('/?auth=success', request.url));
    
    // Clear the state cookie as it's no longer needed
    response.cookies.delete('reddit_auth_state');
    
    // Store the access token in a cookie
    response.cookies.set('reddit_auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    });
    
    // Set a non-httpOnly cookie with the expiration timestamp so the client can check it
    response.cookies.set('reddit_auth_expires', expiresAt.toISOString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    });
    
    return response;
  } catch (error) {
    console.error('Error handling Reddit callback:', error);
    return createErrorResponse('/?error=auth_failed');
  }
} 