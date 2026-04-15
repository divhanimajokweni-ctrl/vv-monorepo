export interface Game {
  id: string;
  name: string;
  icon: string;
  description: string;
  timebox: number;
}

export interface GameSignal {
  score: number;
  decisionTime: number;
  risk: 'low' | 'medium' | 'extreme';
  metadata?: {
    isAltruistic?: boolean;
    gameId?: string;
  };
}

export interface LindiweResult {
  impulse: number;
  altruism: number;
}