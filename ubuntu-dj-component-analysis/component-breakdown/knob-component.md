# Knob Component Analysis

## Overview
The Knob component provides rotary control interface elements for UbuntuDJ's audio mixing controls, including EQ sliders, effect parameters, and volume controls.

## Functionality

### Core Features
- **Rotary Input**: 360-degree rotation with mouse/touch interaction
- **Value Mapping**: Configurable min/max values with step increments
- **Visual Feedback**: Real-time rotation animation and value display
- **Accessibility**: Keyboard navigation and screen reader support

### Props Interface
```typescript
interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
  disabled?: boolean;
}
```

## State Management

### Internal State
```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStartAngle, setDragStartAngle] = useState(0);
const [dragStartValue, setDragStartValue] = useState(0);
```

### Value Calculation
```typescript
const angle = ((value - min) / (max - min)) * 270 - 135; // -135° to +135° range
const angleRad = (angle * Math.PI) / 180;
```

## Event Handling

### Mouse Events
- `onMouseDown`: Initiates drag operation, calculates initial angle
- `onMouseMove`: Updates value based on angular displacement
- `onMouseUp`: Completes drag operation, cleanup

### Touch Events
- `onTouchStart`: Handles mobile touch initiation
- `onTouchMove`: Processes touch-based rotation
- `onTouchEnd`: Completes touch interaction

## Rendering Implementation

### Visual Structure
```tsx
<div className="knob-container">
  <svg className="knob-svg" viewBox="0 0 100 100">
    <circle className="knob-track" cx="50" cy="50" r="40" />
    <circle
      className="knob-indicator"
      cx={50 + 35 * Math.cos(angleRad)}
      cy={50 + 35 * Math.sin(angleRad)}
      r="3"
    />
  </svg>
  <div className="knob-value">{value.toFixed(1)}</div>
  {label && <div className="knob-label">{label}</div>}
</div>
```

## Performance Optimizations

### Memoization
```typescript
const angle = useMemo(() =>
  ((value - min) / (max - min)) * 270 - 135,
  [value, min, max]
);
```

### Event Throttling
- Mouse move events throttled to 16ms (60fps)
- Touch events use passive listeners for better scroll performance

## Accessibility Features

### Keyboard Navigation
- Arrow keys adjust value by step increments
- Page Up/Down for larger adjustments
- Home/End for min/max values

### ARIA Attributes
```tsx
<div
  role="slider"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-label={label || 'Knob control'}
  tabIndex={disabled ? -1 : 0}
/>
```

## Integration Points

### Parent Component Usage
```tsx
<Knob
  value={eq.low}
  onChange={(value) => updateEQ('low', value)}
  min={-12}
  max={12}
  step={0.5}
  label="Low"
  size="medium"
/>
```

### State Synchronization
- Values synchronized with audio processing engine
- Real-time updates during audio playback
- Persistence to localStorage for user preferences

## Testing Coverage

### Unit Tests
- Value mapping and angle calculations
- Event handling and state updates
- Prop validation and error cases
- Accessibility features

### Integration Tests
- Knob interaction in EQ controls
- Touch device compatibility
- Keyboard navigation flows
- Performance under high-frequency updates

## Browser Compatibility
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Touch events supported on iOS Safari and Android Chrome
- SVG rendering with fallback for older browsers