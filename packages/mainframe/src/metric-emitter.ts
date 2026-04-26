import { EventEmitter } from 'events';

interface WaterMetricEmitterConfig {
  sources: string[];
  signature: string;
}

class WaterMetricEmitter extends EventEmitter {
  private config: WaterMetricEmitterConfig;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config: WaterMetricEmitterConfig) {
    super();
    this.config = config;
  }

  start(): void {
    console.log('💧 BayWater Metric Emitter started');
    console.log(`   Sources: ${this.config.sources.join(', ')}`);
    console.log(`   Signature: ${this.config.signature}`);

    // Simulate metric collection from acoustic loggers and smart meters
    this.intervals.push(setInterval(() => this.checkFlowAnomaly(), 60000)); // Every minute
  }

  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    console.log('💧 Metric emitter stopped');
  }

  private async checkFlowAnomaly(): Promise<void> {
    // Simulate anomaly detection
    const hasAnomaly = Math.random() < 0.1; // 10% chance of anomaly

    if (hasAnomaly) {
      const anomalyData = {
        source: 'acoustic_logger_001',
        timestamp: Date.now(),
        flow_drop: Math.random() * 50,
        pressure_spike: Math.random() * 2
      };

      this.emit('flow_anomaly', anomalyData);
      console.log('🚨 Flow anomaly detected:', anomalyData);
    }
  }
}

export { WaterMetricEmitter };