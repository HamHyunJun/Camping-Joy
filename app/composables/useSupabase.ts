import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

let client: SupabaseClient<Database> | null = null

/**
 * Supabase 클라이언트. 환경 변수(NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_KEY)가 없으면 null이고,
 * 그때는 공유 기능 없이 지금처럼 기기에만 저장한다.
 */
export function useSupabase(): SupabaseClient<Database> | null {
  if (client) return client
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabaseKey) return null
  client = createClient<Database>(supabaseUrl, supabaseKey)
  return client
}

/** 이 기기의 ID. 처음이면 화면 없이 익명 로그인해서 받는다. 세션은 supabase-js가 localStorage에 보관한다. */
export async function ensureDeviceId(): Promise<string | null> {
  const supabase = useSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user.id
  const { data: signedIn, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return signedIn.user?.id ?? null
}
