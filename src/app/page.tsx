"use client";

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import ReviewSummary from '@/components/ReviewSummary';
import ReviewList from '@/components/ReviewList';
import Loading from '@/components/Loading';
import { ProductData } from '@/lib/types';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authExpires, setAuthExpires] = useState<string | null>(null);

  // Function to check authentication status
  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/reddit/status');
      const data = await response.json();
      
      setIsAuthenticated(data.authenticated);
      if (data.expiresAt) {
        setAuthExpires(data.expiresAt);
      }
      
      if (data.error && !authError) {
        setAuthError(data.error);
      }
      
      return data.authenticated;
    } catch (err) {
      console.error('Error checking auth status:', err);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Check if user is authenticated with Reddit and handle auth errors in URL
  useEffect(() => {
    // Check for auth errors in URL
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error');
    if (errorParam) {
      if (errorParam.startsWith('reddit_')) {
        setAuthError(`Reddit auth error: ${errorParam.replace('reddit_', '')}`);
      } else if (errorParam === 'invalid_state') {
        setAuthError('Authentication failed: Invalid state parameter');
      } else if (errorParam === 'no_code') {
        setAuthError('Authentication failed: No authorization code received');
      } else if (errorParam === 'auth_failed') {
        setAuthError('Authentication failed: Please try again');
      }
      
      // Remove error from URL without reloading the page
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.toString());
    }
    
    // Check for successful auth
    if (url.searchParams.get('auth') === 'success') {
      console.log('Successfully authenticated with Reddit');
      url.searchParams.delete('auth');
      window.history.replaceState({}, document.title, url.toString());
      checkAuthentication(); // Immediately check auth status after successful auth
    } else {
      // Check auth status on load
      checkAuthentication();
    }
    
    // Check auth status when window gains focus (in case of auth redirect)
    window.addEventListener('focus', checkAuthentication);
    return () => window.removeEventListener('focus', checkAuthentication);
  }, [authError]);

  // Format auth expiration time for display
  const getExpiresMessage = () => {
    if (!authExpires) return null;
    
    const expiresDate = new Date(authExpires);
    const now = new Date();
    const diffMs = expiresDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000); // minutes
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 5) return 'Expires in less than 5 minutes';
    if (diffMins < 60) return `Expires in ${diffMins} minutes`;
    return `Expires in ${Math.round(diffMins / 60)} hour`;
  };

  const handleRedditAuth = async () => {
    // Get the Reddit auth URL from our API
    try {
      setAuthError(null);
      const response = await fetch('/api/auth/reddit');
      if (!response.ok) {
        throw new Error('Failed to get Reddit authentication URL');
      }
      const data = await response.json();
      
      // Redirect to Reddit auth URL
      window.location.href = data.url;
    } catch (err) {
      console.error('Error starting Reddit authentication:', err);
      setAuthError((err as Error).message);
    }
  };

  const handleSearch = async (query: string) => {
    setQuery(query);
    setIsLoading(true);
    setError(null);
    setAuthError(null);
    setProductData(null);
    
    if (!isAuthenticated) {
      setError('Please connect to Reddit before searching');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/reviews?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error - set state but don't throw
          setIsAuthenticated(false);
          setError('Your Reddit authentication has expired. Please reconnect and try again.');
          
          // Automatically try to refresh authentication
          await checkAuthentication();
          setIsLoading(false);
          return;
        } else if (response.status === 404) {
          setError('No reviews found on Reddit for this product. Try a different search term.');
          setIsLoading(false);
          return;
        }
        
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch product reviews');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      setProductData(data);
    } catch (err) {
      console.error('Error fetching product reviews:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear auth cookies server-side
    try {
      const response = await fetch('/api/auth/reddit/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        setAuthExpires(null);
      } else {
        console.error('Failed to logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Reddit Review Aggregator
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Search for a product to see real Reddit reviews and sentiment analysis
          </p>
          
          <SearchBar onSearch={handleSearch} />
          
          <div className="mt-4 text-center">
            {isAuthenticated ? (
              <div className="flex flex-col items-center">
                <div className="text-sm text-green-600 mb-1">
                  ✓ Connected to Reddit
                </div>
                {authExpires && (
                  <div className="text-xs text-gray-500 mb-2">
                    {getExpiresMessage()}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs underline text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleRedditAuth}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Connect Reddit for Reviews
                </button>
                {authError && (
                  <div className="mt-2 text-xs text-red-600">{authError}</div>
                )}
              </div>
            )}
          </div>
          
          {isLoading && <Loading />}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
              <p>{error}</p>
              {error.includes('expired') && (
                <button
                  onClick={handleRedditAuth}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reconnect to Reddit
                </button>
              )}
            </div>
          )}
          
          {productData && !isLoading && (
            <div className="mt-8">
              <div className="text-sm px-3 py-1 rounded-full inline-block mb-4 bg-blue-100 text-blue-800 border border-blue-300">
                Reddit reviews
              </div>
              
              <ReviewSummary 
                productName={productData.name}
                averageRating={productData.averageRating} 
                reviewCount={productData.reviewCount}
                sentimentScore={productData.sentimentScore}
                pros={productData.pros}
                cons={productData.cons}
              />
              
              <div className="mt-8">
                <ReviewList reviews={productData.reviews} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-auto w-full text-center border-t border-gray-300 pt-8 text-sm text-gray-600">
        Reddit Review Aggregator
      </footer>
    </main>
  );
}
