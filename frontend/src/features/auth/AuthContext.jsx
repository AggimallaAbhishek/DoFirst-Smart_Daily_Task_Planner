import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
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

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    const nextSession = {
      token: result.token,
      user: result.user
    };

    saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }, []);

  const register = useCallback(async (credentials) => {
    await registerUser(credentials);
    return login(credentials);
  }, [login]);

  const loginViaGoogle = useCallback(async (payload) => {
    const result = await loginWithGoogle(payload);
    const nextSession = {
      token: result.token,
      user: result.user
    };

    saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.token),
      isBootstrapping,
      login,
      loginWithGoogle: loginViaGoogle,
      register,
      logout,
      getApiErrorMessage
    }),
    [isBootstrapping, login, loginViaGoogle, logout, register, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
