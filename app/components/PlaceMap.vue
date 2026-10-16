<template>
  <div class="place-map">
    <div v-if="showMap" class="map-box">
      <div ref="mapElement" class="map" />
      <p v-if="message" class="map-message">{{ message }}</p>
    </div>
    <button class="btn map-link" type="button" @click="naverMaps.openNaverMap(place.address.trim() || place.name.trim())">네이버 지도에서 보기</button>
  </div>
</template>

<script setup lang="ts">
import type { NaverMap } from '~/composables/useNaverMaps'
import naverMaps from '~/composables/useNaverMaps'
import type { CampPlace } from '~/types/camp'

const props = defineProps<{ place: CampPlace }>()

const mapElement = ref<HTMLElement>()
const message = ref('')
let map: NaverMap | undefined

onMounted(() => draw())
onBeforeUnmount(() => map?.destroy())

const showMap = computed(() => naverMaps.hasNaverMapKey() && Boolean(props.place.address.trim()))

const draw = async (): Promise<void> => {
  const address = props.place.address.trim()
  await nextTick()
  if (!showMap.value || !mapElement.value || !address) return
  message.value = '지도를 불러오는 중…'
  try {
    const position = await naverMaps.geocodeAddress(address)
    if (!position) {
      message.value = '주소로 위치를 찾지 못했어요.'
      return
    }
    const maps = await naverMaps.loadNaverMaps()
    if (!mapElement.value) return
    map?.destroy()
    map = new maps.Map(mapElement.value, { center: position, zoom: 15, scaleControl: false, mapDataControl: false })
    new maps.Marker({ position, map })
    message.value = ''
  } catch {
    message.value = '지도를 불러오지 못했어요.'
  }
}

watch(() => props.place.address, draw)
</script>

<style scoped lang="scss">
.map-box {
  position: relative;
  overflow: hidden;
  margin-bottom: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.map {
  height: 180px;
}

.map-message {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.map-link {
  width: 100%;
  color: #03c75a;
  font-weight: 700;
}
</style>
