import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, initSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { UserProfile } from "../components/LoginScreen";

interface AuthContextType {
  currentUser: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  loginWithGoogle: () => Promise<{ error: any }>;
  loginWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  loginWithPhoneLocal: (fullPhone: string, name: string) => void;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("skrible_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  // Helper to map Supabase user to UserProfile
  const mapSupabaseUser = (user: User): UserProfile => {
    const userMeta = user.user_metadata || {};
    const name =
      userMeta.full_name ||
      userMeta.name ||
      (user.email ? user.email.split("@")[0] : "Student");
    return {
      name,
      emailOrPhone: user.email || user.phone || "user@supabase.app",
      provider: (user.app_metadata?.provider as any) || "email",
      avatar: userMeta.avatar_url || userMeta.picture,
    };
  };

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    initSupabase().then(({ client, configured: isConfig }) => {
      if (!mounted) return;
      setConfigured(isConfig);

      if (isConfig) {
        // Get initial session
        client.auth.getSession().then(({ data: { session: initSession } }) => {
          if (!mounted) return;
          setSession(initSession);
          if (initSession?.user) {
            const profile = mapSupabaseUser(initSession.user);
            setCurrentUser(profile);
            try {
              localStorage.setItem("skrible_user", JSON.stringify(profile));
            } catch {}
          }
          setLoading(false);
        });

        // Listen for auth state changes across window refreshes & tab events
        const { data } = client.auth.onAuthStateChange((_event, currentSession) => {
          if (!mounted) return;
          setSession(currentSession);
          if (currentSession?.user) {
            const profile = mapSupabaseUser(currentSession.user);
            setCurrentUser(profile);
            try {
              localStorage.setItem("skrible_user", JSON.stringify(profile));
            } catch {}
          } else if (_event === "SIGNED_OUT") {
            setCurrentUser(null);
            try {
              localStorage.removeItem("skrible_user");
            } catch {}
          }
          setLoading(false);
        });
        subscription = data.subscription;
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!configured && !isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Supabase credentials are not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.",
        },
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error };
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!configured && !isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Supabase credentials are not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.",
        },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const profile = mapSupabaseUser(data.user);
      setCurrentUser(profile);
      try {
        localStorage.setItem("skrible_user", JSON.stringify(profile));
      } catch {}
    }

    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!configured && !isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Supabase credentials are not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.",
        },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const profile = mapSupabaseUser(data.user);
      setCurrentUser(profile);
      try {
        localStorage.setItem("skrible_user", JSON.stringify(profile));
      } catch {}
    }

    return { error: null };
  };

  const loginWithPhoneLocal = (fullPhone: string, name: string) => {
    const profile: UserProfile = {
      name,
      emailOrPhone: fullPhone,
      provider: "phone",
    };
    setCurrentUser(profile);
    try {
      localStorage.setItem("skrible_user", JSON.stringify(profile));
    } catch {}
  };

  const loginAsGuest = () => {
    const profile: UserProfile = {
      name: "Guest Student",
      emailOrPhone: "guest@skrible.app",
      provider: "guest",
    };
    setCurrentUser(profile);
    try {
      localStorage.setItem("skrible_user", JSON.stringify(profile));
    } catch {}
  };

  const signOut = async () => {
    if ((configured || isSupabaseConfigured()) && session) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setSession(null);
    try {
      localStorage.removeItem("skrible_user");
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        isSupabaseConfigured: configured || isSupabaseConfigured(),
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        loginWithPhoneLocal,
        loginAsGuest,
        signOut,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-stone-200 border-t-[#ec4899] rounded-full animate-spin mb-3" />
          <p className="text-xs font-mono text-black/60">Initializing workspace...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
