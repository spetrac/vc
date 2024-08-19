/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */

import { named as namedContexts } from '@digitalbazaar/credentials-context'

// Z and T must be uppercase
// xml schema date time RegExp
// @see https://www.w3.org/TR/xmlschema11-2/#dateTime
export const dateRegex = new RegExp(
  '-?([1-9][0-9]{3,}|0[0-9]{3})' +
  '-(0[1-9]|1[0-2])' +
  '-(0[1-9]|[12][0-9]|3[01])' +
  'T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))' +
  '(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))?')

const CREDENTIALS_CONTEXT_V1_URL = namedContexts.get('v1').id
const CREDENTIALS_CONTEXT_V2_URL = namedContexts.get('v2').id

// mappings between credentials contexts and version numbers
const credentialsContextUrlToVersion = new Map([
  [CREDENTIALS_CONTEXT_V1_URL, 1.0],
  [CREDENTIALS_CONTEXT_V2_URL, 2.0]
])
const credentialsVersionToContextUrl = new Map([
  [1.0, CREDENTIALS_CONTEXT_V1_URL],
  [2.0, CREDENTIALS_CONTEXT_V2_URL]
])

/**
 * Asserts that a context array's first item is a credentials context.
 * @param context An array of contexts.
 * @throws Throws if the first context is not a credentials context.
 */
export function assertCredentialContext({ context }: { context: Array<unknown> }): void {
  if (!credentialsContextUrlToVersion.has(context[0]))
    throw new Error(
      `"${CREDENTIALS_CONTEXT_V1_URL}" or "${CREDENTIALS_CONTEXT_V2_URL}"` +
      ' needs to be first in the list of contexts.'
    )
}

/**
 * Throws if a Date is not in the correct format.
 * @param credential A VC.
 * @param prop A prop in the object.
 * @throws Throws if the date is not a proper date string.
 */
export function assertDateString({ credential, prop }: { credential: Record<string, any>, prop: string }): void {
  const value = credential[prop]
  if (!dateRegex.test(value))
    throw new Error(`"${prop}" must be a valid date: ${value}`)
}

/**
 * Turns the first context in a VC into a numbered version.
 * @param {object} credential A VC.
 * @returns  A number representing the version.
 */
function getContextVersion({ credential }: { credential?: Record<string, any> } = {}): number | undefined {
  const firstContext = credential?.['@context']?.[0]
  return credentialsContextUrlToVersion.get(firstContext)
}

/**
 * Turns the first context in a VC into a numbered version.
 * @param  version A credentials context version.
 * @returns The context represented by the version number.
 */
export function getContextForVersion({ version }: { version: number }) {
  return credentialsVersionToContextUrl.get(version)
}

/**
 * Checks if a VC is using a specific context version.
 * @param credential A VC.
 * @param version A VC Context version
 * @returns If the first context matches the version.
 */
export function checkContextVersion({ credential, version }: { credential: Record<string, any>, version: number }): boolean {
  return getContextVersion({ credential }) === version
}
