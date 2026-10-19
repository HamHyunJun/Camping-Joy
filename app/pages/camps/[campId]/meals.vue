<template>
  <section v-if="camp">
    <div class="page-head">
      <h1 class="page-title">음식</h1>
    </div>
    <p class="page-desc">끼니마다 먹을 음식을 적고, 장볼 것을 모아 보세요. 음식뿐 아니라 물·술 같은 것도 같은 목록에 적으면 돼요. 비워 둬도 결과를 볼 수 있어요.</p>

    <!-- 끼니별 메뉴 -->
    <section class="card block" aria-labelledby="meals-title">
      <h2 id="meals-title" class="block-title">끼니별 메뉴</h2>

      <div v-for="group in mealGroups" :key="group.day" class="group">
        <h3 class="group-label">{{ group.day }}일차</h3>
        <ul class="meal-list">
          <li v-for="meal in group.items" :key="meal.id" class="meal-row">
            <label class="meal-label" :for="`meal-${meal.id}`">{{ meal.type }}</label>
            <input
              :id="`meal-${meal.id}`"
              class="input"
              type="text"
              maxlength="60"
              placeholder="예: 삼겹살, 김치찌개"
              autocomplete="off"
              :value="meal.menu"
              @change="store.updateMenu(meal.id, ($event.target as HTMLInputElement).value)"
            />
            <button class="remove" type="button" :aria-label="`${meal.day}일차 ${meal.type} 지우기`" @click="store.removeMenu(meal.id)">×</button>
          </li>
        </ul>
      </div>
      <p v-if="!mealGroups.length" class="empty">끼니가 없어요. 아래에서 추가해 보세요.</p>

      <div class="add-meal">
        <SelectMenu v-model="addDay" class="day-select" :options="dayOptions" aria-label="일차" />
        <div class="chips">
          <button v-for="type in MEAL_TYPES" :key="type" class="chip" type="button" @click="store.addMenu(Number(addDay), type)">
            + {{ type }}
          </button>
        </div>
      </div>
    </section>

    <!-- 장보기 -->
    <section class="card block" aria-labelledby="shopping-title">
      <h2 id="shopping-title" class="block-title">
        장보기
        <span v-if="shopping.length" class="count">{{ boughtCount }}/{{ shopping.length }}</span>
      </h2>

      <form class="add-row" @submit.prevent="addItem">
        <input v-model="newItem" class="input" type="text" placeholder="장볼 것 (예: 물, 삼겹살 3근)" maxlength="40" autocomplete="off" />
        <button class="btn btn-primary" type="submit" :disabled="!newItem.trim()">추가</button>
      </form>

      <ul v-if="shopping.length" class="shopping-list">
        <li v-for="item in shopping" :key="item.id" class="shopping-item" :class="{ bought: item.bought }">
          <label class="check">
            <input type="checkbox" :checked="item.bought" @change="store.toggleShoppingItem(item.id)" />
            <span>{{ item.name }}</span>
          </label>
          <button class="remove" type="button" :aria-label="`${item.name} 지우기`" @click="store.removeShoppingItem(item.id)">×</button>
        </li>
      </ul>
      <p v-else class="empty">장볼 것이 아직 없어요. 위에서 추가해 보세요.</p>
    </section>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/schedule`">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" :to="`/camps/${route.params.campId}/result`">다음: 결과 보기</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SelectMenuOption } from '~/components/SelectMenu.vue'
import { MEAL_TYPES } from '~/constants/meals'
import format from '~/utils/format'

const store = useCampStore()
const route = useRoute()

/** 끼니를 추가할 때 고를 수 있는 일차 (최대 7일차) */
const dayOptions: SelectMenuOption[] = Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}일차` }))

const addDay = ref('1')
const newItem = ref('')

const camp = computed(() => store.currentCamp)
const mealGroups = computed(() => format.scheduleGroups(format.sortMeals(camp.value?.menus ?? [])))
const shopping = computed(() => camp.value?.shopping ?? [])
const boughtCount = computed(() => shopping.value.filter((s) => s.bought).length)

const addItem = (): void => {
  if (!newItem.value.trim()) return
  store.addShoppingItem(newItem.value)
  newItem.value = ''
}

store.seedMenus()
</script>

<style scoped lang="scss">
.block + .block {
  margin-top: var(--space-4);
}

.block-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  font-size: 16px;
}

.count {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  line-height: 20px;
}

.meal-list,
.shopping-list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.meal-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: var(--space-2);
}

.meal-label {
  font-weight: 700;
}

.add-meal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.day-select {
  width: 104px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  .chip {
    background: var(--color-surface-muted);
    cursor: pointer;
  }
}

.add-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.group + .group {
  margin-top: var(--space-3);
}

.group-label {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.shopping-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-2) 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: opacity 0.2s;

  &.bought {
    opacity: 0.55;

    .check span {
      text-decoration: line-through;
    }
  }
}

.check {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  min-height: 44px;
  cursor: pointer;
  word-break: keep-all;
  overflow-wrap: anywhere;

  input {
    flex: none;
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary);
  }
}

.remove {
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }
}
</style>
