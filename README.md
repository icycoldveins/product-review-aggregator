# Reddit Review Aggregator

A tool that aggregates product reviews from Reddit, performs sentiment analysis, and extracts pros and cons.

## Features

- Search for products and get real Reddit reviews
- Analyze sentiment of reviews (positive, negative, neutral)
- Extract pros and cons from reviews
- Visualize review data with ratings and sentiment scores
- Authenticated access to Reddit API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Reddit API credentials (required)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/reddit-review-aggregator.git
cd reddit-review-aggregator
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following:
```env
# Reddit API Credentials
# Create a Reddit app at https://www.reddit.com/prefs/apps
# The client ID is shown under your app name
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/reddit/callback
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Reddit Integration Setup

To use this application, you need to create a Reddit application and set up OAuth credentials:

1. **Create a Reddit App**:
   - Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
   - Click "Create App" or "Create Another App" at the bottom
   - Fill in the form:
     - **Name**: Reddit Review Aggregator (or your preferred name)
     - **App type**: Web app
     - **Description**: A tool that aggregates Reddit reviews
     - **About URL**: (optional) Your website URL
     - **Redirect URI**: `http://localhost:3000/api/auth/reddit/callback`
   - Click "Create app"

2. **Get your credentials**:
   - The **client ID** is the string shown under your app name
   - The **client secret** is labeled as "secret"

3. **Update your `.env.local` file**:
   ```env
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here
   REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/reddit/callback
   ```

4. **Using Reddit Authentication**:
   - Start the development server with `npm run dev`
   - Click "Connect Reddit for Reviews" on the homepage
   - You'll be redirected to Reddit to authorize the app
   - After authorization, you'll be redirected back to the app
   - You can now search for products to see real Reddit reviews

5. **Troubleshooting**:
   - Ensure your client ID and secret are correct and formatted properly
   - Check that your redirect URI exactly matches what's registered with Reddit
   - The access token expires after 1 hour - you may need to reconnect
   - Reddit API has rate limits, so you might encounter errors with frequent requests
   - Check browser console and server logs for more detailed error information

## Development

The project is built with:

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- Natural language processing for sentiment analysis

### Project Structure

- `src/app` - Next.js App Router pages and API routes
- `src/components` - React components
- `src/lib` - Utility functions and libraries
  - `reddit.ts` - Reddit API integration
  - `sentiment.ts` - Sentiment analysis functions
  - `types.ts` - TypeScript type definitions

### API Routes

- `GET /api/reviews` - Get reviews for a product from Reddit
- `GET /api/auth/reddit` - Get Reddit authorization URL
- `GET /api/auth/reddit/callback` - Handle Reddit OAuth callback
- `GET /api/auth/reddit/status` - Check Reddit authentication status

## License

MIT

## Acknowledgments

- Reddit API for providing access to real user reviews
- Next.js team for the amazing framework
- Natural language processing libraries for sentiment analysis capabilities
