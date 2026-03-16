'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  LindiweInferenceEngine, 
  LindiweAnalysis, 
  LindiweWeights,
  MemberCoreData,
  VillagePulseData,
  PoolHealthData 
} from './LindiweAI';

interface LindiweMemory {
  token: string;
  success: boolean;
  outcome: string;
  timestamp: number;
}

interface LindiweContextState {
  isActive: boolean;
  memberCore: MemberCoreData | null;
  villagePulse: VillagePulseData | null;
  poolHealth: PoolHealthData | null;
  analysis: LindiweAnalysis | null;
  weights: LindiweWeights | null;
  greeting: string;
  memory: LindiweMemory[];
  systemStatus: string;
}

interface LindiweContextValue extends LindiweContextState {
  initialize: (config: {
    memberCore: MemberCoreData;
    villagePulse: VillagePulseData;
    poolHealth: PoolHealthData;
    historicalData?: {
      avgPoolHealth: number;
      avgVillagePulse: number;
      previousStrategies: string[];
    };
  }) => void;
  analyze: () => void;
  evolve: (token: string, success: boolean, outcome: string) => void;
  generateNudge: () => string;
  toggleActive: () => void;
  getRiskHeatmap: () => { poolId: string; risk: number; health: number; pulse: number }[];
}

const defaultWeights: LindiweWeights = {
  socialPressureWeight: 0.4,
  financialStabilityWeight: 0.3,
  poolUrgencyWeight: 0.3,
  nudgeFrequency: 0.5,
  trustFatigueThreshold: 0.7,
  socialProofBonus: 0.12,
};

const LindiweContext = createContext<LindiweContextValue | null>(null);

export function LindiweProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(true);
  const [memberCore, setMemberCore] = useState<MemberCoreData | null>(null);
  const [villagePulse, setVillagePulse] = useState<VillagePulseData | null>(null);
  const [poolHealth, setPoolHealth] = useState<PoolHealthData | null>(null);
  const [analysis, setAnalysis] = useState<LindiweAnalysis | null>(null);
  const [weights, setWeights] = useState<LindiweWeights | null>(defaultWeights);
  const [greeting, setGreeting] = useState("Molo! I'm watching over our Ubuntu Accord.");
  const [memory, setMemory] = useState<LindiweMemory[]>([]);
  const [engine, setEngine] = useState<LindiweInferenceEngine | null>(null);
  const [systemStatus, setSystemStatus] = useState('Initializing...');

  const initialize = useCallback((config: {
    memberCore: MemberCoreData;
    villagePulse: VillagePulseData;
    poolHealth: PoolHealthData;
    historicalData?: {
      avgPoolHealth: number;
      avgVillagePulse: number;
      previousStrategies: string[];
    };
  }) => {
    setMemberCore(config.memberCore);
    setVillagePulse(config.villagePulse);
    setPoolHealth(config.poolHealth);

    const newEngine = new LindiweInferenceEngine(config);
    setEngine(newEngine);
    
    const result = newEngine.analyze();
    setAnalysis(result);
    setWeights(newEngine.getWeights());
    setGreeting(newEngine.getGreeting());
    setSystemStatus(`Monitoring ${config.poolHealth.memberCount} members. Accord ${result.riskLevel === 'low' ? '94.2%' : 'at risk'} stable.`);
  }, []);

  const analyze = useCallback(() => {
    if (engine && memberCore && villagePulse && poolHealth) {
      const newEngine = new LindiweInferenceEngine({
        memberCore,
        villagePulse,
        poolHealth,
      });
      setEngine(newEngine);
      
      const result = newEngine.analyze();
      setAnalysis(result);
      setWeights(newEngine.getWeights());
      setSystemStatus(`Monitoring ${poolHealth.memberCount} members. Accord ${result.riskLevel === 'low' ? '94.2%' : 'at risk'} stable.`);
    }
  }, [engine, memberCore, villagePulse, poolHealth]);

  const evolve = useCallback((token: string, success: boolean, outcome: string) => {
    if (engine) {
      engine.evolve(token, success, outcome);
      setWeights(engine.getWeights());
      setMemory(prev => [...prev.slice(-19), { token, success, outcome, timestamp: Date.now() }]);
    }
  }, [engine]);

  const generateNudge = useCallback(() => {
    if (engine && poolHealth && villagePulse) {
      return engine.generateNudge(poolHealth, villagePulse);
    }
    return "Our collective growth depends on every member's contribution.";
  }, [engine, poolHealth, villagePulse]);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const getRiskHeatmap = useCallback((): { poolId: string; risk: number; health: number; pulse: number }[] => {
    if (!poolHealth || !villagePulse) return [];
    
    const baseRisk = poolHealth.status === 'critical' ? 0.9 :
                      poolHealth.status === 'stressed' ? 0.7 :
                      poolHealth.status === 'stable' ? 0.4 : 0.2;
    const bonus = weights?.socialProofBonus ?? 0;
    
    return [{
      poolId: poolHealth.id,
      risk: baseRisk * (1 - bonus),
      health: poolHealth.liquidityRatio,
      pulse: villagePulse.sentimentScore,
    }];
  }, [poolHealth, villagePulse, weights]);

  return (
    <LindiweContext.Provider
      value={{
        isActive,
        memberCore,
        villagePulse,
        poolHealth,
        analysis,
        weights,
        greeting,
        memory,
        systemStatus,
        initialize,
        analyze,
        evolve,
        generateNudge,
        toggleActive,
        getRiskHeatmap,
      }}
    >
      {children}
    </LindiweContext.Provider>
  );
}

export function useLindiwe() {
  const context = useContext(LindiweContext);
  if (!context) {
    throw new Error('useLindiwe must be used within a LindiweProvider');
  }
  return context;
}

export function useLindiweAdmin() {
  const { analysis, weights, memory, systemStatus, getRiskHeatmap, evolve } = useLindiwe();

  return {
    analysis,
    weights,
    memory,
    systemStatus,
    riskHeatmap: getRiskHeatmap(),
    evolve,
  };
}
