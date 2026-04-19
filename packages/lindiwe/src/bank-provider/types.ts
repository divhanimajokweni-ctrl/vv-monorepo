export interface BankProviderConfig {
  clientId: string;
  clientSecret: string;
  environment: string;
}

export interface BankTransaction {
  id: string;
  amount: number;
  date: string;
  description?: string;
  name?: string;
  merchantName?: string;
  category?: string;
}

export interface BankProvider {
  name: string;
  getTransactions(): Promise<BankTransaction[]>;
  getTransactions(startDate: string, endDate: string): Promise<{ transactions: BankTransaction[]; accounts: unknown[] }>;
}