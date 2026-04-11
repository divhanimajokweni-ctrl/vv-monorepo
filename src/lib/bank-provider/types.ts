import { z } from 'zod';

export interface BankAccount {
  id: string;
  name: string;
  officialName: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currency: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[] | null;
  pending: boolean;
  description: string;
}

export interface BankConnection {
  connectionId: string;
  institutionId: string;
  institutionName: string;
  accessToken: string;
  status: 'active' | 'inactive' | 'error';
  accounts: BankAccount[];
  lastSynced: Date;
}

export const BankConnectionSchema = z.object({
  connectionId: z.string(),
  institutionId: z.string(),
  institutionName: z.string(),
  accessToken: z.string(),
  status: z.enum(['active', 'inactive', 'error']),
  accounts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    officialName: z.string(),
    type: z.enum(['checking', 'savings', 'credit', 'investment', 'other']),
    subtype: z.string().nullable(),
    mask: z.string().nullable(),
    currentBalance: z.number().nullable(),
    availableBalance: z.number().nullable(),
    currency: z.string(),
  })),
  lastSynced: z.date(),
});

export interface BankProvider {
  readonly name: string;
  readonly supportedBanks: string[];
  
  createLinkToken(userId: string): Promise<string>;
  
  exchangeToken(publicToken: string): Promise<{
    accessToken: string;
    itemId: string;
  }>;
  
  getAccounts(accessToken: string): Promise<BankAccount[]>;
  
  getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{
    transactions: BankTransaction[];
    accounts: BankAccount[];
  }>;
  
  refreshConnection(accessToken: string): Promise<void>;
  
  disconnect(accessToken: string): Promise<void>;
}

export interface BankProviderConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'development' | 'production';
  redirectUri?: string;
}

export type BankProviderType = 'plaid' | 'dodo-payments' | 'ozow' | 'manual';

export const BankDataSourceSchema = z.enum(['instagram', 'tiktok', 'dodo-payments', 'ozow', 'manual']);

export function getProviderName(type: BankProviderType): string {
  const names: Record<BankProviderType, string> = {
    plaid: 'Plaid',
    'dodo-payments': 'Dodo Payments',
    ozow: 'Ozow',
    manual: 'Manual Entry',
  };
  return names[type];
}
