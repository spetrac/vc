export function isObject(value: unknown): value is { [key: PropertyKey]: any } {
  return value !== null && typeof value === 'object'
}

export function assertObject(value: unknown, options?: { path?: string }): asserts value is { [key: PropertyKey]: any } {
  const _path = options?.path ?? 'value'
  if (!isObject(value))
    throw new TypeError(`${_path} must be an object`)
}

export function isRecord(value: unknown): value is Record<any, any> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

export function assertRecord(value: unknown, options?: { path?: string, nonEmpty?: boolean }): asserts value is Record<any, any> {
  const _path = options?.path ?? 'value'
  if (value === null || typeof value !== 'object')
    throw new Error(`${_path} must be an object`)
  if (Array.isArray(value))
    throw new Error(`${_path} must not be an array`)
  if (options?.nonEmpty && Object.keys(value).length === 0)
    throw new Error(`${_path} must not be empty`)
}

export function assertArray(value: unknown, options?: { path?: string, nonEmpty?: boolean }): asserts value is Array<any> {
  const _path = options?.path ?? 'value'
  if (!Array.isArray(value))
    throw new Error(`${_path} must be an array`)
  if (options?.nonEmpty && value.length === 0)
    throw new Error(`${_path} must not be empty`)
}

export function isNull(value: unknown): value is (null | undefined) {
  return value === undefined || value === null
}

export function toArray(value: any): typeof value extends Array<any> ? typeof value : typeof value extends (undefined | null) ? [] : [typeof value] {
  if (Array.isArray(value)) return value
  if (isNull(value)) return []
  return [value]
}