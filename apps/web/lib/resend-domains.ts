import { Resend } from 'resend';

let resend: Resend | undefined;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function addDomain(name: string) {
  return await getResend().domains.create({ name });
}

export async function retrieveDomain(id: string) {
  return await getResend().domains.get(id);
}

export async function verifyDomain(id: string) {
  return await getResend().domains.verify(id);
}

export async function updateDomain(id: string, options: { openTracking?: boolean; clickTracking?: boolean }) {
  return await getResend().domains.update({ id, ...options });
}

export async function listDomains() {
  return await getResend().domains.list();
}

export async function deleteDomain(id: string) {
  return await getResend().domains.remove(id);
}

export async function getDomainDNSRecords(id: string) {
  const domain = await getResend().domains.get(id);
  return domain;
}