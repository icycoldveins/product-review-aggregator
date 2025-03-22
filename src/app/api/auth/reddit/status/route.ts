import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('reddit_auth_token');
    const expireCookie = cookieStore.get('reddit_auth_expires');
    
    // Return status based on token cookie presence
    if (!tokenCookie?.value) {
      console.log('No reddit_auth_token cookie found, user is not authenticated');
      return NextResponse.json({ 
        authenticated: false,
        reason: 'no_auth_token'
      });
    }
    
    // Check if the token has expired based on the timestamp cookie
    if (expireCookie?.value) {
      const expiresAt = new Date(expireCookie.value);
      const now = new Date();
      
      if (now > expiresAt) {
        console.log('Reddit auth token has expired');
        
        // Clear the expired token cookies
        const response = NextResponse.json({ 
          authenticated: false, 
          error: 'Token expired',
          reason: 'token_expired'
        });
        
        response.cookies.delete('reddit_auth_token');
        response.cookies.delete('reddit_auth_expires');
        
        return response;
      }
    }
    
    // Token exists and is not expired
    console.log('Valid auth token found, user is authenticated');
    return NextResponse.json({ 
      authenticated: true,
      expiresAt: expireCookie?.value
    });
  } catch (error: any) {
    console.error('Error checking Reddit auth status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check authentication status',
        authenticated: false,
        reason: 'server_error',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 