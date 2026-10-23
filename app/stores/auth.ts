import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import type { ProfileRow } from '~/types/database'

interface AuthState {
  user: User | undefined
  /** 저장된 로그인 확인을 마쳤는지 */
  ready: boolean
  profile: ProfileRow | undefined
  /** 프로필을 서버에서 한 번 읽어 왔는지. 읽었는데 profile이 없으면 아직 정하지 않은 것이다. */
  profileLoaded: boolean
}

export interface ProfileInput {
  nickname: string
  greeting: string
  /** avatars 버킷의 파일 경로. 없으면 기본 이미지(텐트)를 쓴다. */
  avatar: string | undefined
}

let initPromise: Promise<void> | undefined

/** 카카오 로그인. Supabase 서버 설정이 없으면 로그인 없이 지금처럼 기기에만 저장한다. 실패하면 화면에 보여줄 메시지를 돌려준다. */
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ user: undefined, ready: false, profile: undefined, profileLoaded: false }),
  getters: {
    enabled: (): boolean => Boolean(useSupabase()),
    avatarUrl: () => (path: string): string => useSupabase()?.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? '',
  },
  actions: {
    init(): Promise<void> {
      initPromise ??= (async () => {
        const supabase = useSupabase()
        if (supabase) {
          supabase.auth.onAuthStateChange((_event, session) => {
            this.user = session?.user
          })
          const { data } = await supabase.auth.getSession()
          this.user = data.session?.user
        }
        this.ready = true
      })()
      return initPromise
    },
    async signInWithKakao(): Promise<string | undefined> {
      const supabase = useSupabase()
      if (!supabase) return '서버에 연결되어 있지 않아요.'
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin } })
      return error ? '카카오 로그인에 실패했어요. 잠시 뒤에 다시 해 주세요.' : undefined
    },
    async loadProfile(): Promise<void> {
      const supabase = useSupabase()
      if (this.profileLoaded || !supabase || !this.user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', this.user.id).maybeSingle()
      this.profile = data ?? undefined
      this.profileLoaded = true
    },
    /** 프로필 이미지를 올리고 파일 경로를 돌려준다. 파일 이름이 매번 달라서 캐시된 옛 이미지가 남지 않는다. */
    async uploadAvatar(image: Blob): Promise<{ path?: string; error?: string }> {
      const supabase = useSupabase()
      if (!supabase || !this.user) return { error: '서버에 연결되어 있지 않아요.' }
      const path = `${this.user.id}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, image, { contentType: 'image/jpeg' })
      return error ? { error: '이미지를 올리지 못했어요. 잠시 뒤에 다시 해 주세요.' } : { path }
    },
    async saveProfile(input: ProfileInput): Promise<string | undefined> {
      const supabase = useSupabase()
      if (!supabase || !this.user) return '서버에 연결되어 있지 않아요.'
      const previous = this.profile?.avatar
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: this.user.id, ...input, avatar: input.avatar ?? null })
        .select()
        .single()
      if (error) return '프로필을 저장하지 못했어요. 잠시 뒤에 다시 해 주세요.'
      this.profile = data
      // 바뀐 뒤에 남은 옛 이미지는 지운다. 실패해도 저장은 끝났으니 넘어간다.
      if (previous && previous !== input.avatar) await supabase.storage.from('avatars').remove([previous])
      return undefined
    },
    async signOut(): Promise<void> {
      const { $gearSync, $campSync } = useNuxtApp()
      await useSupabase()?.auth.signOut()
      this.user = undefined
      this.profile = undefined
      this.profileLoaded = false
      // 다음에 로그인하는 사람에게 이전 모임의 멤버·캠핑이 보이지 않게 비운다.
      $gearSync?.disconnect()
      $campSync?.disconnect()
      useGearStore().people = []
      useCampStore().camps = []
      useGroupStore().$reset()
    },
  },
})
