import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

let client: SupabaseClient<Database> | undefined

/**
 * Supabase 클라이언트. 환경 변수(NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_KEY)가 없으면 undefined이고,
 * 그때는 지금처럼 기기에만 저장한다.
 */
export function useSupabase(): SupabaseClient<Database> | undefined {
  if (client) return client
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabaseKey) return undefined
  // 로그인 세션은 브라우저에 저장되고, 카카오·비밀번호 재설정 링크로 돌아오면 주소의 토큰을 읽는다.
  client = createClient<Database>(supabaseUrl, supabaseKey)
  return client
}
