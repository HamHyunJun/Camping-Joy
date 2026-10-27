export default {
  /** 화면의 깊이. 0: 모임 목록·로그인, 1: 모임 홈과 멤버·장비 등록(같은 줄), 2: 그 안의 상세(캠핑 단계·관리·내 정보 등) */
  depthOf(path: string): number {
    if (path === '/' || path === '/login') return 0
    if (/^\/g\/[^/]+(\/gear)?\/?$/.test(path)) return 1
    return 2
  },
}
