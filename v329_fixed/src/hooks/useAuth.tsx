/**
 * useAuth.tsx — Auth context with local profile/role caching
 *
 * Problem: The old version called profiles + user_roles on EVERY app open,
 * even when the user was already logged in. This caused unnecessary PostgREST
 * egress on every app launch.
 *
 * Fix: Profile and role data is cached in localStorage under a user-specific
 * key. On subsequent app opens, we read from cache instantly (no DB call).
 * Cache is invalidated only on sign-in (fresh data) and sign-out (cleared).
 * Premium expiry is checked client-side from the cached value.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, Profile } from '@/types/database';

// ─── Hardcoded admin allowlist (requested) ────────────────────────────────────
// NOTE:
// - This only affects the app's client-side "isAdmin" gating.
// - If your Supabase RLS policies also require an 'admin' row in user_roles,
//   we additionally TRY to upsert {role:'admin'} for these users on sign-in.
//   If your DB blocks it, you'll still need to grant admin in Supabase Dashboard.
const ADMIN_EMAILS = new Set<string>([
  'thewaymmofficial@gmail.com',
  'smgaming00024@gmail.com',
]);

// ─── Cache helpers ────────────────────────────────────────────────────────────

const AUTH_CACHE_PREFIX = 'auth_cache:';

interface AuthCache {
  profile: Profile | null;
  role: AppRole | null;
  premiumExpiresAt: string | null;
  premiumType: string | null;
  savedAt: number;
}

/** Cache TTL: 30 minutes. After this, we re-fetch to catch role changes. */
const AUTH_CACHE_TTL_MS = 30 * 60 * 1000;

function readAuthCache(userId: string): AuthCache | null {
  try {
    const raw = localStorage.getItem(`${AUTH_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const cache: AuthCache = JSON.parse(raw);
    // Invalidate stale cache
    if (Date.now() - cache.savedAt > AUTH_CACHE_TTL_MS) {
      localStorage.removeItem(`${AUTH_CACHE_PREFIX}${userId}`);
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

function writeAuthCache(userId: string, data: Omit<AuthCache, 'savedAt'>): void {
  try {
    const entry: AuthCache = { ...data, savedAt: Date.now() };
    localStorage.setItem(`${AUTH_CACHE_PREFIX}${userId}`, JSON.stringify(entry));
  } catch {
    // localStorage full — not critical
  }
}

function clearAuthCache(userId?: string): void {
  if (userId) {
    localStorage.removeItem(`${AUTH_CACHE_PREFIX}${userId}`);
  } else {
    // Clear all auth caches
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(AUTH_CACHE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  premiumExpiresAt: string | null;
  premiumType: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [user,             setUser]             = useState<User | null>(null);
  const [session,          setSession]          = useState<Session | null>(null);
  const [profile,          setProfile]          = useState<Profile | null>(null);
  const [role,             setRole]             = useState<AppRole | null>(null);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [premiumType,      setPremiumType]      = useState<string | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);

  // ── Load user data: cache-first, DB-fallback ──────────────────────────────

  async function loadUserData(userId: string, userEmail?: string | null, forceRefresh = false) {
    const isAdminEmail = !!userEmail && ADMIN_EMAILS.has(userEmail.toLowerCase());

    // 1. Try cache first (avoids DB call on every app open)
    if (!forceRefresh) {
      const cached = readAuthCache(userId);
      if (cached) {
        setProfile(cached.profile);
        // Admin allowlist overrides cached role too
        setRole(isAdminEmail ? 'admin' : cached.role);
        setPremiumExpiresAt(cached.premiumExpiresAt);
        setPremiumType(cached.premiumType);
        setIsLoading(false);
        return;
      }
    }

    // 2. Fetch from DB (first login, cache expired, or forced refresh)
    try {
      const [profileRes, rolesRes] = await Promise.all([
        // profile might not exist if the DB trigger was missing during a migration
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        // some older DBs may have multiple rows per user (free_user + admin, etc.)
        supabase.from('user_roles')
          .select('role, premium_expires_at, premium_type')
          .eq('user_id', userId),
      ]);

      const profileData = (profileRes.data as Profile | null) ?? null;
      const roles = (rolesRes.data || []) as Array<{
        role: AppRole;
        premium_expires_at: string | null;
        premium_type: string | null;
      }>;

      // Pick the strongest role if duplicates exist.
      let effectiveRole: AppRole | null =
        roles.some(r => r.role === 'admin') ? 'admin'
        : roles.some(r => r.role === 'premium') ? 'premium'
        : roles[0]?.role ?? 'free_user';

      // Requested: treat certain emails as admins.
      if (isAdminEmail) effectiveRole = 'admin';

      // Prefer premium fields from the premium row if present.
      const premiumRow = roles.find(r => r.role === 'premium') ?? roles[0];
      const newPremiumExpiresAt = premiumRow?.premium_expires_at ?? null;
      const newPremiumType      = premiumRow?.premium_type ?? null;

      // Best-effort: ensure these allowlisted admins also have an 'admin' row
      // so that Supabase RLS policies based on user_roles can work.
      if (isAdminEmail && !roles.some(r => r.role === 'admin')) {
        try {
          await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' } as any, { onConflict: 'user_id' });
        } catch {
          // ignore — DB/RLS may block it; admin can still be granted server-side.
        }
      }

      setProfile(profileData);
      setRole(effectiveRole);
      setPremiumExpiresAt(newPremiumExpiresAt);
      setPremiumType(newPremiumType);

      // Save to cache
      writeAuthCache(userId, {
        profile: profileData,
        role: effectiveRole,
        premiumExpiresAt: newPremiumExpiresAt,
        premiumType: newPremiumType,
      });
    } catch (err) {
      console.error('[Auth] Failed to fetch user data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function clearUserState() {
    setProfile(null);
    setRole(null);
    setPremiumExpiresAt(null);
    setPremiumType(null);
    setIsLoading(false);
  }

  // ── Auth state listener ───────────────────────────────────────────────────

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          clearAuthCache();
          clearUserState();
          queryClient.removeQueries({ queryKey: ['watchlist'] });
          queryClient.removeQueries({ queryKey: ['admin'] });
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Force fresh fetch on sign-in to get latest role/premium status
          setTimeout(() => loadUserData(newSession.user.id, newSession.user.email, true), 0);
          queryClient.invalidateQueries({ queryKey: ['watchlist', newSession.user.id] });
        }

        if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Token refreshed — use cache, no need to re-fetch profile
          setTimeout(() => loadUserData(newSession.user.id, newSession.user.email, false), 0);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        // Cache-first: no DB call if cache is fresh
        loadUserData(existingSession.user.id, existingSession.user.email, false);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    queryClient.clear();
    clearAuthCache(user?.id);
    // Remove any previous Supabase auth tokens (project-specific keys)
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('sb-') && k.endsWith('-auth-token')) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearUserState();
  };

  // ── Premium check ─────────────────────────────────────────────────────────

  const isAdmin   = role === 'admin';
  const isPremium = role === 'admin' || role === 'premium';

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, role,
        premiumExpiresAt, premiumType,
        isLoading, isAdmin, isPremium,
        signIn, signUp, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
