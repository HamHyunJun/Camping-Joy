import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

let client: SupabaseClient<Database> | null = null

/**
 * Supabase 클라이언트. 환경 변수(NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_KEY)가 없으면 null이고,
 * 그때는 지금처럼 기기에만 저장한다.
 */
export function useSupabase(): SupabaseClient<Database> | null {
  if (client) return client
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabaseKey) return null
  // 로그인이 없으므로 세션을 저장하지 않는다.
  client = createClient<Database>(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
