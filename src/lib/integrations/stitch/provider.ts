export interface StitchConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
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

export class StitchProvider {
  private config: StitchConfig;
  private accessToken: string | null = null;

  constructor(config: StitchConfig) {
    this.config = config;
  }

  static fromEnv(): StitchProvider {
    return new StitchProvider({
      baseUrl: process.env.STITCH_BASE_URL || "https://api.stitchfinance.com",
      clientId: process.env.STITCH_CLIENT_ID || "",
      clientSecret: process.env.STITCH_CLIENT_SECRET || "",
      environment: (process.env.STITCH_ENVIRONMENT as "sandbox" | "production") || "sandbox",
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

let stitchInstance: StitchProvider | null = null;

export function createStitchProvider(config?: Partial<StitchConfig>): StitchProvider {
  const finalConfig: StitchConfig = {
    baseUrl: config?.baseUrl || process.env.STITCH_BASE_URL || "https://api.stitchfinance.com",
    clientId: config?.clientId || process.env.STITCH_CLIENT_ID || "",
    clientSecret: config?.clientSecret || process.env.STITCH_CLIENT_SECRET || "",
    environment: config?.environment || "sandbox",
  };
  return new StitchProvider(finalConfig);
}

export function initializeStitch(config?: Partial<StitchConfig>): StitchProvider {
  stitchInstance = createStitchProvider(config);
  return stitchInstance;
}

export function getStitchProvider(): StitchProvider {
  if (!stitchInstance) {
    stitchInstance = StitchProvider.fromEnv();
  }
  return stitchInstance;
}

export const stitchProvider = getStitchProvider();
