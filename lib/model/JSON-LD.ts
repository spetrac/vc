import { assertString } from './XSD.js'
import { assertArray } from './Util.js'

export type Type = string | string[]

export function assertType(type: unknown, options?: { path?: string, allowMultiple?: boolean, nonEmpty?: boolean }): asserts type is Type {
  const _path = options?.path ?? 'type'
  if (options?.allowMultiple && Array.isArray(type)) {
    assertArray(type, { path: _path, nonEmpty: options?.nonEmpty })
    for (let i = 0, l = type.length; i < l; i++) {
      assertType(type[i], { path: `${_path}[${i}]` })
    }
  } else {
    assertString(type, { path: _path })
  }
}