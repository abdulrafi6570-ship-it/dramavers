import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

export async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  if (!clientPromise) {
    clientPromise = fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return supabaseClient;
      });
  }
  
  return clientPromise;
}
