import { BankProvider, BankProviderType } from './types';
import { StitchProvider, getStitchProvider } from './stitch';

export function getBankProvider(type?: BankProviderType): BankProvider {
  const providerType = type || (process.env.BANK_PROVIDER as BankProviderType) || 'stitch';
  
  switch (providerType) {
    case 'stitch':
      return getStitchProvider();
    case 'plaid':
      throw new Error('Plaid has been deprecated. Please use Stitch or Ozow.');
    case 'ozow':
      throw new Error('Ozow integration coming soon.');
    case 'manual':
      throw new Error('Manual entry does not support bank connection.');
    default:
      throw new Error(`Unknown bank provider: ${providerType}`);
  }
}

export function getActiveProviderName(): string {
  return process.env.BANK_PROVIDER || 'stitch';
}

export const PROVIDER_FEATURES = {
  stitch: {
    name: 'Stitch',
    description: 'Open banking for South Africa',
    features: ['Instant EFT', 'Bank Verification', 'Transaction Sync', 'POPIA Compliant'],
    supportedBanks: ['Capitec', 'Standard Bank', 'FNB', 'Nedbank', 'ABSA', 'TymeBank', 'Discovery'],
    fees: 'Low (Local ZAR)',
    latency: 'Near-instant',
  },
  ozow: {
    name: 'Ozow',
    description: 'Instant EFT payments',
    features: ['Instant EFT', 'Recurring Payments', 'Bank Verification'],
    supportedBanks: ['All Major SA Banks'],
    fees: 'Low (Local ZAR)',
    latency: 'Near-instant',
  },
} as const;
