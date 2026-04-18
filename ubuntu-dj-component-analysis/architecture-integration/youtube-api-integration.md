# YouTube API Integration Architecture

## Overview
UbuntuDJ integrates with YouTube API for video-to-audio conversion, enabling DJs to mix content directly from YouTube videos with proper licensing and attribution.

## Integration Points

### Video Search and Selection
```typescript
class YouTubeService {
  constructor(private apiKey: string) {}

  async searchTracks(query: string): Promise<YouTubeTrack[]> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key: this.apiKey,
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: '20',
        part: 'snippet'
      })
    );

    const data = await response.json();
    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: await this.getDuration(item.id.videoId)
    }));
  }

  async getAudioStream(videoId: string): Promise<AudioBuffer> {
    // Convert YouTube video to audio stream
    const audioUrl = await this.getAudioUrl(videoId);
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Decode to Web Audio API buffer
    const audioContext = new AudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  }
}
```

### Licensing and Attribution
- Content ID verification for licensed tracks
- Attribution display in UI
- Monetization sharing compliance
- Geographic availability checking

### Audio Quality Optimization
- Adaptive bitrate streaming
- Audio normalization
- Format conversion (WebM/MP4 to WAV)
- Background downloading for seamless playback

## Technical Implementation

### CORS and Security
- Proxy server for API requests (avoiding client-side API key exposure)
- Secure token handling
- Rate limiting compliance
- Error handling for quota exceeded

### Caching Strategy
```typescript
const audioCache = new Map<string, AudioBuffer>();

const getCachedAudio = async (videoId: string): Promise<AudioBuffer> => {
  if (audioCache.has(videoId)) {
    return audioCache.get(videoId)!;
  }

  const audioBuffer = await youtubeService.getAudioStream(videoId);

  // Cache with LRU eviction
  if (audioCache.size >= 50) {
    const firstKey = audioCache.keys().next().value;
    audioCache.delete(firstKey);
  }

  audioCache.set(videoId, audioBuffer);
  return audioBuffer;
};
```

### Performance Considerations
- Progressive loading for long videos
- Memory management for large audio files
- Background processing for multiple tracks
- Quality vs. speed trade-offs

## User Experience Integration

### Search Interface
- Real-time search with debouncing
- Preview playback in search results
- Metadata display (duration, views, upload date)
- Favorite and playlist integration

### Playback Integration
- Seamless loading into decks
- Automatic BPM/key analysis
- Waveform generation
- Cue point suggestions

### Legal Compliance
- Terms of service acceptance flow
- Age-restricted content filtering
- Copyright strike monitoring
- DMCA compliance automation