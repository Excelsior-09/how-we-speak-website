// ==============================================================================
// HOW WE SPEAK — ROUTE PARSER
// Shared pure function for client-side routing & route resolution verification
// Routes: /app, /app/rehearse, /app/history, /app/history/:id, /app/settings, /app/workspace, /app/scripts
// ==============================================================================

export function parseRoute(pathname) {
  let clean = (pathname || '').replace(/^\/app\/?/, '');
  clean = clean.replace(/\/$/, '');

  if (!clean || clean === '') {
    return { route: 'dashboard', params: {} };
  }

  if (clean === 'rehearse') {
    return { route: 'rehearse', params: {} };
  }

  if (clean === 'history') {
    return { route: 'history', params: {} };
  }

  const historyMatch = clean.match(/^history\/(.+)$/);
  if (historyMatch) {
    return { route: 'history-detail', params: { id: historyMatch[1] } };
  }

  if (clean === 'settings') {
    return { route: 'settings', params: {} };
  }

  if (clean === 'workspace') {
    return { route: 'workspace', params: {} };
  }

  if (clean === 'scripts') {
    return { route: 'scripts', params: {} };
  }

  return { route: 'dashboard', params: {} };
}
