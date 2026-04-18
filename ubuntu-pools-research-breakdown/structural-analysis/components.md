# Component Architecture Analysis

## Component Organization Structure

Ubuntu Pools follows a modular component architecture with clear separation of concerns, enabling maintainable scaling to 1M+ users through reusable, testable components.

## UI Component Library

### Base UI Components (`src/components/ui/`)
```tsx
// Button.tsx - Reusable button with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size, disabled, loading, onClick, children }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'px-3 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || loading,
        }
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

### Layout Components (`src/components/layout/`)
```tsx
// DashboardLayout.tsx - Authenticated user layout
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <Sidebar navigation={dashboardNav} />
      <main className="lg:pl-72">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// GameLayout.tsx - Game interface layout
export function GameLayout({ game, children }: { game: GameType; children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <GameHeader game={game} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <GameFooter game={game} />
    </div>
  );
}
```

## Game Components (`src/components/games/`)

### Game Engine Component
```tsx
// GameEngine.tsx - Core game logic wrapper
interface GameEngineProps {
  gameType: GameType;
  sessionId: string;
  onSessionEnd: (results: GameResults) => void;
}

export function GameEngine({ gameType, sessionId, onSessionEnd }: GameEngineProps) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const telemetryHook = useTelemetry(sessionId);

  useEffect(() => {
    telemetryHook.track('game_start', { gameType });
  }, []);

  const handleAction = async (action: GameAction) => {
    const newState = await processGameAction(gameState, action);
    setGameState(newState);
    telemetryHook.track('game_action', { action, newState });

    if (newState.gameOver) {
      onSessionEnd(newState.results);
    }
  };

  return (
    <GameRenderer
      gameState={gameState}
      onAction={handleAction}
      gameType={gameType}
    />
  );
}
```

### Individual Game Components
```tsx
// UbuntuMonopoly.tsx - Monopoly-style financial game
export function UbuntuMonopoly() {
  const [board, setBoard] = useState<MonopolyBoard>(initialBoard);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  return (
    <div className="grid grid-cols-11 gap-1 p-4">
      {board.spaces.map((space, index) => (
        <BoardSpace
          key={index}
          space={space}
          players={players.filter(p => p.position === index)}
        />
      ))}
    </div>
  );
}

// PoolSimulator.tsx - Pool contribution game
export function PoolSimulator() {
  const [pool, setPool] = useState<PoolState>(initialPool);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  return (
    <div className="space-y-6">
      <PoolOverview pool={pool} />
      <ContributionChart contributions={contributions} />
      <ActionPanel onContribute={handleContribution} />
    </div>
  );
}
```

## Form Components (`src/components/forms/`)

### Authentication Forms
```tsx
// LoginForm.tsx - User authentication
export function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { login, loading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLogin(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await login(formData.email, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
        error={errors.password}
      />
      <Button type="submit" loading={loading}>
        Sign In
      </Button>
    </form>
  );
}
```

## Custom Hooks (`src/hooks/`)

### Authentication Hook
```tsx
// useAuth.ts - Authentication state management
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(userData);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return { user, login, logout, loading };
}
```

### Telemetry Hook
```tsx
// useTelemetry.ts - Lindiwe AI telemetry
export function useTelemetry(sessionId: string) {
  const track = useCallback(async (eventType: string, data: any) => {
    try {
      await api.post('/telemetry/ingest', {
        sessionId,
        eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Telemetry tracking failed:', error);
    }
  }, [sessionId]);

  return { track };
}
```

## Utility Functions (`src/lib/utils/`)

### Game Logic Utilities
```tsx
// gameLogic.ts - Shared game mechanics
export function calculateScore(actions: GameAction[], gameType: GameType): number {
  const multipliers = {
    ubuntu_monopoly: 1.2,
    pool_simulator: 1.5,
    credit_ladder: 1.3,
    // ... other game types
  };

  return actions.reduce((score, action) => {
    return score + (action.points * (multipliers[gameType] || 1));
  }, 0);
}

export function validateGameState(state: GameState): ValidationResult {
  // Comprehensive state validation
  if (!state.players || state.players.length === 0) {
    return { valid: false, error: 'No players in game' };
  }
  
  if (state.currentTurn < 0 || state.currentTurn >= state.players.length) {
    return { valid: false, error: 'Invalid turn index' };
  }
  
  return { valid: true };
}
```

### API Utilities
```tsx
// api.ts - Centralized API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
```

## Component Composition Patterns

### Compound Components
```tsx
// GameCard.tsx - Compound component for game selection
interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  children: React.ReactNode;
}

function GameCard({ game, onSelect, children }: GameCardProps) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold">{game.name}</h3>
      <p className="text-gray-600">{game.description}</p>
      {children}
      <Button onClick={() => onSelect(game)}>Play Now</Button>
    </div>
  );
}

GameCard.Icon = function GameCardIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="w-12 h-12 mb-4" />;
};

GameCard.Stats = function GameCardStats({ players, rating }: { players: number; rating: number }) {
  return (
    <div className="flex justify-between text-sm text-gray-500">
      <span>{players} playing</span>
      <span>★ {rating}</span>
    </div>
  );
};
```

### Render Props Pattern
```tsx
// GameProvider.tsx - Render props for game state management
interface GameProviderProps {
  gameType: GameType;
  children: (props: GameContextValue) => React.ReactNode;
}

export function GameProvider({ gameType, children }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>(getInitialState(gameType));
  const [loading, setLoading] = useState(false);

  const updateGameState = async (action: GameAction) => {
    setLoading(true);
    try {
      const newState = await api.post(`/games/${gameType}/action`, action);
      setGameState(newState.data);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    gameState,
    updateGameState,
    loading,
    gameType
  };

  return children(contextValue);
}
```

This component architecture ensures modularity, reusability, and maintainability while supporting the complex game interactions and real-time telemetry required for 1M+ concurrent users.</content>
<parameter name="filePath">ubuntu-pools-research-breakdown/structural-analysis/components.md