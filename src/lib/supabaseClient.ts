/**
 * IMPORTANT SECURITY NOTICE:
 * Row Level Security (RLS) MUST be enabled on any Supabase database tables created or added in the future.
 * The SUPABASE_ANON_KEY is a client-side publishable key and provides NO data protection by itself
 * without Row Level Security (RLS) policies configured in the Supabase dashboard.
 *
 * NEVER expose or reference the Supabase `service_role` or secret key in any client-side code (src/).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let supabaseInstance: SupabaseClient | null = null;
let configuredState = false;
let initPromise: Promise<{ client: SupabaseClient; configured: boolean }> | null = null;

export async function initSupabase(): Promise<{ client: SupabaseClient; configured: boolean }> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const config: SupabaseConfig = await res.json();
        if (
          config.supabaseUrl &&
          config.supabaseAnonKey &&
          config.supabaseUrl !== "https://your-supabase-project.supabase.co"
        ) {
          supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            },
          });
          configuredState = true;
          return { client: supabaseInstance, configured: true };
        }
      }
    } catch (err) {
      console.error("Failed to fetch runtime Supabase configuration from /api/config:", err);
    }

    // Fallback placeholder client
    supabaseInstance = createClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key"
    );
    configuredState = false;
    return { client: supabaseInstance, configured: false };
  })();

  return initPromise;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key"
    );
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return configuredState;
}

// Transparent Proxy export for `supabase` so method calls dynamically target initialized client instance
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Helper to provide Authorization token header or X-Guest-Mode header for API requests
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const client = getSupabase();
    const { data } = await client.auth.getSession();
    if (data?.session?.access_token) {
      return {
        Authorization: `Bearer ${data.session.access_token}`,
      };
    }
  } catch (err) {
    // Fall back to guest mode
  }
  return {
    "X-Guest-Mode": "true",
  };
}
