<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import AppToast from './components/AppToast.vue'
import AppConfirmModal from './components/AppConfirmModal.vue'

const route = useRoute()
const router = useRouter()

const showNav = computed(() => !route.meta.guestOnly && route.name !== 'payment')
const showHeader = computed(() => !route.meta.guestOnly)
const headerTitle = computed(() => route.meta.title ?? 'Koko Barber')
const showBack = computed(() => ['payment', 'rate'].includes(route.name))

function goBack() {
  router.back()
}
</script>

<template>
  <div class="app">
    <AppHeader v-if="showHeader" :title="headerTitle" :show-back="showBack" @back="goBack" />
    <main>
      <router-view />
    </main>
    <BottomNav v-if="showNav" />
    <AppToast />
    <AppConfirmModal />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

main {
  min-height: calc(100vh - var(--header-height));
}
</style>
