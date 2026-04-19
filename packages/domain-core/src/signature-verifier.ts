import crypto from 'crypto';

export interface SignatureVerifier {
  verify(data: string, signature: string, publicKey: string): boolean;
  sign(data: string, privateKey: string): string;
}

export function createSignatureVerifier(): SignatureVerifier {
  return {
    verify(data: string, signature: string, publicKey: string): boolean {
      try {
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(data);
        return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
      } catch {
        return false;
      }
    },
    sign(data: string, privateKey: string): string {
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(data);
      return signer.sign(privateKey, 'base64');
    },
  };
}

export const signatureVerifier = createSignatureVerifier();

export function signData(data: string, privateKey: string): string {
  return signatureVerifier.sign(data, privateKey);
}