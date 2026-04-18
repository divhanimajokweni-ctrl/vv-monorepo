# Waveform Component Analysis

## Overview
The Waveform component provides real-time audio visualization for UbuntuDJ's deck system, displaying amplitude data, cue points, and playback position with high-performance rendering.

## Functionality

### Core Features
- **Audio Visualization**: Real-time waveform rendering from audio buffer data
- **Playback Position**: Animated cursor showing current playback location
- **Cue Points**: User-defined markers for loops and jumps
- **Zoom Controls**: Variable zoom levels for detailed editing
- **Beat Detection**: Visual beat grid overlay with BPM synchronization

### Props Interface
```typescript
interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  cuePoints: CuePoint[];
  onCuePointAdd: (time: number) => void;
  onCuePointRemove: (id: string) => void;
  onSeek: (time: number) => void;
  zoom: number;
  height: number;
  colorScheme: 'blue' | 'green' | 'purple';
}
```

## State Management

### Internal State
```typescript
const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [dragState, setDragState] = useState<DragState | null>(null);
```

### Data Processing
```typescript
const processAudioBuffer = useCallback(async (buffer: AudioBuffer) => {
  setIsProcessing(true);

  // Downsample audio data for performance
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / 1000); // 1000 data points
  const peaks = [];

  for (let i = 0; i < 1000; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    const block = data.slice(start, end);

    const peak = Math.max(...block.map(Math.abs));
    peaks.push(peak);
  }

  setWaveformData({ peaks, sampleRate: buffer.sampleRate });
  setIsProcessing(false);
}, []);
```

## Rendering Implementation

### Canvas-Based Rendering
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas || !waveformData) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw waveform
  ctx.strokeStyle = theme.colors.primary;
  ctx.lineWidth = 1;
  ctx.beginPath();

  waveformData.peaks.forEach((peak, index) => {
    const x = (index / waveformData.peaks.length) * canvas.width;
    const y = (canvas.height / 2) * (1 - peak);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw playback cursor
  const cursorX = (currentTime / duration) * canvas.width;
  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, canvas.height);
  ctx.stroke();
}, [waveformData, currentTime, duration, theme]);
```

## Event Handling

### Mouse Interactions
- **Click**: Seek to clicked position
- **Drag**: Scrub through audio while dragging
- **Double-click**: Add cue point at position
- **Right-click**: Context menu for cue point management

### Touch Support
- Single touch: Seek to position
- Long press: Add cue point
- Two-finger zoom: Adjust zoom level

## Performance Optimizations

### Data Downsampling
- Audio buffer downsampled to 1000 data points for smooth rendering
- Adaptive resolution based on zoom level and canvas width

### Efficient Rendering
- Canvas-based rendering for 60fps performance
- Offscreen canvas for complex operations
- RequestAnimationFrame for smooth animations

### Memory Management
- Audio buffer data processed in chunks
- Cleanup of processing workers when component unmounts

## Integration Points

### Audio Engine Integration
```typescript
// Connect to Web Audio API
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

// Real-time frequency analysis for visual effects
const updateFrequencyData = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Update visualizer with real-time data
  setFrequencyData(dataArray);
};
```

### Lindiwe AI Integration
- Beat detection algorithms for automatic cue point suggestions
- Harmonic analysis for intelligent loop point recommendations
- Audio quality assessment for automatic gain staging

## Accessibility Features

### Keyboard Navigation
- Arrow keys for precise seeking
- Spacebar for play/pause
- Number keys for jumping to cue points
- Zoom controls with +/- keys

### Screen Reader Support
- Current time and duration announced
- Cue point positions described
- Playback state changes communicated

## Testing Coverage

### Visual Accuracy Tests
- Waveform rendering matches audio amplitude
- Playback cursor position accuracy
- Cue point visual indicators

### Performance Tests
- Rendering performance at various zoom levels
- Memory usage during long audio files
- Touch interaction responsiveness

### Integration Tests
- Audio playback synchronization
- Cue point persistence
- Zoom state management

## Browser Compatibility
- Canvas 2D API support required
- Web Audio API for advanced features
- Touch events for mobile interaction
- Fallback rendering for older browsers