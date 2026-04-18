export type DomainEvent<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
  occurredAt: string;
};