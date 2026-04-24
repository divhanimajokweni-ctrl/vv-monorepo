// File: packages/safekrypte/src/simulator.ts
import { createServer } from 'http';
import { parse } from 'url';
import { keystore } from './keystore';
import { signWithKey, verifySignature } from './signing';

const PORT = process.env.SAFEKRYPT_PORT || 3001;

async function handleRequest(req: any, res: any) {
  const { pathname, query } = parse(req.url!, true);

  if (req.method === 'POST' && pathname === '/sign') {
    let body = '';
    req.on('data', (chunk: Buffer) => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { payload, keyId } = JSON.parse(body);
        const signature = await signWithKey(payload, keyId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ signature }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'POST' && pathname === '/verify') {
    let body = '';
    req.on('data', (chunk: Buffer) => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { payload, signature, signerPubKey } = JSON.parse(body);
        const valid = await verifySignature(payload, signature, signerPubKey);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'GET' && pathname === '/keys') {
    try {
      const keys = keystore.listKeys().map(k => ({
        label: k.label,
        publicKey: k.publicKey,
        created: k.created,
        expires: k.expires
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ keys }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

async function startServer() {
  await keystore.load();

  const server = createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🔐 SafeKrypte simulator running on http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  POST /sign - Sign payload with specified key`);
    console.log(`  POST /verify - Verify signature`);
    console.log(`  GET /keys - List available keys`);
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

export { startServer };</content>
<parameter name="filePath">packages/safekrypte/src/simulator.ts