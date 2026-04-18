# EQMeter Component Analysis

## Overview
The EQMeter component provides real-time visual feedback for audio equalization levels across frequency bands, displaying both pre and post-EQ signal levels.

## Functionality

### Core Features
- **Multi-band Display**: Visual meters for Low, Mid, High frequency bands
- **Peak Hold**: Peak level indicators with configurable hold time
- **RMS + Peak**: Simultaneous display of RMS and peak levels
- **Color Coding**: Intuitive color schemes for different level ranges
- **Calibration**: Reference level indicators and calibration controls

### Props Interface
```typescript
interface EQMeterProps {
  levels: {
    low: { rms: number; peak: number };
    mid: { rms: number; peak: number };
    high: { rms: number; peak: number };
  };
  range?: { min: number; max: number };
  holdTime?: number; // Peak hold duration in ms
  showRMS?: boolean;
  showPeak?: boolean;
  orientation?: 'vertical' | 'horizontal';
  size?: 'compact' | 'normal' | 'large';
}
```

## State Management

### Internal State
```typescript
const [peakHolds, setPeakHolds] = useState({
  low: -Infinity,
  mid: -Infinity,
  high: -Infinity
});
const [holdTimeouts, setHoldTimeouts] = useState<{
  low?: NodeJS.Timeout;
  mid?: NodeJS.Timeout;
  high?: NodeJS.Timeout;
}>({});
```

### Level Processing
```typescript
const updatePeakHolds = useCallback((band: 'low' | 'mid' | 'high', level: number) => {
  if (level > peakHolds[band]) {
    setPeakHolds(prev => ({ ...prev, [band]: level }));

    // Clear existing timeout
    if (holdTimeouts[band]) {
      clearTimeout(holdTimeouts[band]);
    }

    // Set new hold timeout
    const timeout = setTimeout(() => {
      setPeakHolds(prev => ({ ...prev, [band]: -Infinity }));
    }, holdTime);

    setHoldTimeouts(prev => ({ ...prev, [band]: timeout }));
  }
}, [peakHolds, holdTimeouts, holdTime]);
```

## Rendering Implementation

### Meter Bar Rendering
```tsx
const renderMeterBar = (band: 'low' | 'mid' | 'high') => {
  const { rms, peak } = levels[band];
  const peakHold = peakHolds[band];

  const rmsHeight = ((rms - range.min) / (range.max - range.min)) * 100;
  const peakHeight = ((peak - range.min) / (range.max - range.min)) * 100;
  const holdHeight = peakHold > -Infinity ?
    ((peakHold - range.min) / (range.max - range.min)) * 100 : 0;

  return (
    <div className="meter-bar-container">
      {/* Background scale */}
      <div className="meter-scale">
        {[-60, -40, -20, 0].map(level => (
          <div
            key={level}
            className="scale-mark"
            style={{ bottom: `${((level - range.min) / (range.max - range.min)) * 100}%` }}
          >
            {level}
          </div>
        ))}
      </div>

      {/* RMS Level */}
      {showRMS && (
        <div
          className="meter-rms"
          style={{ height: `${Math.max(0, rmsHeight)}%` }}
        />
      )}

      {/* Peak Level */}
      {showPeak && (
        <div
          className="meter-peak"
          style={{ height: `${Math.max(0, peakHeight)}%` }}
        />
      )}

      {/* Peak Hold */}
      {peakHold > -Infinity && (
        <div
          className="meter-hold"
          style={{ height: `${Math.max(0, holdHeight)}%` }}
        />
      )}
    </div>
  );
};
```

## Color Coding System

### Level Ranges
```typescript
const getLevelColor = (level: number): string => {
  if (level < -20) return '#00ff00'; // Green (safe)
  if (level < -6) return '#ffff00';  // Yellow (caution)
  if (level < 0) return '#ff8000';   // Orange (warning)
  return '#ff0000'; // Red (clipping)
};
```

## Performance Optimizations

### Efficient Updates
- Throttled updates to 30fps to prevent excessive re-renders
- Memoized calculations for level conversions
- Minimal DOM updates for smooth animation

### Memory Management
- Proper cleanup of peak hold timeouts
- Efficient state updates to prevent memory leaks

## Integration Points

### Audio Engine Connection
```typescript
// In parent component
useEffect(() => {
  const updateLevels = () => {
    const levels = audioEngine.getEQLevels();
    setMeterLevels(levels);
  };

  const interval = setInterval(updateLevels, 50); // 20fps updates
  return () => clearInterval(interval);
}, [audioEngine]);
```

### EQ Control Synchronization
- Real-time feedback for EQ knob adjustments
- Visual confirmation of frequency band changes
- Clipping indicators for gain staging guidance

## Accessibility Features

### Screen Reader Support
- Current levels announced for each band
- Peak warnings communicated audibly
- Keyboard navigation for calibration controls

### Visual Accessibility
- High contrast color schemes
- Adjustable text sizes for level indicators
- Configurable color blindness friendly palettes

## Testing Coverage

### Accuracy Tests
- Level measurement precision within 0.1dB
- Peak hold timing accuracy
- RMS calculation correctness

### Performance Tests
- Rendering performance at high update rates
- Memory usage during extended use
- Battery impact on mobile devices

### Integration Tests
- Audio engine level synchronization
- EQ control visual feedback
- Multi-band level independence

## Browser Compatibility
- CSS Grid/Flexbox for layout
- CSS Custom Properties for dynamic colors
- RequestAnimationFrame for smooth animations
- Fallback rendering for older browsers