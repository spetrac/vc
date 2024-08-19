/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */

// load locally embedded contexts
//@ts-expect-error
import { contexts as credentialsContexts } from '@digitalbazaar/credentials-context'

const contexts = new Map([...credentialsContexts])


export type DocumentLoader = (url: string) => DocumentContext
export type DocumentContext<T = any> = {
  contextUrl?: string
  documentUrl: string
  document: T
  tag?: string
}

export async function documentLoader<T = any>(url: string): Promise<DocumentContext<T>> {
  const context = contexts.get(url) as T | undefined
  if (!context) throw new Error(`Document loader unable to load URL "${url}".`)

  return {
    documentUrl: url,
    document: context
  }
}
