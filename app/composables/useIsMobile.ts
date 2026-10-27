/** 모바일 폭(scss의 $mobile-max와 같은 1080px 이하)인지. 화면 크기가 바뀌면 따라간다. */
export const useIsMobile = (): Ref<boolean> => {
  const query = window.matchMedia('(max-width: 1080px)')
  const isMobile = ref(query.matches)
  const sync = (event: MediaQueryListEvent): void => {
    isMobile.value = event.matches
  }
  query.addEventListener('change', sync)
  onBeforeUnmount(() => query.removeEventListener('change', sync))
  return isMobile
}
