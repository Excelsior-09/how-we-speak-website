// ==============================================================================
// HOW WE SPEAK — CLIENT-SIDE APP ROUTER
// Manages path-based navigation for /app routes with deep linking, history, & auth gates
// Routes: /app, /app/rehearse, /app/history, /app/history/:id, /app/settings, /app/workspace, /app/scripts
// ==============================================================================

import React, { useEffect, useState, useCallback } from 'react'
import { RouterContext, parseRoute } from './routerTypes'
import { useRouter } from './useRouter'


export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/app'
  })
  const [returnTo, setReturnTo] = useState<string | null>(null)

  const parsed = parseRoute(currentPath)

  const navigate = useCallback((targetPath: string, options?: { replace?: boolean }) => {
    let fullPath = targetPath
    if (!fullPath.startsWith('/app')) {
      fullPath = `/app${fullPath.startsWith('/') ? '' : '/'}${fullPath}`
    }

    if (options?.replace) {
      window.history.replaceState({}, '', fullPath)
    } else {
      window.history.pushState({}, '', fullPath)
    }
    setCurrentPath(fullPath)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <RouterContext.Provider
      value={{
        route: parsed.route,
        path: currentPath,
        params: parsed.params,
        navigate,
        returnTo,
        setReturnTo,
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}

export const Link: React.FC<{
  to: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  title?: string
}> = ({ to, children, className, style, title }) => {
  const { navigate } = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} className={className} style={style} title={title}>
      {children}
    </a>
  )
}
