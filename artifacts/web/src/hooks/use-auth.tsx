import { useEffect, useState, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { setAuthTokenGetter } from '@workspace/api-client-react';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set token getter for customFetch
    setAuthTokenGetter(() => session?.access_token || null);

    async function initAuth() {
      const supabase = await getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSession(session);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => { mounted = false; };
  }, [session]);

  const signOut = async () => {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
