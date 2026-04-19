import type { BankProviderConfig, BankTransaction, BankProvider } from './types';

export function getDodoPaymentsProvider(config?: BankProviderConfig): BankProvider {
  return {
    name: 'dodo-payments',
    async getTransactions(): Promise<BankTransaction[]> {
      return [];
    },
    async getTransactions(startDate: string, endDate: string): Promise<{ transactions: BankTransaction[]; accounts: unknown[] }> {
      return { transactions: [], accounts: [] };
    }
  };
}