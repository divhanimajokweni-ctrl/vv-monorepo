# Turntable Component Analysis

## Overview
The Turntable component simulates professional DJ turntables with vinyl-style controls, platter rotation, and scratching capabilities for authentic DJ performance.

## Functionality

### Core Features
- **Vinyl Platter**: Realistic rotating platter with momentum physics
- **Scratching**: Touch/mouse-based scratching with variable speed control
- **Speed Control**: Variable pitch adjustment from -100% to +100%
- **Torque Simulation**: Realistic platter deceleration and acceleration
- **Visual Feedback**: RPM indicators and platter rotation animation

### Props Interface
```typescript
interface TurntableProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  speed: number; // -1.0 to 1.0 (pitch adjustment)
  onSpeedChange: (speed: number) => void;
  onScratch: (position: number, velocity: number) => void;
  platterSize?: 'standard' | 'large';
  showRPM?: boolean;
  enableScratching?: boolean;
}
```

## State Management

### Internal State
```typescript
const [platterRotation, setPlatterRotation] = useState(0);
const [angularVelocity, setAngularVelocity] = useState(0);
const [isScratching, setIsScratching] = useState(false);
const [scratchStartAngle, setScratchStartAngle] = useState(0);
const [lastTime, setLastTime] = useState(0);
```

### Physics Simulation
```typescript
const updatePhysics = useCallback((deltaTime: number) => {
  if (isScratching) {
    // Direct control during scratching
    setPlatterRotation(prev => prev + scratchVelocity * deltaTime);
    return;
  }

  // Realistic deceleration when not powered
  const friction = 0.95; // Slow decay
  const newVelocity = angularVelocity * friction;

  setAngularVelocity(newVelocity);
  setPlatterRotation(prev => prev + newVelocity * deltaTime);
}, [isScratching, angularVelocity, scratchVelocity]);
```

## Rendering Implementation

### Platter Rendering
```tsx
<div className="turntable-container">
  <svg className="platter" viewBox="0 0 300 300">
    {/* Vinyl record grooves */}
    <circle
      cx="150" cy="150" r="140"
      fill="none"
      stroke="#333"
      strokeWidth="1"
      opacity="0.3"
    />

    {/* Center label */}
    <circle cx="150" cy="150" r="20" fill="#1a1a1a" />
    <circle cx="150" cy="150" r="5" fill="#666" />

    {/* Speed indicator marks */}
    {Array.from({ length: 12 }, (_, i) => (
      <line
        key={i}
        x1="150"
        y1="30"
        x2="150"
        y2="40"
        stroke="#666"
        strokeWidth="2"
        transform={`rotate(${i * 30} 150 150)`}
      />
    ))}

    {/* Tonearm (optional visual element) */}
    <line
      x1="150" y1="50"
      x2="200" y2="120"
      stroke="#888"
      strokeWidth="3"
      opacity="0.7"
    />
  </svg>

  {/* RPM Display */}
  {showRPM && (
    <div className="rpm-display">
      {Math.abs(angularVelocity * 60 / (2 * Math.PI)).toFixed(1)} RPM
    </div>
  )}
</div>
```

## Event Handling

### Mouse/Touch Scratching
```typescript
const handlePointerDown = (event: React.PointerEvent) => {
  const rect = platterRef.current?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

  setIsScratching(true);
  setScratchStartAngle(angle);
  setScratchVelocity(0);
};

const handlePointerMove = (event: React.PointerEvent) => {
  if (!isScratching) return;

  const rect = platterRef.current?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const currentAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  const deltaAngle = currentAngle - scratchStartAngle;

  // Calculate scratch velocity for audio manipulation
  const velocity = deltaAngle / (event.timeStamp - lastPointerTime) * 1000;
  setScratchVelocity(velocity);

  onScratch(currentAngle, velocity);
  setScratchStartAngle(currentAngle);
  setLastPointerTime(event.timeStamp);
};
```

## Physics Engine

### Momentum Simulation
```typescript
const applyTorque = (torque: number) => {
  const acceleration = torque / platterInertia;
  setAngularVelocity(prev => prev + acceleration * deltaTime);
};

const platterInertia = 0.1; // Simulated platter mass
const frictionCoefficient = 0.02;

// Natural deceleration
useEffect(() => {
  const interval = setInterval(() => {
    setAngularVelocity(prev => {
      const friction = -prev * frictionCoefficient;
      const newVelocity = prev + friction;

      // Stop when velocity becomes very small
      return Math.abs(newVelocity) < 0.001 ? 0 : newVelocity;
    });
  }, 16); // 60fps

  return () => clearInterval(interval);
}, []);
```

## Audio Integration

### Scratching Audio Effect
```typescript
const applyScratching = (position: number, velocity: number) => {
  if (!audioBuffer) return;

  // Calculate audio position based on platter angle
  const audioPosition = (position / (2 * Math.PI)) * audioBuffer.duration;

  // Apply pitch shifting based on velocity
  const pitchShift = velocity * 0.1; // Adjustable scratch sensitivity

  // Send to audio engine
  audioEngine.setPlaybackPosition(audioPosition);
  audioEngine.setPitchShift(pitchShift);
};
```

## Performance Optimizations

### Efficient Rendering
- CSS transforms for smooth platter rotation
- Reduced update frequency during idle states
- Hardware acceleration for SVG animations

### Memory Management
- Cleanup of animation frames on unmount
- Efficient state updates to prevent unnecessary re-renders

## Accessibility Features

### Alternative Controls
- Keyboard shortcuts for speed control (+/- keys)
- Slider controls for users who cannot use mouse/touch
- Screen reader announcements for platter state

### Visual Indicators
- High contrast platter markings
- Clear visual feedback for scratching state
- Audible feedback for speed changes

## Integration Points

### Deck Component Integration
```tsx
// In Deck component
<Turntable
  audioBuffer={currentTrack?.buffer}
  isPlaying={isPlaying}
  speed={speed}
  onSpeedChange={setSpeed}
  onScratch={(position, velocity) => {
    audioEngine.applyScratching(position, velocity);
  }}
  enableScratching={true}
  showRPM={true}
/>
```

### Audio Engine Synchronization
- Real-time position sync with audio playback
- Pitch changes applied to audio processing
- Scratching effects routed through audio graph

## Testing Coverage

### Physics Tests
- Platter momentum and deceleration accuracy
- Scratch velocity calculations
- Torque application and friction simulation

### Interaction Tests
- Mouse and touch scratching responsiveness
- Speed control precision
- Visual rotation synchronization

### Audio Tests
- Scratching audio artifacts
- Pitch shifting accuracy
- Playback position mapping

## Browser Compatibility
- Pointer Events API for cross-device scratching
- CSS Transforms for smooth animations
- Web Audio API for audio manipulation
- Fallback controls for older browsers