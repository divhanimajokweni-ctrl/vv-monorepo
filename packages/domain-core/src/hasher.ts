import crypto from 'crypto';

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function verifyHashChain(events: { hash: string; previousHash: string }[]): boolean {
  for (const event of events) {
    if (event.hash !== hashData(event.previousHash)) {
      return false;
    }
  }
  return true;
}

export function verifyEventHash(payload: unknown, hash: string): boolean {
  const payloadStr = JSON.stringify(payload);
  return hashData(payloadStr) === hash;
}

export function createHasher(secret?: string) {
  return {
    hash(data: string): string {
      return secret
        ? crypto.createHmac('sha256', secret).update(data).digest('hex')
        : hashData(data);
    },
    verify(data: string, expected: string): boolean {
      return this.hash(data) === expected;
    },
  };
}