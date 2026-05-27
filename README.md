# next-movies

A modern, production-grade web application for discovering movies, TV shows, and actors. Built with Next.js App Router and powered by The Movie Database (TMDb) API.

## Core Features
- Browse popular, trending, and top-rated movies and TV shows
- View detailed information for movies, TV series, and cast members
- Search functionality for movies, shows, and people
- Discover content by genre
- Watch trailers directly within the application
- View available streaming/watch sources
- TV show season and episode guides
- Dark/Light mode theme toggle
- Fully responsive design

## Tech Stack
- **Framework**: Next.js (App Router, Server Components)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Components**: Radix UI, Class Variance Authority (CVA)
- **Data Source**: TMDb API

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file based on the required variables below.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables
The following environment variables are actually used in the application:
- `TMDB_TOKEN`: Your TMDb API Read Access Token (v4). This is required for fetching data from The Movie Database.
- `PUBLIC_TOKEN`: Custom public token.
- `NEXT_PUBLIC_TOKEN`: Custom public token exposed to the browser.

## Development Commands
- `npm run dev`: Starts the Next.js development server
- `npm run lint`: Runs ESLint for code quality checks

## Production Build
To create an optimized production build:
```bash
npm run build
```
Then, to start the production server:
```bash
npm run start
```

## Deployment Notes
- This application is optimized for Vercel or any Node.js hosting environment that supports Next.js.
- Ensure that `TMDB_TOKEN` is securely stored in your deployment environment variables.
- The `next.config.mjs` includes strict Content Security Policy (CSP) headers, so ensure any additional external resources (images, scripts, frames) are whitelisted if added in the future.

## Security Considerations
- **API Key Protection**: The `TMDB_TOKEN` is kept server-side. Client-side requests are routed through a local API endpoint (`/api/tmdb`) to prevent exposing the TMDb token to the browser.
- **Content Security Policy (CSP)**: Strict headers are defined in `next.config.mjs` limiting scripts, images, and frames to trusted sources (e.g., YouTube, TMDb).
- **No Local Database/Auth**: No user data is collected, stored, or processed, mitigating risks related to user data breaches.