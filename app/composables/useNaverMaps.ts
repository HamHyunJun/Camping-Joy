import { Capacitor } from '@capacitor/core'

// 네이버 지도 JavaScript API v3 중 이 앱에서 쓰는 부분만 타입으로 적는다.
export interface NaverLatLng {
  lat(): number
  lng(): number
}

export interface NaverMap {
  setCenter(position: NaverLatLng): void
  destroy(): void
}

interface NaverMarker {
  setPosition(position: NaverLatLng): void
}

interface GeocodeAddress {
  roadAddress: string
  jibunAddress: string
  /** 경도 */
  x: string
  /** 위도 */
  y: string
}

interface GeocodeResponse {
  v2: { addresses: GeocodeAddress[] }
}

interface NaverMapsApi {
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Map: new (
    element: HTMLElement,
    options: { center: NaverLatLng; zoom: number; zoomControl?: boolean; scaleControl?: boolean; mapDataControl?: boolean },
  ) => NaverMap
  Marker: new (options: { position: NaverLatLng; map: NaverMap }) => NaverMarker
  Service?: {
    Status: { OK: number }
    geocode(options: { query: string }, callback: (status: number, response: GeocodeResponse) => void): void
  }
  onJSContentLoaded?: () => void
}

declare global {
  interface Window {
    naver?: { maps: NaverMapsApi }
    /** 키가 틀렸거나 등록하지 않은 주소에서 열면 네이버 지도가 부른다. */
    navermap_authFailure?: () => void
  }
}

let loading: Promise<NaverMapsApi> | null = null

/** 네이버 지도 키(NUXT_PUBLIC_NAVER_MAP_KEY_ID)가 있는지. 없으면 지도 대신 '네이버 지도에서 보기' 링크만 쓴다. */
export function hasNaverMapKey(): boolean {
  return Boolean(useRuntimeConfig().public.naverMapKeyId)
}

/** 네이버 지도 스크립트를 한 번만 불러온다. 주소 → 좌표 변환(geocoder)까지 준비되면 끝난다. */
export function loadNaverMaps(): Promise<NaverMapsApi> {
  if (loading) return loading
  const keyId = useRuntimeConfig().public.naverMapKeyId
  loading = new Promise<NaverMapsApi>((resolve, reject) => {
    if (!keyId) return reject(new Error('네이버 지도 키가 없어요.'))
    window.navermap_authFailure = () => reject(new Error('네이버 지도 인증에 실패했어요.'))
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}&submodules=geocoder`
    script.async = true
    script.onerror = () => reject(new Error('네이버 지도를 불러오지 못했어요.'))
    script.onload = () => {
      const maps = window.naver?.maps
      if (!maps) return reject(new Error('네이버 지도를 불러오지 못했어요.'))
      if (maps.Service) return resolve(maps)
      maps.onJSContentLoaded = () => resolve(maps)
    }
    document.head.appendChild(script)
  })
  loading.catch(() => (loading = null))
  return loading
}

/** 주소를 좌표로 바꾼다. 찾지 못하면 null */
export async function geocodeAddress(address: string): Promise<NaverLatLng | null> {
  const maps = await loadNaverMaps()
  return new Promise((resolve) => {
    maps.Service?.geocode({ query: address }, (status, response) => {
      const found = status === maps.Service?.Status.OK ? response.v2.addresses[0] : undefined
      resolve(found ? new maps.LatLng(Number(found.y), Number(found.x)) : null)
    })
  })
}

/** 네이버 지도에서 주소나 장소 이름을 검색한다. 앱에서는 네이버 지도 앱(없으면 브라우저)으로 넘긴다. */
export function openNaverMap(query: string) {
  const url = `https://map.naver.com/p/search/${encodeURIComponent(query)}`
  if (Capacitor.isNativePlatform()) window.location.href = url
  else window.open(url, '_blank', 'noopener')
}
