import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  loginUser,
  logoutUser,
  refreshToken as refreshTokenApi,
  UserResponse,
} from "@/services/spcApi";

export type AppRole = "admin" | "engineer" | "inspector";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canAccess: (route: string) => boolean;
  canEdit: (resource: string) => boolean;
  appRole: AppRole | null;
  profile: UserResponse | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Route access by role
const ROUTE_ACCESS: Record<AppRole, string[]> = {
  admin: ["/", "/alerts", "/users", "/machines", "/settings"],
  engineer: ["/", "/alerts", "/users", "/machines", "/settings"],
  inspector: ["/", "/alerts", "/machines"],
};

// Edit permissions by role
const EDIT_ACCESS: Record<AppRole, string[]> = {
  admin: ['alerts', 'users', 'machines', 'settings'],
  engineer: ['alerts'],
  inspector: [],
};

const AUTH_STORAGE_KEY = "spc_auth";

interface StoredAuth {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const appRole = (user?.role as AppRole) || null;

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: StoredAuth = JSON.parse(stored);
        setUser(parsed.user);
        setAccessToken(parsed.access_token);
        setRefreshTokenValue(parsed.refresh_token);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const persistAuth = (data: StoredAuth) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
    setRefreshTokenValue(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      const authData: StoredAuth = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user: response.user,
      };
      setUser(response.user);
      setAccessToken(response.access_token);
      setRefreshTokenValue(response.refresh_token);
      persistAuth(authData);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        // ignore logout errors
      }
    }
    clearAuth();
  };

  const hasRole = (role: AppRole) => appRole === role;

  const canAccess = (route: string) => {
    if (!appRole) return false;
    return ROUTE_ACCESS[appRole]?.includes(route) ?? false;
  };

  const canEdit = (resource: string) => {
    if (!appRole) return false;
    return EDIT_ACCESS[appRole]?.includes(resource) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        signIn,
        signOut,
        hasRole,
        canAccess,
        canEdit,
        appRole,
        profile: user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
