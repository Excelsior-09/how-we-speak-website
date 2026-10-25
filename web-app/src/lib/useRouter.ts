// ==============================================================================
// HOW WE SPEAK — USE ROUTER HOOK
// ==============================================================================

import { useContext } from 'react'
import { RouterContext, type RouterContextType } from './routerTypes'

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}
