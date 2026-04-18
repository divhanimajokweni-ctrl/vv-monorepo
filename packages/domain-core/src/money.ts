import type { CurrencyCode } from "./types";

export type Money = {
  amountMinor: number;
  currency: CurrencyCode;
};

export function assertMoney(value: Money): Money {
  if (!Number.isInteger(value.amountMinor)) {
    throw new Error("money_amount_must_be_minor_integer");
  }
  return value;
}