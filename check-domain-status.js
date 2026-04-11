import { retrieveDomain } from './src/lib/resend-domains.js';

async function main() {
  try {
    const result = await retrieveDomain('9d9c42d3-6f33-4243-8d92-a3d175ac2a7f');
    console.log('Domain status:', result.data.status);
  } catch (error) {
    console.error('Error retrieving domain:', error);
  }
}

main();