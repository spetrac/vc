export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function assertString(value: unknown, options?: { path?: string }): asserts value is string {
  if (!isString(value))
    throw new TypeError(`${options?.path ?? 'value'} must be a string`)
}

export type AnyURI = string

export function assertAnyURI(value: unknown, options?: { path?: string }): asserts value is AnyURI {
  assertString(value, options)
  if (!new URL(value).protocol)
    throw new Error(`${options?.path ?? 'value'} must have a protocol`)
}

export type DateTime = string

export const DateTimePattern = /^-?[1-9][0-9]*-(?:1[0-2]|0[1-9])-(?:3[01]|[12][0-9]|0[1-9])T(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:[+-](?:1[0-2]|0[0-9]):[0-5][0-9]|Z)?$/

export function isDateTime(value: unknown): value is DateTime {
  return isString(value) && DateTimePattern.test(value)
}

export function assertDateTime(value: unknown, options?: { path?: string }): asserts value is DateTime {
  assertString(value, options)
  if (!DateTimePattern.test(value))
    throw new Error(`${options?.path ?? 'value'} must match DateString pattern`)
}