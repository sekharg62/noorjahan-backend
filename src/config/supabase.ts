import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase =
  env.supabase.url && env.supabase.anonKey
    ? createClient(env.supabase.url, env.supabase.anonKey)
    : null;

export const supabaseAdmin =
  env.supabase.url && env.supabase.serviceRoleKey
    ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
