// Simple signing script using Node.js directly
const fs = require('fs');

async function signDocument(inputFile, outputFile, keyLabel) {
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

  // Create the payload to sign (document without signature field)
  const payloadToSign = { ...document, signature: '' };
  const payloadStr = JSON.stringify(payloadToSign);

  // Import ed25519 dynamically
  const ed = await import('@noble/ed25519');

  // Sign it
  const signature = await ed.sign(payloadStr, key.privateKey);
  const signatureHex = Buffer.from(signature).toString('hex');

  // Add signature to document
  document.signature = signatureHex;

  // Write signed document
  fs.writeFileSync(outputFile, JSON.stringify(document, null, 2));
  console.log(`✅ Signed ${inputFile} with ${keyLabel}, saved to ${outputFile}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.log('Usage: node sign-doc.js <input-file> <output-file> <key-label>');
    process.exit(1);
  }

  const [inputFile, outputFile, keyLabel] = args;
  await signDocument(inputFile, outputFile, keyLabel);
}

main().catch(console.error);</content>
<parameter name="filePath">scripts/sign-doc.js