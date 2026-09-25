import { createContext, useContext, useMemo, useState } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);

  const value = useMemo(
    () => ({
      user,
      setUser,
      allowedRoutes: user?.AllowedRoutes ?? [],
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
