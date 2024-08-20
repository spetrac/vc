import { assertType, Type } from './JSON-LD.js'
import { assertArray, assertRecord } from './Util.js'
import { AnyURI, assertAnyURI } from './XSD.js'

export type CredentialStatus<allowMultiple = false> =
  allowMultiple extends true ? CredentialStatus | Array<CredentialStatus> : {
    type: Type,
    id?: AnyURI
  }

export function assertCredentialStatus<allowMultiple extends boolean>(status: unknown, options?: { path?: string, allowMultiple?: allowMultiple, nonEmpty?: boolean }): asserts status is CredentialStatus<allowMultiple> {
  const _path = options?.path ?? 'status'
  if (options?.allowMultiple && Array.isArray(status)) {
    assertArray(status, { path: _path, nonEmpty: options?.nonEmpty })
    for (let i = 0, l = status.length; i < l; i++) {
      assertCredentialStatus(status[i], { path: `${_path}[${i}]` })
    }
  } else {
    assertRecord(status, { path: _path })
    assertType(status.type, { path: `${_path}.type`, allowMultiple: true, nonEmpty: true })
    if ('id' in status) assertAnyURI(status.id, { path: `${_path}.id` })
  }
}