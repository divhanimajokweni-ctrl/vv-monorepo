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

  constructor(config: WhatsAppConfig) {
    this.config = config;
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

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/messages`;
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
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.messages && result.messages.length > 0;
    } catch (error) {
      console.error("WhatsApp send message error:", error);
      return false;
    }
  }

  async addToGroup(phoneNumber: string, groupId?: string): Promise<boolean> {
    try {
      const targetGroupId = groupId || this.config.communityGroupId;
      if (!targetGroupId) {
        throw new Error("No community group ID configured");
      }

      const url = `${this.config.baseUrl}/groups/${targetGroupId}/participants`;
      const payload = {
        phone_numbers: [phoneNumber]
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
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
      }

      return true;
    } catch (error) {
      console.error("WhatsApp add to group error:", error);
      return false;
    }
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