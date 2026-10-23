<template>
  <main class="login">
    <div class="brand">
      <span class="logo-mark"><img :src="tentIcon" alt="" width="22" height="22" /></span>
      <h1 class="brand-name">Camping&amp;Joy</h1>
      <p class="brand-desc">모임의 캠핑을 함께 보고, 누가 무엇을 챙길지 정리해요.</p>
    </div>

    <div class="card panel">
      <h2 class="panel-title">로그인</h2>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <button class="btn kakao" type="button" :disabled="busy" @click="kakao">카카오로 시작하기</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import tentIcon from '~/assets/icons/tent.svg'

definePageMeta({ layout: false })

const auth = useAuthStore()

const error = ref('')
const busy = ref(false)

const kakao = async (): Promise<void> => {
  busy.value = true
  error.value = (await auth.signInWithKakao()) ?? ''
  busy.value = false
}
</script>

<style scoped lang="scss">
.login {
  display: grid;
  gap: var(--space-5);
  max-width: 400px;
  margin: 0 auto;
  padding: calc(var(--safe-top) + var(--space-8)) var(--space-4) calc(var(--safe-bottom) + var(--space-8));
}

.brand {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  text-align: center;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary-soft);
}

.brand-name {
  margin: 0;
  font-size: 24px;
}

.brand-desc {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.panel {
  padding: var(--space-5);
}

.panel-title {
  margin: 0 0 var(--space-4);
  font-size: 18px;
}

// 카카오 브랜드 색
.kakao {
  width: 100%;
  border-color: #fee500;
  background: #fee500;
  color: #191919;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: #f5dc00;
  }
}
</style>
