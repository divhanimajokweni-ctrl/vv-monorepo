'use client';

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { InterestTag, interestTags } from './InterestPicker';

export interface OnboardingState {
  step: number;
  displayName: string;
  selectedInterests: string[];
  affinityScores: Record<string, number>;
  trustCircleSize: number;
  villagePulse: number;
  memberCoreScore: number;
  poolHealthScore: number;
  totalScore: number;
}

type OnboardingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'SET_INTERESTS'; payload: { ids: string[]; scores: Record<string, number> } }
  | { type: 'SET_TRUST_CIRCLE'; payload: number }
  | { type: 'CALCULATE_SCORE' };

const initialState: OnboardingState = {
  step: 0,
  displayName: '',
  selectedInterests: [],
  affinityScores: {},
  trustCircleSize: 0,
  villagePulse: 0,
  memberCoreScore: 0,
  poolHealthScore: 0,
  totalScore: 0,
};

function calculateVillagePulse(ids: string[], trustCircleSize: number): number {
  const baseWeight = 5;
  const interestBonus = ids.length * baseWeight;
  const trustOverlapBonus = Math.min(ids.length, Math.floor(trustCircleSize / 4)) * 3;
  return interestBonus + trustOverlapBonus;
}

function calculateTotalScore(state: OnboardingState): number {
  const memberWeight = 0.5;
  const pulseWeight = 0.3;
  const poolWeight = 0.2;
  
  return Math.round(
    state.memberCoreScore * memberWeight +
    state.villagePulse * pulseWeight +
    state.poolHealthScore * poolWeight
  );
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'SET_DISPLAY_NAME':
      const nameLength = action.payload.length;
      const nameBonus = Math.min(nameLength * 2, 20);
      return { 
        ...state, 
        displayName: action.payload,
        memberCoreScore: 50 + nameBonus,
      };
    
    case 'SET_INTERESTS': {
      const { ids, scores } = action.payload;
      const villagePulse = calculateVillagePulse(ids, state.trustCircleSize);
      const newState = {
        ...state,
        selectedInterests: ids,
        affinityScores: scores,
        villagePulse,
      };
      return {
        ...newState,
        totalScore: calculateTotalScore(newState),
      };
    }
    
    case 'SET_TRUST_CIRCLE': {
      const trustCircleSize = action.payload;
      const villagePulse = calculateVillagePulse(state.selectedInterests, trustCircleSize);
      const newState = {
        ...state,
        trustCircleSize,
        villagePulse,
      };
      return {
        ...newState,
        totalScore: calculateTotalScore(newState),
      };
    }
    
    case 'CALCULATE_SCORE': {
      const newState = {
        ...state,
        totalScore: calculateTotalScore(state),
      };
      return newState;
    }
    
    default:
      return state;
  }
}

interface OnboardingContextValue {
  state: OnboardingState;
  setStep: (step: number) => void;
  setDisplayName: (name: string) => void;
  setInterests: (ids: string[], scores: Record<string, number>) => void;
  setTrustCircle: (size: number) => void;
  calculateScore: () => void;
  getSelectedInterestDetails: () => InterestTag[];
  getTrustCircleOverlap: () => { interest: string; count: number }[];
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setDisplayName = useCallback((name: string) => {
    dispatch({ type: 'SET_DISPLAY_NAME', payload: name });
  }, []);

  const setInterests = useCallback((ids: string[], scores: Record<string, number>) => {
    dispatch({ type: 'SET_INTERESTS', payload: { ids, scores } });
  }, []);

  const setTrustCircle = useCallback((size: number) => {
    dispatch({ type: 'SET_TRUST_CIRCLE', payload: size });
  }, []);

  const calculateScore = useCallback(() => {
    dispatch({ type: 'CALCULATE_SCORE' });
  }, []);

  const getSelectedInterestDetails = useCallback((): InterestTag[] => {
    return state.selectedInterests
      .map(id => interestTags.find(t => t.id === id))
      .filter((t): t is InterestTag => t !== undefined);
  }, [state.selectedInterests]);

  const getTrustCircleOverlap = useCallback((): { interest: string; count: number }[] => {
    const mockTrustCircleInterests = ['agri', 'solar', 'edu'];
    const overlap: Record<string, number> = {};
    
    state.selectedInterests.forEach(id => {
      if (mockTrustCircleInterests.includes(id)) {
        overlap[id] = Math.floor(Math.random() * 5) + 1;
      }
    });
    
    return Object.entries(overlap).map(([id, count]) => ({
      interest: interestTags.find(t => t.id === id)?.label || id,
      count,
    }));
  }, [state.selectedInterests]);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setStep,
        setDisplayName,
        setInterests,
        setTrustCircle,
        calculateScore,
        getSelectedInterestDetails,
        getTrustCircleOverlap,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function useUbuntuScore() {
  const { state, setInterests, setTrustCircle } = useOnboarding();

  const updateVillagePulse = useCallback((selectedIds: string[]) => {
    const scores: Record<string, number> = {};
    const basePoints = 5;
    selectedIds.forEach((id, index) => {
      scores[id] = basePoints + (selectedIds.length - index) * 2;
    });
    setInterests(selectedIds, scores);
  }, [setInterests]);

  return {
    totalScore: state.totalScore,
    villagePulse: state.villagePulse,
    memberCoreScore: state.memberCoreScore,
    poolHealthScore: state.poolHealthScore,
    updateVillagePulse,
    setTrustCircle,
  };
}
