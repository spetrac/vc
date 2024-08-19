export type DateString = string

export const DateStringPattern = /^-?[1-9][0-9]*-(?:1[0-2]|0[1-9])-(?:3[01]|[12][0-9]|0[1-9])T(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:[+-](?:1[0-2]|0[0-9]):[0-5][0-9]|Z)?$/

export function isDateString(value: unknown): value is DateString {
  return typeof value === 'string' && DateStringPattern.test(value)
}

export function assertDateString(value: unknown, options?: { name?: string }): asserts value is DateString {
  if (typeof value !== 'string')
    throw new Error(`${options?.name ?? 'value'} must be a string`)
  if (!DateStringPattern.test(value))
    throw new Error(`${options?.name ?? 'value'} must match DateString pattern`)
}