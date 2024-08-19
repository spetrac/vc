/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */

//@ts-expect-error
import jsigs from 'jsonld-signatures'
//@ts-expect-error
import jsonld from 'jsonld'

import type { DocumentLoader } from './documentLoader.js'
type Proof = Record<string, any>
type Document = Record<string, any>
type Suite = Record<string, any>

const { AssertionProofPurpose } = jsigs.purposes
declare interface AssertionProofPurpose { }

/**
 * Creates a proof purpose that will validate whether or not the verification
 * method in a proof was authorized by its declared controller for the
 * proof's purpose.
 */
export class CredentialIssuancePurpose extends AssertionProofPurpose {

  constructor(param?: {
    controller?: string,
    date?: string | Date,
    maxTimestampDelta?: number
  }) {
    super(param || {});
  }

  /**
   * Validates the purpose of a proof. This method is called during
   * proof verification, after the proof value has been checked against the
   * given verification method (in the case of a digital signature, the
   * signature has been cryptographically verified against the public key).
   * @param proof - The proof to validate.
   * @param document The document whose signature is being verified.
   * @param suite Signature suite used in the proof.
   * @param verificationMethod Key id URL to the paired public key.
   * @param documentLoader A document loader.
   * @throws If verification method not authorized by controller.
   * @throws If proof's created timestamp is out of range.
   * @returns Resolves on completion.
   */
  async validate(proof: Proof, {
    document, suite, verificationMethod, documentLoader
  }: {
    document: Document,
    suite: Suite,
    verificationMethod: string,
    documentLoader?: DocumentLoader
  }): Promise<{ valid: boolean, error?: Error }> {
    try {
      const result = await super.validate(proof, {
        document, suite, verificationMethod, documentLoader
      });

      if (!result.valid) {
        throw result.error;
      }

      const issuer = jsonld.getValues(document, 'issuer');

      if (!issuer || issuer.length === 0) {
        throw new Error('Credential issuer is required.');
      }

      const issuerId = typeof issuer[0] === 'string' ? issuer[0] : issuer[0].id;

      if (result.controller.id !== issuerId) {
        throw new Error(
          'Credential issuer must match the verification method controller.');
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error as Error };
    }
  }
}
