import { assertString } from './XSD.js'
import { assertArray, assertRecord } from './Util.js'

export type Type<allowMultiple = false> = allowMultiple extends true ? Type | Array<Type> : string

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

export type TypedObject<allowMultiple = false> = allowMultiple extends true ? TypedObject | Array<TypedObject> : { type: Type }

export function assertTypedObject<allowMultiple extends boolean>(object: unknown, options?: { path?: string, allowMultiple?: allowMultiple, nonEmpty?: boolean }): asserts object is TypedObject<allowMultiple> {
  const _path = options?.path ?? 'object'
  if (options?.allowMultiple && Array.isArray(object)) {
    assertArray(object, { path: _path, nonEmpty: options?.nonEmpty })
    for (let i = 0, l = object.length; i < l; i++) {
      assertTypedObject(object[i], { path: `${_path}[${i}]` })
    }
  } else {
    assertRecord(object, { path: _path, nonEmpty: true })
    assertType(object.type, { path: _path, allowMultiple: true, nonEmpty: true })
  }
}