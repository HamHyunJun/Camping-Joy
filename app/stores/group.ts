import { defineStore } from 'pinia'
import type { GroupMemberRow, GroupRole, GroupRow, ProfileRow } from '~/types/database'

interface GroupState {
  groups: GroupRow[]
  /** 모임별 가입 인원(가입 신청 중 제외) */
  counts: Record<string, number>
  /** 내가 속했거나 가입을 신청한 모임과 내 역할 */
  mine: GroupMemberRow[]
  /** 지금 보고 있는 모임의 구성원. 가입 신청자는 관리자·운영진에게만 보인다. */
  members: GroupMemberRow[]
  /** 구성원의 프로필(닉네임·이미지). 관리자·운영진만 읽을 수 있다. */
  profiles: Record<string, ProfileRow>
  currentGroupId: string | undefined
  /** 모임 목록과 내 역할을 서버에서 한 번 읽어 왔는지 */
  loaded: boolean
}

/** 화면에 보여줄 메시지를 돌려주는 작업의 결과. 성공하면 undefined */
type Failure = string | undefined

const FAILED = '문제가 생겼어요. 잠시 뒤에 다시 해 주세요.'
export const TAKEN = '이미 있는 모임 이름이에요.'

/** 모임. 모임 하나가 멤버·장비·캠핑 묶음이다. */
export const useGroupStore = defineStore('group', {
  state: (): GroupState => ({ groups: [], counts: {}, mine: [], members: [], profiles: {}, currentGroupId: undefined, loaded: false }),
  getters: {
    current: (state): GroupRow | undefined => state.groups.find((g) => g.id === state.currentGroupId),
    /** 모임 안의 주소. 예: path('/gear') → /g/모임id/gear */
    path: (state) => (sub = ''): string => `/g/${state.currentGroupId}${sub}`,
    /** 이미 있는 모임 이름인지(대소문자 구분 없음) */
    nameTaken: (state) => (name: string): boolean => {
      const key = name.trim().toLowerCase()
      return state.groups.some((g) => g.name.toLowerCase() === key)
    },
    roleIn: (state) => (groupId: string): GroupRole | undefined => state.mine.find((m) => m.group_id === groupId)?.role,
    myRole(): GroupRole | undefined {
      return this.currentGroupId ? this.roleIn(this.currentGroupId) : undefined
    },
    isOwner(): boolean {
      return this.myRole === 'owner'
    },
    /** 관리자 또는 운영진 */
    isStaff(): boolean {
      return this.myRole === 'owner' || this.myRole === 'admin'
    },
    roleOfUser: (state) => (userId: string | undefined): GroupRole | undefined =>
      userId ? state.members.find((m) => m.user_id === userId)?.role : undefined,
    pending: (state): GroupMemberRow[] => state.members.filter((m) => m.role === 'pending'),
    /** 가입이 끝난 구성원. 관리자, 운영진, 멤버 순 */
    joined(state): GroupMemberRow[] {
      const order: GroupRole[] = ['owner', 'admin', 'member']
      return state.members.filter((m) => m.role !== 'pending').sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))
    },
  },
  actions: {
    async loadGroups(): Promise<void> {
      const supabase = useSupabase()
      const userId = useAuthStore().user?.id
      if (!supabase || !userId) return
      const [groups, mine, counts] = await Promise.all([
        supabase.from('groups').select('*').order('created_at'),
        supabase.from('group_members').select('*').eq('user_id', userId),
        supabase.rpc('group_member_counts'),
      ])
      if (groups.error || mine.error || counts.error) return
      this.groups = groups.data
      this.counts = Object.fromEntries(counts.data.map((c) => [c.group_id, c.member_count]))
      this.mine = mine.data
      this.loaded = true
    },
    /** 지금 보고 있는 모임의 구성원을 읽는다. 운영자라면 닉네임도 함께 읽는다. */
    async loadMembers(): Promise<void> {
      const supabase = useSupabase()
      if (!supabase || !this.currentGroupId) return
      const { data, error } = await supabase.from('group_members').select('*').eq('group_id', this.currentGroupId)
      if (error) return
      this.members = data
      if (!this.isStaff) return
      const profiles = await supabase.from('profiles').select('*').in('id', data.map((m) => m.user_id))
      if (!profiles.error) this.profiles = Object.fromEntries(profiles.data.map((p) => [p.id, p]))
    },
    async createGroup(input: { name: string; description: string; region: string }): Promise<{ id?: string; error?: string }> {
      const supabase = useSupabase()
      if (!supabase) return { error: '서버에 연결되어 있지 않아요.' }
      const { data, error } = await supabase.rpc('create_group', { p_name: input.name.trim(), p_description: input.description.trim(), p_region: input.region })
      // 동시에 같은 이름을 만들었을 때는 DB의 유일 인덱스(23505)가 막는다.
      if (error) return { error: error.code === '23505' ? TAKEN : FAILED }
      await this.loadGroups()
      return { id: data }
    },
    async requestJoin(groupId: string): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('request_join', { g: groupId })) ?? { error: true }
      if (error) return FAILED
      await this.loadGroups()
      return undefined
    },
    async cancelJoin(groupId: string): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('cancel_join', { g: groupId })) ?? { error: true }
      if (error) return FAILED
      await this.loadGroups()
      return undefined
    },
    /** 모임 설명·지역을 고친다. 관리자만 할 수 있다. */
    async updateGroup(groupId: string, input: { description: string; region: string }): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('update_group', { g: groupId, p_description: input.description.trim(), p_region: input.region })) ?? { error: true }
      if (error) return FAILED
      await this.loadGroups()
      return undefined
    },
    /** 모임을 지운다. 관리자만 할 수 있고, 멤버·장비·캠핑도 함께 지워진다. */
    async deleteGroup(groupId: string): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('delete_group', { g: groupId })) ?? { error: true }
      if (error) return FAILED
      // 지워진 모임의 실시간 구독과 화면 데이터를 정리한다.
      const { $gearSync, $campSync } = useNuxtApp()
      $gearSync?.disconnect()
      $campSync?.disconnect()
      useGearStore().people = []
      useCampStore().camps = []
      this.currentGroupId = undefined
      this.members = []
      await this.loadGroups()
      return undefined
    },
    async decideJoin(userId: string, approve: boolean): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('decide_join', { g: this.currentGroupId ?? '', u: userId, approve })) ?? { error: true }
      if (error) return FAILED
      await this.loadMembers()
      return undefined
    },
    async removeMember(userId: string): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('remove_group_member', { g: this.currentGroupId ?? '', u: userId })) ?? { error: true }
      if (error) return FAILED
      await this.loadMembers()
      return undefined
    },
    async setRole(userId: string, role: 'admin' | 'member'): Promise<Failure> {
      const { error } = (await useSupabase()?.rpc('set_member_role', { g: this.currentGroupId ?? '', u: userId, new_role: role })) ?? { error: true }
      if (error) return FAILED
      await this.loadMembers()
      return undefined
    },
  },
})
