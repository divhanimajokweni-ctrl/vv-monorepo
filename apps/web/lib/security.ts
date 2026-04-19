import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Encrypted Secrets Management (Production-ready AES-256-GCM encryption)
class SecretsManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  // Derive key from environment variable using scrypt
  private static getKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return scryptSync(secret, 'salt', this.KEY_LENGTH);
  }

  static encrypt(text: string): string {
    const key = this.getKey();
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const key = this.getKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0]!, 'hex');
    const authTag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts[2]!;

    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted as string;
  }
}

// Intrusion Detection System
class IntrusionDetector {
  private static suspiciousPatterns = [
    /union.*select.*--/i,
    /<script.*>.*<\/script>/i,
    /\b(eval|exec|system)\b/i,
    /\.\.\//i,
    /\b(admin|root|system)\b.*\b(password|pwd|pass)\b/i,
  ];

  static detectIntrusion(request: any): boolean {
    const body = JSON.stringify(request.body || {});
    const headers = JSON.stringify(request.headers || {});
    const query = JSON.stringify(request.query || {});
    const combined = body + headers + query;

    return this.suspiciousPatterns.some(pattern => pattern.test(combined));
  }

  static logSuspiciousActivity(request: any, ip: string) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ip,
      userAgent: request.headers?.['user-agent'],
      url: request.url,
      method: request.method,
      suspicious: true,
      details: request.body
    };
    console.error('SECURITY ALERT:', JSON.stringify(logEntry, null, 2));
    // In production, send to monitoring service
  }
}

// Automated Breach Response
export class BreachResponse {
  private static blockedIPs = new Set<string>();
  private static breachThreshold = 5; // Failed attempts before block
  private static failedAttempts = new Map<string, number>();

  static recordFailedAttempt(ip: string) {
    const attempts = (this.failedAttempts.get(ip) || 0) + 1;
    this.failedAttempts.set(ip, attempts);

    if (attempts >= this.breachThreshold) {
      this.blockIP(ip);
      this.alertAdministrators(ip, attempts);
    }
  }

  static blockIP(ip: string) {
    this.blockedIPs.add(ip);
    console.error(`SECURITY: IP ${ip} blocked due to repeated failed attempts`);
    // In production, add to firewall rules
  }

  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  static alertAdministrators(ip: string, attempts: number) {
    const alert = {
      type: 'BREACH_ATTEMPT',
      ip,
      attempts,
      timestamp: new Date().toISOString(),
      message: `Automated block: ${ip} exceeded ${this.breachThreshold} failed authentication attempts`
    };

    console.error('URGENT SECURITY ALERT:', JSON.stringify(alert, null, 2));
    // In production: send email, SMS, Slack notification
  }

  static resetFailedAttempts(ip: string) {
    this.failedAttempts.delete(ip);
  }
}

export { SecretsManager, IntrusionDetector, SecretsManager as secretsManager, IntrusionDetector as intrusionDetector };