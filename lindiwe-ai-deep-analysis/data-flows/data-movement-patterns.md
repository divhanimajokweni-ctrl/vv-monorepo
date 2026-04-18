# Data Movement Patterns

## Data Sovereignty and Movement

Lindiwe AI implements strict data sovereignty controls that govern how behavioral data moves through the system, ensuring POPIA compliance and member privacy rights.

### Consent-Gated Data Flow

```
Member Action → Consent Verification → Data Processing → Controlled Storage → Member Erasure Rights
```

#### Consent Verification Pipeline
```typescript
async function verifyDataConsent(
  memberId: string,
  dataType: 'telemetry' | 'transactions' | 'credit_signals'
): Promise<ConsentStatus> {
  // Check explicit consent
  const consentRecord = await db.query.memberConsent.findFirst({
    where: eq(memberConsent.memberId, memberId)
  });

  if (!consentRecord) {
    return { granted: false, reason: 'No consent record found' };
  }

  const consentGranted = consentRecord[`${dataType}Enabled`] ?? false;
  const consentVersion = consentRecord.version;
  const consentDate = consentRecord.createdAt;

  // Check consent freshness (must be renewed annually)
  const consentAge = Date.now() - consentDate.getTime();
  const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year

  if (consentAge > maxAge) {
    return { granted: false, reason: 'Consent expired' };
  }

  return {
    granted: consentGranted,
    version: consentVersion,
    expiresAt: new Date(consentDate.getTime() + maxAge)
  };
}
```

#### Conditional Data Processing
```typescript
async function processWithConsent(
  memberId: string,
  data: any,
  processor: (data: any) => Promise<any>
): Promise<ProcessingResult> {
  const consent = await verifyDataConsent(memberId, 'telemetry');

  if (!consent.granted) {
    // Store minimal audit record only
    await auditLog({
      event: 'data_processing_skipped',
      memberId,
      reason: 'consent_not_granted',
      dataType: 'telemetry'
    });

    return { processed: false, reason: 'consent_required' };
  }

  // Process data with consent
  const result = await processor(data);

  // Log processing with consent metadata
  await auditLog({
    event: 'data_processed',
    memberId,
    consentVersion: consent.version,
    processingTimestamp: new Date()
  });

  return { processed: true, result, consentVersion: consent.version };
}
```

### Data Movement Controls

#### Inter-System Data Transfer
```typescript
class DataMovementController {
  // Controlled data movement between systems
  async transferData(
    sourceSystem: string,
    targetSystem: string,
    memberId: string,
    data: any,
    purpose: string
  ): Promise<TransferResult> {
    // Verify transfer is authorized
    const authorization = await this.checkTransferAuthorization(
      sourceSystem, targetSystem, purpose
    );

    if (!authorization.allowed) {
      throw new Error(`Unauthorized data transfer: ${authorization.reason}`);
    }

    // Apply data minimization
    const minimizedData = this.minimizeData(data, purpose);

    // Encrypt in transit
    const encryptedData = await this.encryptForTransit(minimizedData);

    // Transfer with audit trail
    const transferId = await this.executeTransfer(
      sourceSystem, targetSystem, memberId, encryptedData
    );

    // Log transfer
    await this.auditTransfer({
      transferId,
      sourceSystem,
      targetSystem,
      memberId,
      purpose,
      dataSize: JSON.stringify(minimizedData).length,
      encryptionMethod: 'AES-256-GCM'
    });

    return { transferId, success: true };
  }

  // Data minimization for purpose limitation
  private minimizeData(data: any, purpose: string): any {
    const minimizationRules = {
      'credit_assessment': ['behavioral_signals', 'game_performance'],
      'regulatory_compliance': ['consent_status', 'processing_logs'],
      'analytics': ['aggregated_metrics', 'anonymized_patterns']
    };

    const allowedFields = minimizationRules[purpose] || [];
    return this.filterObject(data, allowedFields);
  }
}
```

## Real-Time Data Streaming

### Event-Driven Data Movement

```
Event Generation → Routing → Processing → Storage → Consumption
```

#### Event Streaming Architecture
```typescript
class EventStreamingPipeline {
  // Real-time event routing
  async routeEvent(event: PlatformEvent): Promise<RoutingResult> {
    // Determine event type and routing rules
    const routingRules = await this.getRoutingRules(event.eventType);

    // Apply filtering and transformation
    const filteredEvent = this.applyFilters(event, routingRules.filters);
    const transformedEvent = this.applyTransformations(filteredEvent, routingRules.transforms);

    // Route to appropriate consumers
    const routingPromises = routingRules.consumers.map(consumer =>
      this.deliverToConsumer(consumer, transformedEvent)
    );

    // Wait for all deliveries
    const results = await Promise.allSettled(routingPromises);

    return {
      eventId: event.id,
      routingRules: routingRules.id,
      deliveryResults: results,
      totalConsumers: routingRules.consumers.length,
      successfulDeliveries: results.filter(r => r.status === 'fulfilled').length
    };
  }

  // Consumer delivery with backpressure handling
  private async deliverToConsumer(
    consumer: ConsumerConfig,
    event: PlatformEvent
  ): Promise<DeliveryResult> {
    try {
      // Check consumer capacity
      const capacity = await this.checkConsumerCapacity(consumer);

      if (!capacity.available) {
        // Apply backpressure
        await this.applyBackpressure(consumer, event);
        return { delivered: false, reason: 'backpressure' };
      }

      // Deliver event
      const result = await this.sendToConsumer(consumer, event);

      return {
        delivered: true,
        consumerId: consumer.id,
        deliveryTime: result.deliveryTime,
        confirmationId: result.confirmationId
      };

    } catch (error) {
      return {
        delivered: false,
        consumerId: consumer.id,
        error: error.message
      };
    }
  }
}
```

## Batch Data Movement

### Bulk Processing Patterns

```
Data Collection → Staging → Validation → Transformation → Loading
```

#### ETL Pipeline Implementation
```typescript
class DataETLPipeline {
  // Extract phase
  async extractData(
    source: DataSource,
    filters: ExtractionFilters
  ): Promise<ExtractedData> {
    const rawData = await this.connectAndExtract(source, filters);

    // Apply initial filtering
    const filteredData = this.applyExtractionFilters(rawData, filters);

    // Generate extraction metadata
    const metadata = {
      sourceId: source.id,
      extractionTimestamp: new Date(),
      recordCount: filteredData.length,
      dataSize: this.calculateDataSize(filteredData),
      filters: filters
    };

    return { data: filteredData, metadata };
  }

  // Transform phase
  async transformData(
    extractedData: ExtractedData,
    transformations: TransformationRule[]
  ): Promise<TransformedData> {
    let transformed = extractedData.data;

    // Apply each transformation in sequence
    for (const transformation of transformations) {
      transformed = await this.applyTransformation(
        transformed,
        transformation
      );
    }

    // Validate transformation results
    const validation = await this.validateTransformation(transformed);

    if (!validation.passed) {
      throw new Error(`Transformation validation failed: ${validation.errors}`);
    }

    return {
      data: transformed,
      originalMetadata: extractedData.metadata,
      transformationMetadata: {
        appliedTransformations: transformations.map(t => t.id),
        validationResult: validation,
        transformationTimestamp: new Date()
      }
    };
  }

  // Load phase
  async loadData(
    transformedData: TransformedData,
    target: DataTarget
  ): Promise<LoadResult> {
    // Prepare load operation
    const loadPlan = await this.createLoadPlan(transformedData, target);

    // Execute load with error handling
    const result = await this.executeLoad(transformedData, target, loadPlan);

    // Verify load success
    const verification = await this.verifyLoad(result, transformedData);

    return {
      success: verification.success,
      recordsLoaded: result.recordsLoaded,
      loadDuration: result.duration,
      verificationResult: verification
    };
  }
}
```

## Cross-Region Data Movement

### Global Data Distribution

```
Primary Region → Replication → Secondary Regions → Edge Caching → Local Access
```

#### Multi-Region Replication
```typescript
class GlobalDataReplicator {
  // Cross-region data synchronization
  async replicateData(
    data: any,
    primaryRegion: string,
    targetRegions: string[]
  ): Promise<ReplicationResult> {
    // Prepare data for replication
    const replicationPackage = await this.prepareReplicationPackage(data);

    // Replicate to each target region
    const replicationPromises = targetRegions.map(region =>
      this.replicateToRegion(replicationPackage, primaryRegion, region)
    );

    // Wait for all replications with timeout
    const results = await Promise.allSettled(replicationPromises);

    // Verify consistency across regions
    const consistencyCheck = await this.verifyCrossRegionConsistency(
      replicationPackage, targetRegions
    );

    return {
      replicationId: replicationPackage.id,
      primaryRegion,
      targetRegions,
      replicationResults: results,
      consistencyVerified: consistencyCheck.passed,
      totalLatency: this.calculateTotalLatency(results)
    };
  }

  // Conflict resolution for concurrent updates
  async resolveReplicationConflicts(
    conflicts: ReplicationConflict[]
  ): Promise<ResolutionResult> {
    const resolutions = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      resolutions.push(resolution);
    }

    // Apply resolutions
    await this.applyConflictResolutions(resolutions);

    return {
      resolvedConflicts: resolutions.length,
      resolutionTimestamp: new Date(),
      consistencyRestored: true
    };
  }
}
```

## Data Lifecycle Management

### Retention and Deletion Patterns

```
Data Creation → Active Usage → Archival → Deletion → Verification
```

#### Automated Data Lifecycle
```typescript
class DataLifecycleManager {
  // Manage data retention policies
  async enforceRetentionPolicies(): Promise<LifecycleResult> {
    const policies = await this.getRetentionPolicies();

    const enforcementResults = [];

    for (const policy of policies) {
      const result = await this.enforcePolicy(policy);
      enforcementResults.push(result);
    }

    return {
      policiesEnforced: enforcementResults.length,
      dataArchived: enforcementResults.reduce((sum, r) => sum + r.archived, 0),
      dataDeleted: enforcementResults.reduce((sum, r) => sum + r.deleted, 0),
      enforcementTimestamp: new Date()
    };
  }

  // Member-initiated data erasure
  async processErasureRequest(
    memberId: string,
    erasureScope: ErasureScope
  ): Promise<ErasureResult> {
    // Verify member identity and rights
    const verification = await this.verifyErasureRights(memberId);

    if (!verification.authorized) {
      throw new Error('Unauthorized erasure request');
    }

    // Identify all data locations
    const dataLocations = await this.locateMemberData(memberId, erasureScope);

    // Execute erasure across all locations
    const erasurePromises = dataLocations.map(location =>
      this.eraseFromLocation(location, memberId)
    );

    const results = await Promise.allSettled(erasurePromises);

    // Verify complete erasure
    const verificationResult = await this.verifyCompleteErasure(memberId);

    // Generate erasure certificate
    const certificate = await this.generateErasureCertificate(
      memberId, erasureScope, results, verificationResult
    );

    return {
      memberId,
      erasureScope,
      locationsErased: dataLocations.length,
      successfulErasures: results.filter(r => r.status === 'fulfilled').length,
      erasureCertificate: certificate,
      completedAt: new Date()
    };
  }
}
```

## Performance-Optimized Data Movement

### Caching and Acceleration Patterns

```
Request → Cache Check → Cache Hit/Miss → Data Retrieval → Cache Population → Response
```

#### Intelligent Caching Strategy
```typescript
class IntelligentCacheManager {
  // Multi-level caching with intelligent population
  async getWithCaching(
    key: string,
    fetcher: () => Promise<any>,
    options: CacheOptions = {}
  ): Promise<CachedResult> {
    // Check L1 cache (local)
    const l1Result = await this.checkL1Cache(key);
    if (l1Result.hit) {
      return { data: l1Result.data, source: 'l1_cache', latency: l1Result.latency };
    }

    // Check L2 cache (distributed)
    const l2Result = await this.checkL2Cache(key);
    if (l2Result.hit) {
      // Populate L1 cache
      await this.populateL1Cache(key, l2Result.data);
      return { data: l2Result.data, source: 'l2_cache', latency: l2Result.latency };
    }

    // Cache miss - fetch from source
    const freshData = await fetcher();
    const fetchLatency = Date.now() - startTime;

    // Populate caches asynchronously
    this.populateCaches(key, freshData, options);

    return {
      data: freshData,
      source: 'source',
      latency: fetchLatency,
      cacheStatus: 'miss'
    };
  }

  // Predictive cache warming
  async warmCache(predictiveKeys: string[]): Promise<WarmResult> {
    const warmPromises = predictiveKeys.map(key =>
      this.warmSingleKey(key)
    );

    const results = await Promise.allSettled(warmPromises);

    return {
      keysAttempted: predictiveKeys.length,
      keysWarmed: results.filter(r => r.status === 'fulfilled').length,
      warmTimestamp: new Date()
    };
  }
}
```

These data movement patterns ensure that Lindiwe AI maintains strict data sovereignty while providing high-performance, real-time behavioral intelligence across the Ubuntu Pools platform.