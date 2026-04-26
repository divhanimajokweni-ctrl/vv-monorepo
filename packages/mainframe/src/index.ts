// Main entry point for Mainframe Triad Collector
import { TriadCollector } from './triad-collector.js';

const poolId = process.env.POOL_ID || 'baywater-pool-001';
const policyHash = process.env.POLICY_HASH || '0x1234567890abcdef';

const collector = new TriadCollector(poolId, policyHash);
collector.start();

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down Triad Collector...');
  collector.stop();
  process.exit(0);
});