import { assertRecord, assertArray, toArray, isRecord } from './Util.js'
import { type AnyURI, assertAnyURI } from './XSD.js'
import { type CredentialContext, assertCredentialContext } from './CredentialContext.js'
import { assertType, Type } from './JSON-LD.js'
import { assertCredentialSubject, type CredentialSubject } from './CredentialSubject.js'
import { assertCredentialIssuer, type CredentialIssuer } from './CredentialIssuer.js'
import { assertCredentialStatus, CredentialStatus } from './CredentialStatus.js'

export * from './CredentialContext.js'
export * from './CredentialIssuer.js'
export * from './CredentialSubject.js'
export * from './CredentialStatus.js'

export type CredentialType = 'VerifiableCredential' | ['VerifiableCredential', ...string[]]

export function assertCredentialType(type: unknown, options?: { path?: string }): asserts type is CredentialType {
  const _path = options?.path ?? 'type'
  assertType(type, { path: _path, allowMultiple: true, nonEmpty: true })
  if (!toArray(type).includes('VerifiableCredential'))
    throw new Error(`${_path} must include VerifiableCredential`)
}

export type Credential<version = 'any'> = version extends 'base' ? {
  '@context': CredentialContext,
  id?: AnyURI,
  type: CredentialType,
  issuer: CredentialIssuer,
  credentialSubject: CredentialSubject,
  credentialStatus?: CredentialStatus
  // TODO evidence
  // TODO mustHaveType
} : version extends 1.0 ? Credential<'base'> & {
  // TODO v1 specifics
} : version extends 2.0 ? Credential<'base'> & {
  // TODO v2 specifics
} : Credential<1.0> | Credential<2.0>

export function assertCredential(credential: unknown, options?: { path?: string }): asserts credential is Credential {
  const _path = options?.path ?? 'credential'
  assertRecord(credential, { path: _path })
  assertCredentialContext(credential['@context'], { path: `${_path}.@context` })
  if ('id' in credential) assertAnyURI(credential.id, { path: `${_path}.id` })
  assertCredentialType(credential.type, { path: `${_path}.type` })
  assertCredentialIssuer(credential.issuer, { path: `${_path}.issuer`, allowRecord: true, allowArray: true })
  assertCredentialSubject(credential.credentialSubject, { path: `${_path}.credentialSubject`, allowMultiple: true })
  if ('credentialStatus' in credential) assertCredentialStatus(credential.credentialStatus, { path: `${_path}.credentialStatus`, allowMultiple: true })
  // TODO v1 specifics
  // TODO v2 specifics
  // TODO evidence
  // TODO mustHaveType
}

