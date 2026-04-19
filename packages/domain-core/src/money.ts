import type { CurrencyCode } from "./types";

export type Money = {
  minorUnits: bigint;
  currency: CurrencyCode;
};

export function assertMoney(value: Money): Money {
  if (typeof value.minorUnits !== "bigint" && typeof value.minorUnits !== "number") {
    throw new Error("money_minor_units_must_be_bigint");
  }
  return value;
}