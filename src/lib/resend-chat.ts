import { createResendAdapter } from '@resend/chat-sdk-adapter';
import { MemoryStateAdapter } from '@chat-adapter/state-memory';
import { Chat } from 'chat';

const resend = createResendAdapter({
  fromAddress: process.env.RESEND_FROM_ADDRESS || 'bot@yourdomain.com',
  fromName: process.env.RESEND_FROM_NAME || 'My Bot',
  apiKey: process.env.RESEND_API_KEY,
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
});

const chat = new Chat({
  userName: 'email-bot',
  adapters: { resend },
  state: new MemoryStateAdapter(),
});

// New email thread handler
chat.onNewMention(async (thread, message) => {
  await thread.subscribe();
  
  // Log incoming email
  console.log(`New email from ${message.author.userId}: ${message.text}`);
  
  // Auto reply
  await thread.post(`Got your email: ${message.text}`);
});

// Follow-up replies handler
chat.onSubscribedMessage(async (thread, message) => {
  console.log(`Follow-up email in thread ${thread.id}: ${message.text}`);
  await thread.post(`Reply: ${message.text}`);
});

export { chat, resend };
