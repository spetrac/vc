import { assertType, type Type } from './JSON-LD.js'
import { assertArray, assertRecord } from './Util.js'
import { type AnyURI, assertAnyURI } from './XSD.js'

export type CredentialEvidence<allowMultiple = false> =
  allowMultiple extends true ? CredentialEvidence | Array<CredentialEvidence> : {
    type: Type,
    id?: AnyURI,
    [other: string]: any
  }

export function assertCredentialEvidence<allowMultiple extends boolean>(evidence: unknown, options?: { path?: string, allowMultiple?: allowMultiple }): asserts evidence is CredentialEvidence<allowMultiple> {
  const _path = options?.path ?? 'evidence'
  if (options?.allowMultiple && Array.isArray(evidence)) {
    assertArray(evidence, { path: _path, nonEmpty: true })
    for (let i = 0, l = evidence.length; i < l; i++) {
      assertCredentialEvidence(evidence[i], { path: `${_path}[${i}]` })
    }
  } else {
    assertRecord(evidence, { path: _path, nonEmpty: true })
    assertType(evidence.type, { path: `${_path}.type`, allowMultiple: true, nonEmpty: true })
    if ('id' in evidence)
      assertAnyURI(evidence.id, { path: `${_path}.id` })
  }
}