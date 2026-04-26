// File: tools/cli/src/vv-shadow-diverge.ts
// CLI for investigating shadow divergences and bill/meter comparisons

async function main() {
  const args = process.argv.slice(2);
  const shadowRunId = args.find(a => a.startsWith('--shadow-run='))?.split('=')[1];
  const compare = args.includes('--compare');
  const source1 = args.find(a => a.startsWith('--source1='))?.split('=')[1];
  const source2 = args.find(a => a.startsWith('--source2='))?.split('=')[1];
  const tolerance = parseFloat(args.find(a => a.startsWith('--tolerance='))?.split('=')[1] || '0.02');
  const continuous = args.includes('--continuous');
  const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '3600');
  const alertWebhook = args.find(a => a.startsWith('--alert-webhook='))?.split('=')[1];

  if (compare) {
    // BayWater bill vs meter comparison mode
    if (!source1 || !source2) {
      console.log('Usage: vv-shadow-diverge --compare --source1=<municipal_bill.csv> --source2=<baywater_meter.json> [--tolerance=0.02] [--continuous] [--interval=3600] [--alert-webhook=<url>]');
      console.log('');
      console.log('Compares municipal bills against internal meter data.');
      console.log('Divergence > tolerance triggers investigation.');
      process.exit(1);
    }

    console.log('💧 BayWater Bill vs Meter Comparison');
    console.log(`   Source 1: ${source1}`);
    console.log(`   Source 2: ${source2}`);
    console.log(`   Tolerance: ${(tolerance * 100).toFixed(1)}%`);
    console.log(`   Continuous: ${continuous}`);
    if (continuous) {
      console.log(`   Interval: ${interval}s`);
      if (alertWebhook) console.log(`   Alert webhook: ${alertWebhook}`);
    }
    console.log('');

    if (continuous) {
      await runContinuousComparison(source1, source2, tolerance, interval, alertWebhook);
    } else {
      const divergence = await compareBillVsMeter(source1, source2);
      await handleComparisonResult(divergence, tolerance, alertWebhook);
    }
  } else if (shadowRunId) {
    // Original shadow divergence investigation
    console.log(`🔍 Investigating shadow divergence: ${shadowRunId}`);

    // Fetch shadow result
    const result = await fetchShadowResult(shadowRunId);

    console.log('');
    console.log('📊 Divergence Details');
    console.log(`   Incident: ${result.incidentReportId}`);
    console.log(`   Live outcome: ${result.liveOutcome}`);
    console.log(`   Shadow outcome: ${result.shadowOutcome}`);
    console.log(`   Reason: ${result.divergenceReason || 'No reason recorded'}`);
    console.log(`   Policy version: ${result.policyVersionCompared}`);
    console.log(`   Time: ${new Date(result.ranAt).toISOString()}`);

    // Fetch both evaluation traces
    console.log('');
    console.log('🔁 Replay both paths:');
    console.log(`   vv-replay --trace-id ${result.traceId}`);
    console.log(`   vv-trace-diff ${result.traceId} shadow-${result.traceId}`);
  } else {
    console.log('Usage:');
    console.log('  vv-shadow-diverge --shadow-run=<id>                    # Investigate shadow divergence');
    console.log('  vv-shadow-diverge --compare --source1=<bill.csv> --source2=<meter.json> [--tolerance=0.02] [--continuous] [--alert-webhook=<url>]  # Compare bill vs meter');
    process.exit(1);
  }
}

// ── BayWater Bill vs Meter Comparison ──

async function compareBillVsMeter(source1: string, source2: string): Promise<number> {
  console.log('📊 Loading data sources...');

  // Load municipal bill data (CSV)
  const billData = await loadCSV(source1);

  // Load BayWater meter data (JSON)
  const meterData = await loadJSON(source2);

  console.log(`   Bill records: ${billData.length}`);
  console.log(`   Meter records: ${meterData.length}`);

  // Calculate total billed amount
  const totalBilled = billData.reduce((sum: number, record: any) => sum + parseFloat(record.amount || 0), 0);

  // Calculate total metered amount
  const totalMetered = meterData.reduce((sum: number, record: any) => sum + parseFloat(record.consumption || 0), 0);

  console.log(`   Total billed: R${totalBilled.toFixed(2)}`);
  console.log(`   Total metered: ${totalMetered.toFixed(2)} m³`);

  // Calculate divergence as percentage
  const divergence = Math.abs(totalBilled - totalMetered) / Math.max(totalBilled, totalMetered);

  console.log(`   Divergence: ${(divergence * 100).toFixed(2)}%`);

  return divergence;
}

async function runContinuousComparison(
  source1: string,
  source2: string,
  tolerance: number,
  interval: number,
  alertWebhook?: string
): Promise<void> {
  console.log('🔄 Starting continuous comparison...');

  while (true) {
    try {
      const divergence = await compareBillVsMeter(source1, source2);
      await handleComparisonResult(divergence, tolerance, alertWebhook);

      // Update bill divergence count for dashboard
      const fs = await import('fs/promises');
      await fs.mkdir('shadow-results', { recursive: true });
      await fs.writeFile('shadow-results/bill-divergence-count.txt',
        (divergence > tolerance ? 1 : 0).toString());

      console.log(`   Next check in ${interval} seconds...`);
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      console.error('Error in continuous comparison:', error);
      await new Promise(resolve => setTimeout(resolve, 30000)); // Retry in 30s on error
    }
  }
}

async function handleComparisonResult(
  divergence: number,
  tolerance: number,
  alertWebhook?: string
): Promise<void> {
  if (divergence > tolerance) {
    console.error(`🚨 CRITICAL: Divergence ${(divergence * 100).toFixed(2)}% > ${(tolerance * 100).toFixed(1)}% threshold`);
    console.error('   Potential syndicate tampering detected');

    // Alert webhook
    if (alertWebhook) {
      await sendAlertWebhook(alertWebhook, {
        type: 'bill_divergence',
        divergence: divergence,
        tolerance: tolerance,
        timestamp: Date.now(),
        message: `Bill vs meter divergence exceeds ${tolerance * 100}% threshold`
      });
    }

    // Block escrow distributions
    await blockEscrowDistributions();

    process.exit(1);
  } else {
    console.log(`✅ Within tolerance: ${(divergence * 100).toFixed(2)}% ≤ ${(tolerance * 100).toFixed(1)}%`);
  }
}

async function loadCSV(filePath: string): Promise<any[]> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record: any = {};
    headers.forEach((header, i) => {
      record[header] = values[i]?.trim();
    });
    return record;
  });
}

async function loadJSON(filePath: string): Promise<any[]> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function sendAlertWebhook(webhook: string, payload: any): Promise<void> {
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('📤 Alert sent to webhook');
  } catch (error) {
    console.error('Failed to send alert webhook:', error);
  }
}

async function blockEscrowDistributions(): Promise<void> {
  const fs = await import('fs/promises');
  await fs.mkdir('shadow-results', { recursive: true });
  await fs.writeFile('shadow-results/ESCROW_BLOCKED', JSON.stringify({
    reason: 'Bill divergence detected - potential syndicate tampering',
    timestamp: Date.now(),
    action: 'Block all QCO dividend distributions until investigation complete'
  }));
  console.log('🚫 Escrow distributions blocked');
}

async function fetchShadowResult(shadowRunId: string): Promise<any> {
  // Mock for now - in production would fetch from shadow store
  return {
    incidentReportId: 'mock-incident-001',
    liveOutcome: 'EXECUTED',
    shadowOutcome: 'WOULD_EXECUTE',
    divergenceReason: 'Test divergence',
    policyVersionCompared: 'current',
    ranAt: Date.now(),
    traceId: 'trace-001'
  };
}

main().catch(console.error);