import { BankProvider, BankProviderType } from './types';
import { DodoPaymentsProvider, getDodoPaymentsProvider } from './dodo-payments';
import { getPayFastProvider } from './payfast';

export function getBankProvider(type?: BankProviderType): BankProvider {
  const providerType = type || (process.env.BANK_PROVIDER as BankProviderType) || 'dodo-payments';

  switch (providerType) {
    case 'dodo-payments':
      return getDodoPaymentsProvider();
    case 'payfast':
      return getPayFastProvider();
    case 'plaid':
      throw new Error('Plaid has been deprecated. Please use Dodo Payments.');
    case 'ozow':
      throw new Error('Ozow integration coming soon.');
    case 'manual':
      throw new Error('Manual entry does not support bank connection.');
    default:
      throw new Error(`Unknown bank provider: ${providerType}`);
  }
}

export function getActiveProviderName(): string {
  return process.env.BANK_PROVIDER || 'dodo-payments';
}

export const PROVIDER_FEATURES = {
  'dodo-payments': {
    name: 'Dodo Payments',
    description: 'Comprehensive payment processing and banking integration',
    features: ['Instant EFT', 'Bank Verification', 'Transaction Sync', 'Payment Processing', 'POPIA Compliant'],
    supportedBanks: ['Capitec', 'Standard Bank', 'FNB', 'Nedbank', 'ABSA', 'TymeBank', 'Discovery'],
    fees: 'Competitive (Local ZAR)',
    latency: 'Near-instant',
  },
  payfast: {
    name: 'PayFast',
    description: 'South African payment processing fallback',
    features: ['Instant EFT', 'Payment Processing', 'Recurring Payments'],
    supportedBanks: ['Capitec', 'Standard Bank', 'FNB', 'Nedbank', 'ABSA', 'Investec', 'TymeBank', 'Discovery', 'African Bank'],
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
