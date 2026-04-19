export type DomainEvent<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
  occurredAt: string;
};

export function hashEvent(payload: unknown): string {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}