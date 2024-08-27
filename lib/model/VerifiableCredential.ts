import { assertCredential, type Credential } from './Credential.js'
import { extractCredentialContextVersion } from './CredentialContext.js'
import { type TypedObject } from './JSON-LD.js'
import { assertLinkedDataSignature, DocumentLoader, ProofPurpose, type LinkedDataSignature } from './LinkedData.js'
import { assertRecord } from './Util.js'
import { type DateTime } from './XSD.js'
//@ts-ignore
import { sign as signDocument } from 'jsonld-signatures'

export type VerifiableCredential<version = 'any'> = Credential<version> & {
  proof: TypedObject
}

export async function issue(credential: Credential, suite: LinkedDataSignature, options?: { now?: Date | DateTime, purpose?: ProofPurpose, documentLoader?: DocumentLoader }): Promise<VerifiableCredential> {
  const _now = options?.now ? new Date(options.now) : new Date()
  assertRecord(credential)
  assertLinkedDataSignature(suite)
  if (extractCredentialContextVersion(credential['@context']) === 1.0) {
    const issuanceDate = _now.toISOString().replace(/\.\d*(?=Z)/, '')
    Object.assign(credential as Credential<1.0>, { issuanceDate })
  }
  assertCredential(credential, { now: _now, mode: 'issue' })
  return signDocument(credential, { suite, purpose: options?.purpose, documentLoader: options?.documentLoader }) as VerifiableCredential
}