import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear Reddit auth cookies
    response.cookies.delete('reddit_auth_token');
    response.cookies.delete('reddit_auth_expires');
    response.cookies.delete('reddit_auth_state');
    
    console.log('Reddit auth cookies cleared');
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 