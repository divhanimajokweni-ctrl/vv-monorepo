import { BloomFilter } from 'bloom-filters';
import murmurhash from 'murmurhash';
import LRUCache from 'lru-cache';
import { ValidationError } from '@vv/shared-kernel';

export interface DataFingerprint {
  hash: string;
  size: number;
  type: string;
  timestamp: Date;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number;
  existingFingerprint?: DataFingerprint;
  newFingerprint: DataFingerprint;
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | ((data: any) => boolean);
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'spam' | 'anomaly' | 'fraud';
}

export interface ThreatDetectionResult {
  detected: boolean;
  threats: ThreatMatch[];
  riskScore: number;
  recommendedActions: string[];
}

export interface ThreatMatch {
  pattern: ThreatPattern;
  confidence: number;
  matches: string[];
  context: any;
}

export class SafeGridEngine {
  private bloomFilter: BloomFilter;
  private lruCache: LRUCache<string, DataFingerprint>;
  private threatPatterns: Map<string, ThreatPattern> = new Map();

  constructor(
    options: {
      bloomFilterSize?: number;
      cacheMaxSize?: number;
      cacheTTL?: number;
    } = {}
  ) {
    const {
      bloomFilterSize = 1000000,
      cacheMaxSize = 10000,
      cacheTTL = 24 * 60 * 60 * 1000, // 24 hours
    } = options;

    // Initialize Bloom filter for fast duplicate checking
    this.bloomFilter = new BloomFilter(bloomFilterSize, 3);

    // Initialize LRU cache for recent fingerprints
    this.lruCache = new LRUCache({
      max: cacheMaxSize,
      ttl: cacheTTL,
      updateAgeOnGet: true,
    });

    this.initializeThreatPatterns();
  }

  /**
   * Generate fingerprint for data deduplication
   */
  generateFingerprint(
    data: Buffer | string,
    metadata: {
      type?: string;
      source?: string;
    } = {}
  ): DataFingerprint {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = murmurhash.v3(dataBuffer.toString()).toString(16);

    return {
      hash,
      size: dataBuffer.length,
      type: metadata.type || 'unknown',
      timestamp: new Date(),
    };
  }

  /**
   * Check for duplicates using Bloom filter and cache
   */
  checkDuplicate(
    data: Buffer | string,
    metadata: {
      type?: string;
      source?: string;
    } = {}
  ): DeduplicationResult {
    const fingerprint = this.generateFingerprint(data, metadata);

    // Fast check with Bloom filter
    const bloomCheck = this.bloomFilter.has(fingerprint.hash);

    // Detailed check with LRU cache
    const cachedFingerprint = this.lruCache.get(fingerprint.hash);

    const isDuplicate = bloomCheck && cachedFingerprint !== undefined;
    const confidence = this.calculateConfidence(bloomCheck, cachedFingerprint);

    if (!isDuplicate) {
      // Add to Bloom filter and cache
      this.bloomFilter.add(fingerprint.hash);
      this.lruCache.set(fingerprint.hash, fingerprint);
    }

    return {
      isDuplicate,
      confidence,
      existingFingerprint: cachedFingerprint,
      newFingerprint: fingerprint,
    };
  }

  /**
   * Calculate confidence score for duplicate detection
   */
  private calculateConfidence(bloomHit: boolean, cachedFingerprint?: DataFingerprint): number {
    if (!bloomHit) return 0;

    if (cachedFingerprint) {
      // Exact match in cache
      return 1.0;
    }

    // Bloom filter hit but not in cache (possible false positive)
    return 0.8;
  }

  /**
   * Batch deduplication for multiple data items
   */
  batchDeduplication(
    dataItems: Array<{
      data: Buffer | string;
      metadata?: { type?: string; source?: string };
    }>
  ): DeduplicationResult[] {
    return dataItems.map((item) => this.checkDuplicate(item.data, item.metadata));
  }

  /**
   * Initialize default threat patterns
   */
  private initializeThreatPatterns(): void {
    const patterns: ThreatPattern[] = [
      {
        id: 'malware_signature_1',
        name: 'Common Malware Signature',
        description: 'Detects common malware file signatures',
        pattern:
          /MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00\x00\x00\x00\x00\x00\x00\x40\x00\x00\x00\x00\x00\x00\x00/,
        severity: 'high',
        category: 'malware',
      },
      {
        id: 'phishing_keywords',
        name: 'Phishing Keywords',
        description: 'Detects common phishing keywords',
        pattern: /\b(?:password|login|account|verify|confirm|urgent|click here|free|winner)\b/gi,
        severity: 'medium',
        category: 'phishing',
      },
      {
        id: 'suspicious_url',
        name: 'Suspicious URL Pattern',
        description: 'Detects suspicious URL patterns',
        pattern: /(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co)\/[a-zA-Z0-9]+/gi,
        severity: 'medium',
        category: 'phishing',
      },
      {
        id: 'large_attachment_anomaly',
        name: 'Large Attachment Anomaly',
        description: 'Detects unusually large attachments',
        pattern: (data: any) => {
          if (typeof data === 'object' && data.size) {
            return data.size > 50 * 1024 * 1024; // 50MB
          }
          return false;
        },
        severity: 'low',
        category: 'anomaly',
      },
      {
        id: 'high_frequency_pattern',
        name: 'High Frequency Pattern',
        description: 'Detects high-frequency similar requests',
        pattern: (data: any) => {
          // This would be implemented with rate limiting logic
          return false; // Placeholder
        },
        severity: 'medium',
        category: 'anomaly',
      },
    ];

    patterns.forEach((pattern) => {
      this.threatPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Add custom threat pattern
   */
  addThreatPattern(pattern: ThreatPattern): void {
    if (this.threatPatterns.has(pattern.id)) {
      throw new ValidationError(`Threat pattern with ID ${pattern.id} already exists`);
    }
    this.threatPatterns.set(pattern.id, pattern);
  }

  /**
   * Remove threat pattern
   */
  removeThreatPattern(patternId: string): void {
    this.threatPatterns.delete(patternId);
  }

  /**
   * Scan data for threats
   */
  scanForThreats(data: any, context: Record<string, any> = {}): ThreatDetectionResult {
    const threats: ThreatMatch[] = [];
    let totalRiskScore = 0;

    for (const pattern of this.threatPatterns.values()) {
      const match = this.checkPattern(pattern, data, context);
      if (match) {
        threats.push(match);
        totalRiskScore += this.getSeverityScore(pattern.severity) * match.confidence;
      }
    }

    const detected = threats.length > 0;
    const riskScore = Math.min(totalRiskScore, 100); // Cap at 100

    return {
      detected,
      threats,
      riskScore,
      recommendedActions: this.generateRecommendedActions(threats, riskScore),
    };
  }

  /**
   * Check if data matches a threat pattern
   */
  private checkPattern(
    pattern: ThreatPattern,
    data: any,
    context: Record<string, any>
  ): ThreatMatch | null {
    let matches: string[] = [];
    let confidence = 0;

    if (typeof pattern.pattern === 'function') {
      // Custom function pattern
      const result = pattern.pattern({ ...data, ...context });
      if (result) {
        matches = ['custom_function_match'];
        confidence = 0.9;
      }
    } else {
      // RegExp pattern
      const dataString = this.dataToString(data);
      const regexMatches = dataString.match(pattern.pattern);

      if (regexMatches) {
        matches = regexMatches;
        confidence = Math.min(regexMatches.length * 0.1, 0.95); // Confidence based on match count
      }
    }

    if (matches.length > 0) {
      return {
        pattern,
        confidence,
        matches,
        context,
      };
    }

    return null;
  }

  /**
   * Convert data to string for pattern matching
   */
  private dataToString(data: any): string {
    if (typeof data === 'string') return data;
    if (Buffer.isBuffer(data)) return data.toString();
    if (typeof data === 'object') return JSON.stringify(data);
    return String(data);
  }

  /**
   * Get numeric score for severity level
   */
  private getSeverityScore(severity: string): number {
    const scores = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100,
    };
    return scores[severity as keyof typeof scores] || 0;
  }

  /**
   * Generate recommended actions based on detected threats
   */
  private generateRecommendedActions(threats: ThreatMatch[], riskScore: number): string[] {
    const actions: string[] = [];

    if (threats.length === 0) {
      return ['Allow request'];
    }

    // Group threats by category
    const categories = new Set(threats.map((t) => t.pattern.category));

    if (categories.has('malware')) {
      actions.push('Block request - malware detected');
      actions.push('Log security incident');
    }

    if (categories.has('phishing')) {
      actions.push('Quarantine content');
      actions.push('Notify user about potential phishing');
    }

    if (categories.has('spam')) {
      actions.push('Mark as spam');
      actions.push('Apply rate limiting');
    }

    if (riskScore > 80) {
      actions.push('URGENT: Escalate to security team');
      actions.push('Consider account suspension');
    } else if (riskScore > 50) {
      actions.push('Require additional verification');
    } else {
      actions.push('Flag for manual review');
    }

    return actions;
  }

  /**
   * Get SafeGrid statistics
   */
  getStatistics(): {
    bloomFilterSize: number;
    cacheSize: number;
    threatPatternsCount: number;
  } {
    return {
      bloomFilterSize: this.bloomFilter._filter.length,
      cacheSize: this.lruCache.size,
      threatPatternsCount: this.threatPatterns.size,
    };
  }

  /**
   * Clear caches (for maintenance)
   */
  clearCaches(): void {
    this.lruCache.clear();
    // Note: Bloom filter cannot be cleared in this implementation
  }
}

// Factory function
export function createSafeGridEngine(options?: {
  bloomFilterSize?: number;
  cacheMaxSize?: number;
  cacheTTL?: number;
}): SafeGridEngine {
  return new SafeGridEngine(options);
}
