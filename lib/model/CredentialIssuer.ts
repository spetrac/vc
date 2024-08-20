import { isRecord } from './Util.js'
import { AnyURI, assertAnyURI } from './XSD.js'

export type CredentialIssuer<allowRecord = false, allowArray = false> =
  allowArray extends true ? CredentialIssuer<allowRecord> | Array<CredentialIssuer<allowRecord>> :
  allowRecord extends true ? CredentialIssuer | { id: CredentialIssuer } : AnyURI

export function assertCredentialIssuer<allowRecord extends boolean, allowArray extends boolean>(issuer: unknown, options?: { path?: string, allowRecord?: allowRecord, allowArray?: allowArray }): asserts issuer is CredentialIssuer<allowRecord, allowArray> {
  const _path = options?.path ?? 'issuer'
  if (options?.allowArray && Array.isArray(issuer)) {
    if (issuer.length > 1)
      throw new Error(`${_path} must not contain multiple items`)
    assertCredentialIssuer(issuer[0], { path: `${_path}[0]`, allowRecord: options?.allowRecord })
  } else if (options?.allowRecord && isRecord(issuer)) {
    assertCredentialIssuer(issuer.id, { path: `${_path}.id` })
  } else {
    assertAnyURI(issuer, { path: _path })
  }
}