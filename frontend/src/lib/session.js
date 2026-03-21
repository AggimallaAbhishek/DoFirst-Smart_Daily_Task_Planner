const SESSION_KEY = 'smart-daily-planner-session';

export function getStoredSession() {
  try {
    const rawSession = window.sessionStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession);
  } catch (error) {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
