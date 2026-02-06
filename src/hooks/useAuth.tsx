import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'engineer' | 'inspector';

interface Profile {
  id: string;
  inspector_name: string;
  email: string | null;
  phone: string | null;
  emp_id: string | null;
  active: boolean | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  appRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canAccess: (route: string) => boolean;
  canEdit: (resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Route access by role
const ROUTE_ACCESS: Record<AppRole, string[]> = {
  admin: ['/', '/alerts', '/users', '/machines', '/settings'],
  engineer: ['/', '/alerts', '/users', '/machines', '/settings'],
  inspector: ['/', '/alerts', '/machines'],
};

// Edit permissions by role
const EDIT_ACCESS: Record<AppRole, string[]> = {
  admin: ['alerts', 'users', 'machines', 'settings'],
  engineer: ['alerts'],
  inspector: [],
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (userId: string, userEmail: string | undefined) => {
    try {
      // Find profile by email match
      const { data: profileData } = await supabase
        .from('profile')
        .select('*')
        .eq('email', userEmail ?? '')
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);

        // Get role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileData.id)
          .maybeSingle();

        if (roleData) {
          setAppRole(roleData.role as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching profile/role:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            fetchProfileAndRole(session.user.id, session.user.email);
          }, 0);
        } else {
          setProfile(null);
          setAppRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfileAndRole(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setAppRole(null);
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
        session,
        profile,
        appRole,
        loading,
        signIn,
        signOut,
        hasRole,
        canAccess,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
