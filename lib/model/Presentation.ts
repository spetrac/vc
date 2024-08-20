import { type CredentialContext, assertCredentialContext } from './CredentialContext.js'
import { assertType } from './JSON-LD.js'
import { assertRecord, toArray } from './Util.js'
import { assertAnyURI, type AnyURI } from './XSD.js'

export type PresentationType = 'VerifiablePresentation' | ['VerifiablePresentation', ...string[]]

export function assertPresentationType(type: unknown, options?: { path?: string }): asserts type is PresentationType {
  const _path = options?.path ?? 'type'
  assertType(type, { path: _path, allowMultiple: true, nonEmpty: true })
  if (!toArray(type).includes('VerifiablePresentation'))
    throw new Error(`${_path} must include VerifiablePresentation`)
}

export type Presentation = {
  '@context': CredentialContext,
  type: PresentationType,
  id?: AnyURI
}

export function assertPresentation(presentation: unknown, options?: { path?: string }): asserts presentation is Presentation {
  const _path = options?.path ?? 'credential'
  assertRecord(presentation, { path: _path })
  assertCredentialContext(presentation['@context'], { path: `${_path}.@context` })
  assertPresentationType(presentation.type, { path: `${_path}.type` })
  if ('id' in presentation) assertAnyURI(presentation.id, { path: `${_path}.id` })
}