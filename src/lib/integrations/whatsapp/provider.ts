export interface WhatsAppConfig {
  apiKey: string;
  baseUrl: string;
  phoneNumberId: string;
  environment: "sandbox" | "production";
  communityGroupId?: string;
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  type?: "text";
}

export interface WhatsAppContact {
  phone: string;
  name?: string;
}

export class WhatsAppProvider {
  private config: WhatsAppConfig;

  // Rate limiting for governance notifications
  private messageQueue: Array<{ message: WhatsAppMessage; priority: 'high' | 'medium' | 'low' }> = [];
  private conversationWindows = new Map<string, { messagesSent: number; windowStart: Date; expiresAt: Date }>();
  private batchInterval: NodeJS.Timeout | null = null;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.startBatchProcessor();
  }

  private startBatchProcessor(): void {
    // Process queued messages every 30 seconds
    this.batchInterval = setInterval(() => {
      this.processMessageQueue();
    }, 30000);
  }

  destroy(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
  }

  static fromEnv(): WhatsAppProvider {
    return new WhatsAppProvider({
      apiKey: process.env.WHATSAPP_API_KEY || "",
      baseUrl: process.env.WHATSAPP_BASE_URL || "https://api.whatsapp.com/v1",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      environment: (process.env.WHATSAPP_ENV as "sandbox" | "production") || "sandbox",
      communityGroupId: process.env.WHATSAPP_COMMUNITY_GROUP_ID,
    });
  }

  async sendMessage(message: WhatsAppMessage, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<boolean> {
    // Check if this is a governance notification that needs rate limiting
    if (this.isTransactionalMessage(message.body)) {
      return this.queueTransactionalMessage(message, priority);
    }

    // Regular messages go through immediately
    return this.sendMessageImmediately(message);
  }

  private async sendMessageImmediately(message: WhatsAppMessage): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: message.to,
        type: message.type || "text",
        text: {
          body: message.body
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`WhatsApp API error: ${response.status} - ${error.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.messages && result.messages.length > 0;
    } catch (error) {
      console.error("WhatsApp send message error:", error);
      return false;
    }
  }

  private isTransactionalMessage(body: string): boolean {
    // Governance notifications are transactional and need rate limiting
    const transactionalKeywords = [
      'proposal', 'vote', 'governance', 'pool shortfall', 'new proposal',
      'voting reminder', 'constitution', 'emergency'
    ];
    return transactionalKeywords.some(keyword => body.toLowerCase().includes(keyword));
  }

  private queueTransactionalMessage(message: WhatsAppMessage, priority: 'high' | 'medium' | 'low'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ message, priority });

      // High priority messages get processed immediately if window allows
      if (priority === 'high' && this.canSendToRecipient(message.to)) {
        this.processMessageQueue();
      }

      // For now, resolve immediately - actual sending happens asynchronously
      resolve(true);
    });
  }

  private canSendToRecipient(phoneNumber: string): boolean {
    const window = this.conversationWindows.get(phoneNumber);
    if (!window) return true;

    const now = new Date();
    if (now > window.expiresAt) {
      // Window expired, reset
      this.conversationWindows.delete(phoneNumber);
      return true;
    }

    // WhatsApp allows unlimited messages within 24-hour window once initiated
    // But we limit to 10 messages per window to be safe
    return window.messagesSent < 10;
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    // Sort by priority (high first)
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process messages that can be sent
    const remainingQueue: typeof this.messageQueue = [];

    for (const item of this.messageQueue) {
      if (this.canSendToRecipient(item.message.to)) {
        // Send immediately (don't await to avoid blocking queue processing)
        this.sendMessageImmediately(item.message).then(success => {
          if (success) {
            this.updateConversationWindow(item.message.to);
          }
        }).catch(error => {
          console.error('Failed to send queued WhatsApp message:', error);
        });
      } else {
        remainingQueue.push(item);
      }
    }

    this.messageQueue = remainingQueue;
  }

  private updateConversationWindow(phoneNumber: string): void {
    const now = new Date();
    const window = this.conversationWindows.get(phoneNumber);

    if (!window || now > window.expiresAt) {
      // Start new 24-hour window
      this.conversationWindows.set(phoneNumber, {
        messagesSent: 1,
        windowStart: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      });
    } else {
      window.messagesSent++;
    }
  }

  /**
   * Send batched governance notifications with fallback to email
   */
  async sendGovernanceNotification(
    recipients: string[],
    message: string,
    options: {
      batchSize?: number;
      priority?: 'high' | 'medium' | 'low';
      fallbackToEmail?: boolean;
    } = {}
  ): Promise<{ sent: number; failed: number; queued: number }> {
    const { batchSize = 10, priority = 'medium', fallbackToEmail = true } = options;
    let sent = 0, failed = 0, queued = 0;

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      for (const phoneNumber of batch) {
        try {
          const success = await this.sendMessage({
            to: phoneNumber,
            body: message
          }, priority);

          if (success) {
            sent++;
          } else {
            queued++;
          }
        } catch (error) {
          console.error(`Failed to send WhatsApp to ${phoneNumber}:`, error);
          failed++;

          if (fallbackToEmail) {
            // TODO: Implement email fallback
            console.log(`Would fallback to email for ${phoneNumber}`);
          }
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed, queued };
  }

  async addToGroup(phoneNumber: string, groupId?: string): Promise<boolean> {
    // Note: WhatsApp Business API doesn't support adding users to groups programmatically
    // This would need to be done through the WhatsApp Business Management API or manually
    // For now, we'll just log the intent and return true
    console.log(`[WhatsApp] Would add ${phoneNumber} to group ${groupId || this.config.communityGroupId}`);

    // In a production implementation, you would:
    // 1. Use WhatsApp Business Management API
    // 2. Or send an invite link via message
    // 3. Or use a third-party service like 360Dialog

    return true; // Return true to indicate "intent logged"
  }

  async sendWelcomeMessage(phoneNumber: string): Promise<void> {
    const welcomeMessage = this.getWelcomeMessage();

    // Send welcome message
    await this.sendMessage({
      to: phoneNumber,
      body: welcomeMessage,
      type: "text"
    });

    // Add to community group if configured
    if (this.config.communityGroupId) {
      await this.addToGroup(phoneNumber);
    }
  }

  private getWelcomeMessage(): string {
    return `🌟 Welcome to Ubuntu Pools! 🌟

Hey there! I'm Divh, the founder of Ubuntu Pools - your gateway to collaborative prosperity in South Africa.

🎯 *What are Ubuntu Pools?*
We're building a revolutionary savings platform where communities pool resources to achieve financial goals faster. Think stokvels meets modern finance - secure, transparent, and community-driven.

💡 *Why join Ubuntu Pools?*
• Earn competitive returns on your savings
• Access to larger investment opportunities through pooling
• Full transparency with blockchain-level security
• Support local South African businesses and communities
• Simple, user-friendly mobile experience

🚀 *Your journey starts now:*
1. Complete your profile verification
2. Join or create your first pool
3. Start saving smarter together

💬 *Questions?* Just reply here or visit ubuntu-pools.co.za

Welcome to the future of community finance! 🇿🇦✨

Best,
Divh
Founder, Ubuntu Pools`;
  }
}

let whatsAppInstance: WhatsAppProvider | null = null;

export function createWhatsAppProvider(config?: Partial<WhatsAppConfig>): WhatsAppProvider {
  const finalConfig: WhatsAppConfig = {
    apiKey: config?.apiKey || process.env.WHATSAPP_API_KEY || "",
    baseUrl: config?.baseUrl || process.env.WHATSAPP_BASE_URL || "https://api.whatsapp.com/v1",
    phoneNumberId: config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    environment: config?.environment || "sandbox",
    communityGroupId: config?.communityGroupId || process.env.WHATSAPP_COMMUNITY_GROUP_ID,
  };
  return new WhatsAppProvider(finalConfig);
}

export function initializeWhatsApp(config?: Partial<WhatsAppConfig>): WhatsAppProvider {
  whatsAppInstance = createWhatsAppProvider(config);
  return whatsAppInstance;
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!whatsAppInstance) {
    whatsAppInstance = WhatsAppProvider.fromEnv();
  }
  return whatsAppInstance;
}

export const whatsAppProvider = getWhatsAppProvider();