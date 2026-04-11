export interface DodoPaymentsConfig {
  baseUrl: string;
  apiKey: string;
  environment: "sandbox" | "production";
}

export interface BankTransaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  category: string;
  merchantName?: string;
}

export interface AccountBalance {
  accountId: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
}

export class DodoPaymentsProvider {
  private config: DodoPaymentsConfig;
  private accessToken: string | null = null;

  constructor(config: DodoPaymentsConfig) {
    this.config = config;
  }

  static fromEnv(): DodoPaymentsProvider {
    return new DodoPaymentsProvider({
      baseUrl: process.env.DODO_PAYMENTS_BASE_URL || "https://api.dodo-payments.com",
      apiKey: process.env.DODO_PAYMENTS_API_KEY || "",
      environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    });
  }

  async authenticate(accessToken: string): Promise<boolean> {
    this.accessToken = accessToken;
    return true;
  }

  async getTransactions(
    _accessToken: string,
    _startDate: string,
    _endDate: string
  ): Promise<{ transactions: BankTransaction[] }> {
    return {
      transactions: [],
    };
  }

  async getAccounts(_accessToken: string): Promise<{ accounts: AccountBalance[] }> {
    return {
      accounts: [],
    };
  }

  async getBalance(_accessToken: string): Promise<{ balance: number }> {
    return {
      balance: 0,
    };
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

let dodoPaymentsInstance: DodoPaymentsProvider | null = null;

export function createDodoPaymentsProvider(config?: Partial<DodoPaymentsConfig>): DodoPaymentsProvider {
  const finalConfig: DodoPaymentsConfig = {
    baseUrl: config?.baseUrl || process.env.DODO_PAYMENTS_BASE_URL || "https://api.dodo-payments.com",
    apiKey: config?.apiKey || process.env.DODO_PAYMENTS_API_KEY || "",
    environment: config?.environment || "sandbox",
  };
  return new DodoPaymentsProvider(finalConfig);
}

export function initializeDodoPayments(config?: Partial<DodoPaymentsConfig>): DodoPaymentsProvider {
  dodoPaymentsInstance = createDodoPaymentsProvider(config);
  return dodoPaymentsInstance;
}

export function getDodoPaymentsProvider(): DodoPaymentsProvider {
  if (!dodoPaymentsInstance) {
    dodoPaymentsInstance = DodoPaymentsProvider.fromEnv();
  }
  return dodoPaymentsInstance;
}

export const dodoPaymentsProvider = getDodoPaymentsProvider();
