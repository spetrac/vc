import { assertArray, assertRecord } from './Util.js'
import { AnyURI, assertAnyURI } from './XSD.js'

export type CredentialSubject<allowMultiple = false> =
  allowMultiple extends true ? CredentialSubject | Array<CredentialSubject> : {
    id?: AnyURI,
    [other: string]: any
  }

export function assertCredentialSubject<allowMultiple extends boolean>(subject: unknown, options?: { path?: string, allowMultiple?: allowMultiple }): asserts subject is CredentialSubject<allowMultiple> {
  const _path = options?.path ?? 'subject'
  if (options?.allowMultiple && Array.isArray(subject)) {
    assertArray(subject, { path: _path, nonEmpty: true })
    for (let i = 0, l = subject.length; i < l; i++) {
      assertCredentialSubject(subject[i], { path: `${_path}[${i}]` })
    }
  } else {
    assertRecord(subject, { path: _path, nonEmpty: true })
    if ('id' in subject)
      assertAnyURI(subject.id, { path: `${_path}.id` })
  }
}