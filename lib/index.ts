/**
 * A JavaScript implementation of Verifiable Credentials.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017-2023 Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the Digital Bazaar, Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { assertCredentialContext, assertDateString, checkContextVersion, getContextForVersion, dateRegex } from './helpers.js'
import { documentLoader as _documentLoader } from './documentLoader.js'
import { CredentialIssuancePurpose } from './CredentialIssuancePurpose.js'
//@ts-expect-error
import jsigs from 'jsonld-signatures'
//@ts-expect-error
import jsonld from 'jsonld'
import type { DocumentLoader } from './documentLoader.js'
type StatusChecker = Function

const { AssertionProofPurpose, AuthenticationProofPurpose } = jsigs.purposes
declare interface AssertionProofPurpose { }
declare interface AuthenticationProofPurpose { }
export const defaultDocumentLoader = jsigs.extendContextLoader(_documentLoader)
export { CredentialIssuancePurpose }

type LinkedDataSignature = Record<string, any>
type Presentation = Record<string, any>
type ProofPurpose = Record<string, any>
type VerifiableCredential = Record<string, any>
type VerifiablePresentation = Record<string, any>

type VerifyPresentationResult = {
  /** True if verified, false if not. */
  verified: boolean,
  results?: VerifiablePresentation[],
  presentationResult?: Record<string, any>,
  credentialResults: Array<VerifyCredentialResult>,
  error?: Error
}

type VerifyCredentialResult = {
  /** True if verified, false if not. */
  verified: boolean,
  statusResult?: Record<string, any>,
  results: Array<any>,
  error?: Error,
  credentialId?: string
}

/**
 * Issues a verifiable credential (by taking a base credential document,
 * and adding a digital signature to it).
 * @param credential Base credential document.
 * @param suite Signature suite (with private key material or an API to use it), 
 * passed in to sign().
 * @param purpose A ProofPurpose. If not specified, a default purpose will be created.
 * @param documentLoader A document loader.
 * @param now A string representing date time in ISO 8601 format or an instance of Date. Defaults to current date time.
 * @throws If missing required properties.
 * @returns Resolves on completion.
 */
export async function issue({
  credential,
  suite,
  purpose = new CredentialIssuancePurpose(),
  documentLoader = defaultDocumentLoader,
  now
}: {
  credential: Record<any, any>,
  suite: LinkedDataSignature,
  purpose?: ProofPurpose,
  documentLoader?: DocumentLoader,
  now?: string | Date
}): Promise<VerifiableCredential> {
  // check to make sure the `suite` has required params
  // Note: verificationMethod defaults to publicKey.id, in suite constructor
  if (!suite) throw new TypeError('"suite" parameter is required for issuing.');
  if (!suite.verificationMethod) throw new TypeError('"suite.verificationMethod" property is required.');
  if (!credential) throw new TypeError('"credential" parameter is required for issuing.');

  if (checkContextVersion({
    credential,
    version: 1.0
  }) && !credential.issuanceDate) {
    const now = (new Date()).toJSON();
    credential.issuanceDate = `${now.slice(0, now.length - 5)}Z`;
  }

  // run common credential checks
  _checkCredential({ credential, now, mode: 'issue' });

  return jsigs.sign(credential, { purpose, documentLoader, suite });
}

/**
 * Derives a proof from the given verifiable credential, resulting in a new
 * verifiable credential. This method is usually used to generate selective
 * disclosure and / or unlinkable proofs.
 * @param verifiableCredential The verifiable credential containing a base proof to derive another proof from.
 * @param suite Derived proof signature suite.
 * @param documentLoader A document loader.
 * @throws If missing required properties.
 * @returns Resolves on completion.
 */
export async function derive({
  verifiableCredential,
  suite,
  documentLoader = defaultDocumentLoader
}: {
  verifiableCredential: Record<any, any>,
  suite: LinkedDataSignature,
  documentLoader?: DocumentLoader
}): Promise<VerifiableCredential> {
  if (!verifiableCredential) {
    throw new TypeError(
      '"verifiableCredential" parameter is required for deriving.');
  }
  if (!suite) {
    throw new TypeError('"suite" parameter is required for deriving.');
  }

  // run common credential checks
  _checkCredential({ credential: verifiableCredential, mode: 'issue' });

  return jsigs.derive(verifiableCredential, {
    purpose: new AssertionProofPurpose(),
    documentLoader,
    suite
  });
}

/**
 * Verifies a verifiable presentation:
 *   - Checks that the presentation is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param presentation Verifiable
 *   presentation, signed or unsigned, that may contain within it a
 *   verifiable credential.
 *
 * @param suite One or
 *   more signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param unsignedPresentation By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a proof purpose,
 * @param presentationPurpose Optional proof purpose (a default one will be created if not passed in).
 *
 * or a default purpose will be created with params:
 * @param challenge Required if purpose is not passed in.
 * @param controller A controller.
 * @param domain A domain.
 *
 * @param documentLoader A document loader.
 * @param checkStatus Optional function for checking credential status 
 * if `credentialStatus` is present on the credential.
 * @param now A string representing date time in ISO 8601 format or an instance of Date. 
 * Defaults to current date time.
 *
 * @returns The verification result.
 */
export async function verify(options: {
  presentation: VerifiablePresentation,
  suite: LinkedDataSignature | LinkedDataSignature[],
  unsignedPresentation?: boolean,
  documentLoader?: DocumentLoader,
  checkStatus?: StatusChecker,
  now?: Date | string,
  presentationPurpose?: AuthenticationProofPurpose,
  challenge?: string,
  controller?: string,
  domain?: string
}) {
  const { presentation } = options
  try {
    if (!presentation) throw new TypeError('A "presentation" property is required for verifying.')
    return _verifyPresentation(options);
  } catch (error) {
    return {
      verified: false,
      results: [{ presentation, verified: false, error }],
      error
    }
  }
}

/**
 * Verifies a verifiable credential:
 *   - Checks that the credential is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param credential Verifiable credential.
 *
 * @param suite One or
 *   more signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param purpose Optional  proof purpose (a default one will be created if not passed in).
 * @param documentLoader A document loader.
 * @param checkStatus Optional function for checking credential status 
 * if `credentialStatus` is present on the credential.
 * @param now A string representing date time in ISO 8601 format or an instance of Date. 
 * Defaults to current date time.
 *
 * @returns The verification result.
 */
export async function verifyCredential(options: {
  credential: any,
  suite: LinkedDataSignature | LinkedDataSignature[],
  purpose?: CredentialIssuancePurpose,
  documentLoader?: DocumentLoader,
  checkStatus?: StatusChecker,
  now?: string | Date
}): Promise<VerifyCredentialResult> {
  const { credential } = options;
  try {
    if (!credential) throw new TypeError('A "credential" property is required for verifying.')
    return await _verifyCredential(options);
  } catch (error) {
    return {
      verified: false,
      results: [{ credential, verified: false, error }],
      error: error as Error
    };
  }
}

/**
 * Verifies a verifiable credential.
 * @private
 * 
 * @param credential Verifiable credential.
 * @param suite See the
 *   definition in the `verify()` docstring, for this param.
 * @param now A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @param purpose A purpose.
 * @param documentLoader A document loader.
 * @param checkStatus Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 *
 * @throws If required parameters are missing (in `_checkCredential`).
 * @returns The verification result.
 */
async function _verifyCredential(options: {
  credential: any,
  suite: LinkedDataSignature | LinkedDataSignature[],
  now?: string | Date,
  documentLoader?: DocumentLoader,
  checkStatus?: StatusChecker,
  purpose?: CredentialIssuancePurpose,
  controller?: string
}): Promise<VerifyCredentialResult> {
  const { credential, checkStatus, now } = options;

  // run common credential checks
  _checkCredential({ credential, now });

  // if credential status is provided, a `checkStatus` function must be given
  if (credential.credentialStatus && typeof options.checkStatus !== 'function') {
    throw new TypeError(
      'A "checkStatus" function must be given to verify credentials with ' +
      '"credentialStatus".');
  }

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller: options.controller
  })

  const result = await jsigs.verify(
    credential, { ...options, purpose, documentLoader });

  // if verification has already failed, skip status check
  if (!result.verified) {
    return result;
  }

  if (credential.credentialStatus && checkStatus) {
    result.statusResult = await checkStatus(options);
    if (!result.statusResult.verified) {
      result.verified = false;
    }
  }
  return result;
}

/**
 * Creates an unsigned presentation from a given verifiable credential.
 *
 * @param verifiableCredential One or more
 *   verifiable credential.
 * @param id Optional VP id.
 * @param options Optional presentation holder url.
 * @param now A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 * @param version - The VC context version to use.
 * @throws If verifiableCredential param is missing.
 * @throws If the credential (or the presentation params) are missing required properties.
 * @returns The credential wrapped inside of a VerifiablePresentation.
 */
export function createPresentation({
  verifiableCredential, id, holder, now, version = 2.0
}: {
  verifiableCredential: any | any[],
  id?: string,
  holder?: string,
  now?: string | Date,
  version?: number
}): Presentation {
  const initialContext = getContextForVersion({ version });
  const presentation: Presentation = {
    '@context': [initialContext],
    type: ['VerifiablePresentation']
  };
  if (verifiableCredential) {
    const credentials = [].concat(verifiableCredential);
    // ensure all credentials are valid
    for (const credential of credentials) {
      _checkCredential({ credential, now });
    }
    presentation.verifiableCredential = credentials;
  }
  if (id) {
    presentation.id = id;
  }
  if (holder) {
    presentation.holder = holder;
  }

  _checkPresentation(presentation);

  return presentation;
}

/**
 * Signs a given presentation.
 *
 * @param presentation A presentation.
 * @param suite passed in to sign()
 *
 * Either pass in a ProofPurpose, or a default one will be created with params:
 * @param purpose A ProofPurpose. If not specified, a default purpose will be created with the domain and challenge options.
 *
 * @param domain A domain.
 * @param challenge A required challenge.
 *
 * @param documentLoader A document loader.
 *
 * @returns A VerifiablePresentation with a proof.
 */
export async function signPresentation(options: {
  presentation: Presentation,
  suite: LinkedDataSignature,
  purpose?: ProofPurpose,
  domain?: string,
  challenge?: string,
  documentLoader?: DocumentLoader
}): Promise<VerifiablePresentation> {
  const { presentation, domain, challenge } = options;
  const purpose = options.purpose || new AuthenticationProofPurpose({
    domain,
    challenge
  });

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  return jsigs.sign(presentation, { ...options, purpose, documentLoader });
}

/**
 * Verifies that the VerifiablePresentation is well formed, and checks the
 * proof signature if it's present. Also verifies all the VerifiableCredentials
 * that are present in the presentation, if any.
 *
 * @param presentation A VerifiablePresentation.
 * @param suite See the definition in the `verify()` docstring, for this param.
 * @param unsignedPresentation By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a proof purpose,
 * @param presentationPurpose A ProofPurpose. If not specified, a default purpose will be created with
 *   the challenge, controller, and domain options.
 *
 * @param challenge A challenge. Required if purpose is not passed in.
 * @param controller A controller. Required if purpose is not passed in.
 * @param domain A domain. Required if purpose is not passed in.
 *
 * @param documentLoader A document loader.
 * @param checkStatus Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param now A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @throws If presentation is missing required params.
 * @returns The verification result.
 */
async function _verifyPresentation(options: {
  presentation: VerifiablePresentation,
  suite: LinkedDataSignature | LinkedDataSignature[],
  unsignedPresentation?: boolean,
  presentationPurpose?: AuthenticationProofPurpose,
  challenge?: string,
  controller?: string,
  domain?: string,
  documentLoader?: DocumentLoader,
  checkStatus?: StatusChecker,
  now?: string | Date
}): Promise<VerifyPresentationResult> {
  const { presentation, unsignedPresentation } = options;

  _checkPresentation(presentation);

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  // FIXME: verify presentation first, then each individual credential
  // only if that proof is verified

  // if verifiableCredentials are present, verify them, individually
  let credentialResults: Array<VerifyCredentialResult> = []
  let verified = true;
  const credentials = jsonld.getValues(presentation, 'verifiableCredential') as any[]
  if (credentials.length > 0) {
    // verify every credential in `verifiableCredential`
    credentialResults = await Promise.all(credentials.map(credential => {
      return verifyCredential({ ...options, credential, documentLoader })
    }));

    for (const [i, credentialResult] of credentialResults.entries()) {
      credentialResult.credentialId = credentials[i].id;
    }

    const allCredentialsVerified = credentialResults.every(r => r.verified);
    if (!allCredentialsVerified) {
      verified = false;
    }
  }

  if (unsignedPresentation) {
    // No need to verify the proof section of this presentation
    return { verified, results: [presentation], credentialResults };
  }

  const { controller, domain, challenge } = options;
  if (!options.presentationPurpose && !challenge) {
    throw new Error(
      'A "challenge" param is required for AuthenticationProofPurpose.');
  }

  const purpose = options.presentationPurpose ||
    new AuthenticationProofPurpose({ controller, domain, challenge });

  const presentationResult = await jsigs.verify(
    presentation, { ...options, purpose, documentLoader });

  return {
    presentationResult,
    verified: verified && presentationResult.verified,
    credentialResults,
    error: presentationResult.error
  };
}

/**
 * @param obj Either an object with an id property or a string that is an id.
 * @returns Either an id or undefined.
 * @private
 */
function _getId(obj: string | { id: string }): string {
  return typeof obj === 'string' ? obj : obj?.id
}

// export for testing
/**
 * @param presentation - An object that could be a presentation.
 * @private
 */
export function _checkPresentation(presentation: any): void {
  // normalize to an array to allow the common case of context being a string
  const context = Array.isArray(presentation['@context']) ?
    presentation['@context'] : [presentation['@context']];
  assertCredentialContext({ context });

  const types = jsonld.getValues(presentation, 'type');

  // check type presence
  if (!types.includes('VerifiablePresentation')) {
    throw new Error('"type" must include "VerifiablePresentation".');
  }
}

// these props of a VC must be an object with a type
// if present in a VC or VP
const mustHaveType = [
  'proof',
  'credentialStatus',
  'termsOfUse',
  'evidence'
];

// export for testing
/**
 * @private
 * @param credential An object that could be a VerifiableCredential.
 * @param now A string representing date time in ISO 8601 format or an instance of Date. Defaults to current date time.
 * @param mode The mode of operation for this validation function, either `issue` or `verify`.
 */
export function _checkCredential({
  credential,
  now = new Date(),
  mode = 'verify'
}: {
  credential: Record<any, any>,
  now?: string | Date,
  mode?: string
}) {
  if (typeof now === 'string') {
    now = new Date(now);
  }
  assertCredentialContext({ context: credential['@context'] });

  // check type presence and cardinality
  if (!credential.type) {
    throw new Error('"type" property is required.');
  }

  if (!jsonld.getValues(credential, 'type').includes('VerifiableCredential')) {
    throw new Error('"type" must include `VerifiableCredential`.');
  }

  _checkCredentialSubjects({ credential });

  if (!credential.issuer) {
    throw new Error('"issuer" property is required.');
  }
  if (checkContextVersion({ credential, version: 1.0 })) {
    // check issuanceDate exists
    if (!credential.issuanceDate) {
      throw new Error('"issuanceDate" property is required.');
    }
    // check issuanceDate format on issue
    assertDateString({ credential, prop: 'issuanceDate' });

    // check issuanceDate cardinality
    if (jsonld.getValues(credential, 'issuanceDate').length > 1) {
      throw new Error('"issuanceDate" property can only have one value.');
    }
    // optionally check expirationDate
    if ('expirationDate' in credential) {
      // check if `expirationDate` property is a date
      assertDateString({ credential, prop: 'expirationDate' });
      if (mode === 'verify') {
        // check if `now` is after `expirationDate`
        if (now > new Date(credential.expirationDate)) {
          throw new Error('Credential has expired.');
        }
      }
    }
    // check if `now` is before `issuanceDate` on verification
    if (mode === 'verify') {
      const issuanceDate = new Date(credential.issuanceDate);
      if (now < issuanceDate) {
        throw new Error(
          `The current date time (${now.toISOString()}) is before the ` +
          `"issuanceDate" (${credential.issuanceDate}).`);
      }
    }
  }
  if (checkContextVersion({ credential, version: 2.0 })) {
    // check if 'validUntil' and 'validFrom'
    let { validUntil, validFrom } = credential;
    if (validUntil) {
      assertDateString({ credential, prop: 'validUntil' });
      if (mode === 'verify') {
        validUntil = new Date(credential.validUntil);
        if (now > validUntil) {
          throw new Error(
            `The current date time (${now.toISOString()}) is after ` +
            `"validUntil" (${credential.validUntil}).`);
        }
      }
    }
    if (validFrom) {
      assertDateString({ credential, prop: 'validFrom' });
      if (mode === 'verify') {
        // check if `now` is before `validFrom`
        validFrom = new Date(credential.validFrom);
        if (now < validFrom) {
          throw new Error(
            `The current date time (${now.toISOString()}) is before ` +
            `"validFrom" (${credential.validFrom}).`);
        }
      }
    }
  }
  // check issuer cardinality
  if (jsonld.getValues(credential, 'issuer').length > 1) {
    throw new Error('"issuer" property can only have one value.');
  }

  // check issuer is a URL
  if ('issuer' in credential) {
    const issuer = _getId(credential.issuer);
    if (!issuer) {
      throw new Error(`"issuer" id is required.`);
    }
    _validateUriId({ id: issuer, propertyName: 'issuer' });
  }

  // check credentialStatus
  jsonld.getValues(credential, 'credentialStatus').forEach((cs: any) => {
    // check if optional "id" is a URL
    if ('id' in cs) {
      _validateUriId({ id: cs.id, propertyName: 'credentialStatus.id' });
    }

    // check "type" present
    if (!cs.type) {
      throw new Error('"credentialStatus" must include a type.');
    }
  });

  // check evidences are URLs
  jsonld.getValues(credential, 'evidence').forEach((evidence: any) => {
    const evidenceId = _getId(evidence);
    if (evidenceId) {
      _validateUriId({ id: evidenceId, propertyName: 'evidence' });
    }
  });

  // check if properties that require a type are
  // defined, objects, and objects with types
  for (const prop of mustHaveType) {
    if (prop in credential) {
      const _value = credential[prop];
      if (Array.isArray(_value)) {
        _value.forEach(entry => _checkTypedObject(entry, prop));
        continue;
      }
      _checkTypedObject(_value, prop);
    }
  }
}

/**
 * @private
 * Checks that a property is non-empty object with property type.
 * @param obj A potential object.
 * @param name The name of the property.
 * @throws if the property is not an object with a type.
 * @returns Returns on success.
 */
function _checkTypedObject(obj: Record<any, any>, name: string): void {
  if (!isObject(obj)) throw new Error(`property "${name}" must be an object.`)
  if (_emptyObject(obj)) throw new Error(`property "${name}" can not be an empty object.`)
  if (!('type' in obj)) throw new Error(`property "${name}" must have property type.`)
}

/**
 * @private
 * Takes in a credential and checks the credentialSubject(s)
 * @param credential - The credential to check.
 * @throws Throws on errors in the credential subject.
 * @returns Returns on success.
*/
function _checkCredentialSubjects({ credential }: { credential?: Record<any, any> }): void {
  if (!credential?.credentialSubject) throw new Error('"credentialSubject" property is required.')
  if (Array.isArray(credential?.credentialSubject))
    credential?.credentialSubject.forEach(subject => _checkCredentialSubject({ subject }))
  _checkCredentialSubject({ subject: credential?.credentialSubject })
}

/**
 * @private
 * Checks a credential subject is valid.
 * @param subject A potential credential subject.
 * @throws If the credentialSubject is not valid.
 * @returns Returns on success.
 */
function _checkCredentialSubject({ subject }: { subject?: Record<any, any> }): void {
  if (!isObject(subject)) throw new Error('"credentialSubject" must be a non-null object.')
  if (_emptyObject(subject)) throw new Error('"credentialSubject" must make a claim.')
  // If credentialSubject.id is present and is not a URI, reject it
  if (subject.id) _validateUriId({ id: subject.id, propertyName: 'credentialSubject.id' })
}

/**
 * @private
 * Checks if parameter is an object.
 * @param obj A potential object.
 * @returns Returns false if not an object or null.
 */
function isObject(obj: unknown): obj is Record<any, any> {
  return obj !== null && typeof obj === 'object'
}

/**
 * @private
 * Is it an empty object?
 * @param obj A potential object.
 * @returns Is it empty?
 */
function _emptyObject(obj: unknown): obj is (typeof obj extends Record<any, any> ? {} : never) {
  return !isObject(obj) || Object.keys(obj).length === 0
}

/**
 * @private
 * Validates if an ID is a URL.
 * @param id The id.
 * @param propertyName The property name.
 * @throws Throws if an id is not a URL.
 * @returns Returns on success.
 */
function _validateUriId({ id, propertyName }: { id: string, propertyName: string }): void {
  let parsed
  try {
    parsed = new URL(id)
  } catch (e) {
    throw new TypeError(`"${propertyName}" must be a URI: "${id}".`, { cause: e })
  }
  if (!parsed.protocol) throw new TypeError(`"${propertyName}" must be a URI: "${id}".`)
}
