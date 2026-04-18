import { BankProvider, BankProviderConfig, BankAccount, BankTransaction, BankConnection } from './types';

const DODO_PAYMENTS_API_BASE = {
  sandbox: 'https://api.sandbox.dodo-payments.com',
  development: 'https://api.dodo-payments.com',
  production: 'https://api.dodo-payments.com',
};

const SUPPORTED_BANKS = [
  { id: 'capitec', name: 'Capitec Bank' },
  { id: 'standard_bank', name: 'Standard Bank' },
  { id: 'fnb', name: 'First National Bank' },
  { id: 'nedbank', name: 'Nedbank' },
  { id: 'absa', name: 'ABSA' },
  { id: 'tymeBank', name: 'TymeBank' },
  { id: 'discovery', name: 'Discovery Bank' },
  { id: 'investec', name: 'Investec' },
];

export class DodoPaymentsProvider implements BankProvider {
  readonly name = 'Dodo Payments';
  readonly supportedBanks = SUPPORTED_BANKS.map(b => b.name);
  
  private config: BankProviderConfig;
  private baseUrl: string;

  constructor(config: BankProviderConfig) {
    this.config = config;
    this.baseUrl = DODO_PAYMENTS_API_BASE[config.environment];
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.clientSecret}`,
      'Client-Id': this.config.clientId,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Dodo Payments API error: ${response.status}`);
    }

    return response.json();
  }

  async createLinkToken(userId: string): Promise<string> {
    const response = await this.request<{ link_token: string }>('/v1/link/token/create', {
      method: 'POST',
      body: JSON.stringify({
        user: { client_user_id: userId },
        client_name: 'Ubuntu Pools',
        products: ['transactions', 'auth'],
        country_codes: ['ZA'],
        language: 'en',
        redirect_uri: this.config.redirectUri,
      }),
    });
    
    return response.link_token;
  }

  async exchangeToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    const response = await this.request<{ access_token: string; item_id: string }>('/v1/item/public_token/exchange', {
      method: 'POST',
      body: JSON.stringify({ public_token: publicToken }),
    });
    
    return {
      accessToken: response.access_token,
      itemId: response.item_id,
    };
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    const response = await this.request<{ accounts: any[] }>('/v1/accounts/get', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });

    return response.accounts.map(this.normalizeAccount);
  }

  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{ transactions: BankTransaction[]; accounts: BankAccount[] }> {
    const response = await this.request<{ transactions: any[]; accounts: any[] }>('/v1/transactions/get', {
      method: 'POST',
      body: JSON.stringify({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    return {
      transactions: response.transactions.map(this.normalizeTransaction),
      accounts: response.accounts.map(this.normalizeAccount),
    };
  }

  async refreshConnection(accessToken: string): Promise<void> {
    await this.request('/v1/item/refresh', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  async disconnect(accessToken: string): Promise<void> {
    await this.request('/v1/item/remove', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  private normalizeAccount(account: any): BankAccount {
    const typeMap: Record<string, BankAccount['type']> = {
      'checking': 'checking',
      'depository': 'checking',
      'savings': 'savings',
      'credit': 'credit',
      'loan': 'credit',
      'investment': 'investment',
    };

    return {
      id: account.account_id || account.id,
      name: account.name,
      officialName: account.official_name || account.name,
      type: typeMap[account.type] || 'other',
      subtype: account.subtype || null,
      mask: account.mask || null,
      currentBalance: account.balances?.current ?? null,
      availableBalance: account.balances?.available ?? null,
      currency: account.balances?.iso_currency_code || 'ZAR',
    };
  }

  private normalizeTransaction(transaction: any): BankTransaction {
    return {
      id: transaction.transaction_id || transaction.id,
      accountId: transaction.account_id,
      amount: transaction.amount,
      date: transaction.date,
      name: transaction.name,
      merchantName: transaction.merchant_name || null,
      category: transaction.category || null,
      pending: transaction.pending || false,
      description: transaction.name,
    };
  }
}

let dodoPaymentsProviderInstance: DodoPaymentsProvider | null = null;

export function getDodoPaymentsProvider(): DodoPaymentsProvider {
  if (!dodoPaymentsProviderInstance) {
    const config: BankProviderConfig = {
      clientId: process.env.DODO_PAYMENTS_CLIENT_ID || '',
      clientSecret: process.env.DODO_PAYMENTS_CLIENT_SECRET || '',
      environment: (process.env.DODO_PAYMENTS_ENV || 'sandbox') as 'sandbox' | 'development' | 'production',
      redirectUri: process.env.DODO_PAYMENTS_REDIRECT_URI,
    };

    if (!config.clientId || !config.clientSecret) {
      throw new Error('Dodo Payments credentials not configured. Please set DODO_PAYMENTS_CLIENT_ID and DODO_PAYMENTS_CLIENT_SECRET');
    }

    dodoPaymentsProviderInstance = new DodoPaymentsProvider(config);
  }

  return dodoPaymentsProviderInstance;
}
