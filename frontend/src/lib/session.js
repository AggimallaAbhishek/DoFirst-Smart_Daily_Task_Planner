import { Capacitor } from '@capacitor/core';

const SESSION_KEY = 'smart-daily-planner-session';

function isNativeRuntime() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

function getPreferredStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return isNativeRuntime() ? window.localStorage : window.sessionStorage;
}

function getFallbackStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return isNativeRuntime() ? window.sessionStorage : window.localStorage;
}

function readSession(storage) {
  if (!storage) {
    return null;
  }

  try {
    const rawSession = storage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession);
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
}

function removeSession(storage) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function getStoredSession() {
  const preferredStorage = getPreferredStorage();
  const preferredSession = readSession(preferredStorage);

  if (preferredSession) {
    return preferredSession;
  }

  const fallbackStorage = getFallbackStorage();
  const fallbackSession = readSession(fallbackStorage);

  if (!fallbackSession) {
    return null;
  }

  // Migrate session to the active storage for the current runtime.
  saveSession(fallbackSession);
  removeSession(fallbackStorage);
  return fallbackSession;
}

export function saveSession(session) {
  const preferredStorage = getPreferredStorage();
  const fallbackStorage = getFallbackStorage();
  const rawSession = JSON.stringify(session);

  if (preferredStorage) {
    preferredStorage.setItem(SESSION_KEY, rawSession);
  }

  removeSession(fallbackStorage);
}

export function clearSession() {
  removeSession(getPreferredStorage());
  removeSession(getFallbackStorage());
}
