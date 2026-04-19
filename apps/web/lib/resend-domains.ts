export interface ResendDomain {
  id: string;
  name: string;
  status: string;
}

export async function getResendDomains(): Promise<ResendDomain[]> {
  return [];
}

export async function addResendDomain(domain: string): Promise<ResendDomain> {
  return { id: 'new', name: domain, status: 'pending' };
}

export async function retrieveDomain(domain: string): Promise<ResendDomain | null> {
  return null;
}

export async function getDomainDNSRecords(domain: string): Promise<Record<string, string>[]> {
  return [];
}