export type CredentialContextURI = 'https://www.w3.org/2018/credentials/v1' | 'https://www.w3.org/ns/credentials/v2'

export const CredentialContextURIs = Object.freeze([
  'https://www.w3.org/2018/credentials/v1',
  'https://www.w3.org/ns/credentials/v2'
] as const)

export function isCredentialContextURI(value: unknown): value is CredentialContextURI {
  return CredentialContextURIs.includes(value as any)
}

export function getCredentialContextURI(value: CredentialContextVersion): CredentialContextURI | undefined {
  return CredentialContextURIs[CredentialContextVersions.indexOf(value)]
}

export type CredentialContextVersion = 1.0 | 2.0

export const CredentialContextVersions = Object.freeze([
  1.0,
  2.0
] as const)

export function isCredentialContextVersion(value: unknown): value is CredentialContextVersion {
  return CredentialContextVersions.includes(value as any)
}

export function getCredentialContextVersion(value: CredentialContextURI): CredentialContextVersion | undefined {
  return CredentialContextVersions[CredentialContextURIs.indexOf(value)]
}

export type GenericContext = string | Record<string, any> | Array<GenericContext>

export type CredentialContext = [
  CredentialContextURI,
  ...GenericContext[]
]

export function assertCredentialContext(context: unknown, options?: { name?: string }): asserts context is CredentialContext {
  if (!Array.isArray(context))
    throw new Error(`${options?.name ?? 'context'} must be a string`)
  if (context.length === 0)
    throw new Error(`${options?.name ?? 'context'} must not be empty`)
  if (!isCredentialContextURI(context[0]))
    throw new Error(`${options?.name ?? 'context'} must start with a credential context URI`)
}

export function extractCredentialContextURI(context: CredentialContext): CredentialContextURI {
  assertCredentialContext(context)
  return context[0]
}

export function extractCredentialContextVersion(context: CredentialContext): CredentialContextVersion {
  assertCredentialContext(context)
  return CredentialContextVersions[CredentialContextURIs.indexOf(context[0])]
}