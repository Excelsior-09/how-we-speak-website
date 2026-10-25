// ==============================================================================
// HOW WE SPEAK — ROUTER TYPES & ROUTE PARSER
// ==============================================================================

import { createContext } from 'react'
import { parseRoute, type AppRoute } from './routeParser'

export type { AppRoute }
export { parseRoute }

export interface RouterContextType {
  route: AppRoute
  path: string
  params: Record<string, string>
  navigate: (path: string, options?: { replace?: boolean }) => void
  returnTo: string | null
  setReturnTo: (path: string | null) => void
}

export const RouterContext = createContext<RouterContextType | undefined>(undefined)
