import { createContext, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../lib/apiError';
import { clearSession, getStoredSession, saveSession } from '../../lib/session';
import { loginUser, loginWithGoogle, registerUser } from './authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setIsBootstrapping(false);
  }, []);

  async function login(credentials) {
    const result = await loginUser(credentials);
    const nextSession = {
      token: result.token,
      user: result.user
    };

    saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }

  async function register(credentials) {
    await registerUser(credentials);
    return login(credentials);
  }

  async function loginViaGoogle(payload) {
    const result = await loginWithGoogle(payload);
    const nextSession = {
      token: result.token,
      user: result.user
    };

    saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  const value = {
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    isBootstrapping,
    login,
    loginWithGoogle: loginViaGoogle,
    register,
    logout,
    getApiErrorMessage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
