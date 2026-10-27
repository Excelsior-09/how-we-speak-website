// ==============================================================================
// HOW WE SPEAK — CLIENT ROUTE PARSER
// ==============================================================================

export type AppRoute =
  | 'dashboard'
  | 'rehearse'
  | 'history'
  | 'history-detail'
  | 'settings'
  | 'workspace'
  | 'scripts'
  | 'mira'
  | 'confirm-email'

export function parseRoute(pathname: string): { route: AppRoute; params: Record<string, string> } {
  let clean = (pathname || '').replace(/^\/app\/?/, '')
  clean = clean.replace(/\/$/, '')

  if (!clean || clean === '') {
    return { route: 'dashboard', params: {} }
  }

  if (clean === 'confirm-email') {
    return { route: 'confirm-email', params: {} }
  }

  if (clean === 'mira') {
    return { route: 'mira', params: {} }
  }

  if (clean === 'rehearse') {
    return { route: 'rehearse', params: {} }
  }

  if (clean === 'history') {
    return { route: 'history', params: {} }
  }

  const historyMatch = clean.match(/^history\/(.+)$/)
  if (historyMatch) {
    return { route: 'history-detail', params: { id: historyMatch[1] } }
  }

  if (clean === 'settings') {
    return { route: 'settings', params: {} }
  }

  if (clean === 'workspace') {
    return { route: 'workspace', params: {} }
  }

  if (clean === 'scripts') {
    return { route: 'scripts', params: {} }
  }

  return { route: 'dashboard', params: {} }
}
