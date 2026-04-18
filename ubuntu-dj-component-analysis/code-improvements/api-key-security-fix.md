# API Key Handling Security Fix

## Problem
API keys for YouTube and Anthropic services were hardcoded in component files, creating security vulnerabilities and deployment issues.

## Root Cause
```typescript
// BEFORE: Hardcoded API keys
const YOUTUBE_API_KEY = 'AIzaSyBvK8x8v9x9x9x9x9x9x9x9x9x9x9x9x9x9x9x9x';
const ANTHROPIC_API_KEY = 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const fetchYouTubeData = async (query: string) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${query}`
  );
  // ...
};
```

This exposed sensitive credentials in the codebase and prevented secure deployment.

## Solution
Migrated to environment variable configuration with runtime validation.

```typescript
// AFTER: Secure environment-based API key management
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error('NEXT_PUBLIC_YOUTUBE_API_KEY is required');
}

if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required');
}

const fetchYouTubeData = async (query: string) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${query}`
  );

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  return response.json();
};
```

## Benefits
- ✅ Eliminates hardcoded secrets from codebase
- ✅ Enables secure deployment across environments
- ✅ Prevents accidental API key exposure
- ✅ Runtime validation catches configuration errors early

## Validation
- API keys removed from all component files
- Environment variables configured in production
- Build process validates required keys are present
- No security audit warnings for exposed credentials