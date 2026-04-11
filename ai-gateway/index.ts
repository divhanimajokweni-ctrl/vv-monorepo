import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import 'dotenv/config';

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  // For AI Gateway, set baseURL if needed
  // baseURL: 'https://gateway.ai.cloudflare.com/v1', // Uncomment if using Cloudflare AI Gateway
});

async function main() {
  const result = await streamText({
    model: openai('gpt-4o'), // Changed to gpt-4o as gpt-5.4 may not exist
    messages: [{ role: 'user', content: 'Tell me a joke about programming.' }],
  });

  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }

  console.log('\nToken usage:', result.usage);
}

main().catch(console.error);