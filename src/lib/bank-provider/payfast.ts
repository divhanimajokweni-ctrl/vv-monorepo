/**
 * PayFast Payment Provider — Fallback for Dodo Payments
 * South African payment processing with instant EFT support
 */
import type { BankProvider, BankProviderType, BankAccount, BankTransaction } from './types';

class PayFastProvider implements BankProvider {
  readonly name = 'PayFast';
  readonly supportedBanks = [
    'Capitec', 'Standard Bank', 'FNB', 'Nedbank', 'ABSA',
    'Investec', 'TymeBank', 'Discovery', 'African Bank'
  ];

  private config = {
    merchantId: process.env.PAYFAST_MERCHANT_ID!,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
    passphrase: process.env.PAYFAST_PASSPHRASE!,
    environment: (process.env.NODE_ENV === 'production') ? 'production' : 'sandbox'
  };

  async createLinkToken(userId: string): Promise<string> {
    // PayFast uses payment links rather than persistent connections
    // Generate a unique payment reference
    const reference = `ubuntu-${userId}-${Date.now()}`;
    return reference;
  }

  async exchangeToken(publicToken: string): Promise<{
    accessToken: string;
    itemId: string;
  }> {
    // PayFast doesn't use OAuth tokens like Plaid
    // Return mock tokens for API compatibility
    return {
      accessToken: `payfast-${publicToken}`,
      itemId: publicToken
    };
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    // PayFast focuses on payments, not account management
    // Return mock account for payment processing
    return [{
      id: 'payfast-payment-account',
      name: 'Ubuntu Pools Payment Account',
      officialName: 'Ubuntu Pools via PayFast',
      type: 'checking',
      subtype: null,
      mask: null,
      currentBalance: null, // PayFast doesn't provide balance info
      availableBalance: null,
      currency: 'ZAR'
    }];
  }

  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{
    transactions: BankTransaction[];
    accounts: BankAccount[];
  }> {
    // PayFast transaction history is limited
    // This would integrate with PayFast's transaction API
    const accounts = await this.getAccounts(accessToken);

    // Mock transactions - in real implementation, call PayFast API
    const transactions: BankTransaction[] = [];

    return { transactions, accounts };
  }

  async refreshConnection(accessToken: string): Promise<void> {
    // PayFast connections don't need refreshing like OAuth tokens
    return;
  }

  async disconnect(accessToken: string): Promise<void> {
    // No persistent connection to disconnect
    return;
  }
}

let payfastProvider: PayFastProvider | null = null;

export function getPayFastProvider(): BankProvider {
  if (!payfastProvider) {
    payfastProvider = new PayFastProvider();
  }
  return payfastProvider;
}