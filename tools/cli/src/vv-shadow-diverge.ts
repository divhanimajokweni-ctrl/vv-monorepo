// File: tools/cli/src/vv-shadow-diverge.ts
// CLI for investigating shadow divergences

async function main() {
  const args = process.argv.slice(2);
  const shadowRunId = args.find(a => a.startsWith('--shadow-run='))?.split('=')[1];

  if (!shadowRunId) {
    console.log('Usage: vv-shadow-diverge --shadow-run=<id>');
    console.log('');
    console.log('Fetches and displays detailed divergence information');
    console.log('including live vs shadow evaluation paths.');
    process.exit(1);
  }

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
}

main().catch(console.error);