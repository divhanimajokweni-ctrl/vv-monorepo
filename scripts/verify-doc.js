// Simple verification script using Node.js directly
const fs = require('fs');

async function verifyDocument(inputFile, keyLabel) {
  // Load keystore
  const keystoreData = fs.readFileSync('./keystore.json', 'utf-8');
  const keystore = JSON.parse(keystoreData);

  // Find the key
  const key = keystore.find(k => k.label === keyLabel);
  if (!key) {
    throw new Error(`Key ${keyLabel} not found`);
  }

  // Load the document
  const document = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  if (!document.signature || document.signature.startsWith('PLACEHOLDER')) {
    throw new Error('Signature missing or still a placeholder');
  }

  // Import ed25519 dynamically
  const ed = await import('@noble/ed25519');

  // Create the payload to verify (document without signature field)
  const { signature, ...payloadToVerify } = document;
  payloadToVerify.signature = '';
  const payloadStr = JSON.stringify(payloadToVerify);

  // Verify signature
  const signatureBytes = Buffer.from(document.signature, 'hex');
  const isValid = await ed.verify(signatureBytes, payloadStr, key.publicKey);

  if (isValid) {
    console.log(`✅ Signature valid for ${inputFile} with ${keyLabel}`);
  } else {
    throw new Error(`❌ Signature invalid for ${inputFile} with ${keyLabel}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log('Usage: node verify-doc.js <input-file> <key-label>');
    process.exit(1);
  }

  const [inputFile, keyLabel] = args;
  await verifyDocument(inputFile, keyLabel);
}

main().catch(console.error);</content>
<parameter name="filePath">scripts/verify-doc.js