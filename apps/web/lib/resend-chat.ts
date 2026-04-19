import { createResendAdapter } from '@resend/chat-sdk-adapter';

const adapter = createResendAdapter({
  fromAddress: process.env.RESEND_FROM_ADDRESS || 'bot@workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app',
  fromName: process.env.RESEND_FROM_NAME || 'Ubuntu Pools Bot',
  apiKey: process.env.RESEND_API_KEY,
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
});

export const chat = {
  ...adapter,
  webhooks: {
    resend: (req: Request) => ({ status: 200 }),
  },
};