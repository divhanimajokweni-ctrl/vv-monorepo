import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function addDomain(name: string) {
  return await resend.domains.create({ name });
}

export async function retrieveDomain(id: string) {
  return await resend.domains.get(id);
}

export async function verifyDomain(id: string) {
  return await resend.domains.verify(id);
}

export async function updateDomain(id: string, options: { openTracking?: boolean; clickTracking?: boolean }) {
  return await resend.domains.update({ id, ...options });
}

export async function listDomains() {
  return await resend.domains.list();
}

export async function deleteDomain(id: string) {
  return await resend.domains.remove(id);
}

export async function getDomainDNSRecords(id: string) {
  // Get domain details which includes DNS records
  const domain = await resend.domains.get(id);
  return domain;
}