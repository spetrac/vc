import { assertRecord, assertArray, toArray, isRecord } from './Util.js'
import { type AnyURI, assertAnyURI, type DateTime, assertDateTime } from './XSD.js'
import { type CredentialContext, type CredentialContextVersion, assertCredentialContext, extractCredentialContextVersion } from './CredentialContext.js'
import { assertType, assertTypedObject, type TypedObject } from './JSON-LD.js'
import { assertCredentialSubject, type CredentialSubject } from './CredentialSubject.js'
import { assertCredentialIssuer, type CredentialIssuer } from './CredentialIssuer.js'
import { assertCredentialStatus, type CredentialStatus } from './CredentialStatus.js'
import { assertCredentialEvidence, type CredentialEvidence } from './CredentialEvidence.js'

export * from './CredentialContext.js'
export * from './CredentialIssuer.js'
export * from './CredentialSubject.js'
export * from './CredentialStatus.js'
export * from './CredentialEvidence.js'

export type CredentialType = 'VerifiableCredential' | ['VerifiableCredential', ...string[]]

export function assertCredentialType(type: unknown, options?: { path?: string }): asserts type is CredentialType {
  const _path = options?.path ?? 'type'
  assertType(type, { path: _path, allowMultiple: true, nonEmpty: true })
  if (!toArray(type).includes('VerifiableCredential'))
    throw new Error(`${_path} must include VerifiableCredential`)
}

export type Credential<version = 'any'> = version extends 'base' ? {
  '@context': CredentialContext,
  type: CredentialType,
  id?: AnyURI,
  issuer: CredentialIssuer,
  credentialSubject: CredentialSubject,
  credentialStatus?: CredentialStatus,
  evidence?: CredentialEvidence,
  termsOfUse?: TypedObject,
  proof?: TypedObject
} : version extends 1.0 ? Credential<'base'> & {
  issuanceDate: DateTime,
  expirationDate?: DateTime
} : version extends 2.0 ? Credential<'base'> & {
  validFrom?: DateTime,
  validUntil?: DateTime
} : Credential<1.0> | Credential<2.0>

export function assertCredential(credential: unknown, options?: { path?: string, mode?: 'issue' | 'verify', now?: Date | DateTime }): asserts credential is Credential {
  const _path = options?.path ?? 'credential'
  const _mode = options?.mode ?? 'verify'
  const _now = new Date(options?.now ?? Date.now())
  assertRecord(credential, { path: _path })
  assertCredentialContext(credential['@context'], { path: `${_path}.@context` })
  assertCredentialType(credential.type, { path: `${_path}.type` })
  if ('id' in credential) assertAnyURI(credential.id, { path: `${_path}.id` })
  assertCredentialIssuer(credential.issuer, { path: `${_path}.issuer`, allowRecord: true, allowArray: true })
  assertCredentialSubject(credential.credentialSubject, { path: `${_path}.credentialSubject`, allowMultiple: true })
  if ('credentialStatus' in credential) assertCredentialStatus(credential.credentialStatus, { path: `${_path}.credentialStatus`, allowMultiple: true })
  switch (extractCredentialContextVersion(credential['@context'])) {
    case 1:
      assertCredentialValidDate(credential.issuanceDate, { path: `${_path}.issuanceDate`, max: _mode === 'verify' ? _now : undefined })
      if ('expirationDate' in credential) assertCredentialValidDate(credential.expirationDate, { path: `${_path}.expirationDate`, min: _mode === 'verify' ? _now : undefined })
      break;
    case 2:
      if ('validFrom' in credential) assertCredentialValidDate(credential.validFrom, { path: `${_path}.validFrom`, max: _mode === 'verify' ? _now : undefined })
      if ('validUntil' in credential) assertCredentialValidDate(credential.validUntil, { path: `${_path}.validUntil`, min: _mode === 'verify' ? _now : undefined })
      break;
  }
  if ('evidence' in credential) assertCredentialEvidence(credential.evidence, { path: `${_path}.evidence`, allowMultiple: true })
  if ('termsOfUse' in credential) assertTypedObject(credential.termsOfUse, { path: `${_path}.termsOfUse`, allowMultiple: true })
  if ('proof' in credential) assertTypedObject(credential.proof, { path: `${_path}.proof`, allowMultiple: true })
}

export function assertCredentialValidDate(value: unknown, options?: { path?: string, min?: Date, max?: Date }): asserts value is DateTime {
  const _path = options?.path ?? 'value'
  assertDateTime(value, { path: _path })
  if (options?.min || options?.max) {
    const date = new Date(value)
    if (options?.min && date < options.min)
      throw new Error(`${_path} must be not be before ${options.min.toISOString()}`)
    if (options?.max && date > options.max)
      throw new Error(`${_path} must be not be after ${options.max.toISOString()}`)
  }
}