import { assertObject } from './Util.js'

// https://github.com/digitalbazaar/jsonld-signatures/blob/main/lib/suites/LinkedDataProof.js
// https://github.com/digitalbazaar/jsonld-signatures/blob/main/lib/suites/LinkedDataSignature.js
// https://github.com/digitalbazaar/ed25519-signature-2020/blob/main/lib/Ed25519Signature2020.js

export interface Document { }

export interface Proof { }

export interface DocumentLoader { }

export interface ProofPurpose {
  term: string
  date?: Date
  maxTimestampDelta?: number
  //@ts-ignore
  validate(proof: Proof, options: { document, suite, verificationMethod, documentLoader, expansionMap }): Promise<{ valid: boolean, error?: Error }>
  //@ts-ignore
  update(proof: Proof, options: { document, suite, documentLoader, expansionMap }): Promise<Proof>
  //@ts-ignore
  match(proof: Proof, options: { document, documentLoader, expansionMap }): Promise<boolean>
}

export interface LinkedDataProof {
  type: string
  //@ts-ignore
  createProof(param: { document, purpose, proofSet, documentLoader, expansionMap }): Promise<Proof>
  //@ts-ignore
  derive(param: { document, purpose, proofSet, documentLoader }): Promise<Document>
  //@ts-ignore
  verifyProof(param: { proof, document, purpose, proofSet, documentLoader, expansionMap }): Promise<unknown>
  //@ts-ignore
  matchProof(param: { proof, document, purpose, documentLoader, expansionMap }): Promise<boolean>
}

export interface LinkedDataSignature extends LinkedDataProof {
  //@ts-ignore
  updateProof(param: { proof: Proof, expansionMap }): Promise<Proof>
  //@ts-ignore
  canonize(input: Document, options: { documentLoader, expansionMap, skipExpansion }): Promise<Document>
  //@ts-ignore
  canonizeProof(proof: Proof, options: { document, documentLoader, expansionMap }): Promise<Proof>
  //@ts-ignore
  createVerifyData(param: { document, proof, documentLoader, expansionMap }): Promise<Uint8Array>
  //@ts-ignore
  getVerificationMethod(param: { proof, documentLoader }): Promise<unknown>
  sign(): Promise<unknown>
  verifySignature(): Promise<unknown>
  //@ts-ignore
  ensureSuiteContext(param: { document, addSuiteContext }): void
}

export function assertLinkedDataSignature(suite: unknown, options?: { path?: string }): asserts suite is LinkedDataSignature {
  const _path = options?.path ?? 'suite'
  assertObject(suite, { path: _path })
  if (typeof suite.sign !== 'function')
    throw new TypeError(`${_path}.sign must be a function`)
  if (typeof suite.canonize !== 'function')
    throw new TypeError(`${_path}.canonize must be a function`)
}