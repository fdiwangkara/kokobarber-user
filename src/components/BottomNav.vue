<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navItems = computed(() => [
  { name: 'home', label: 'Beranda', icon: 'mdi:home-outline', activeIcon: 'mdi:home', path: '/' },
  {
    name: 'book',
    label: 'Booking',
    icon: 'mdi:calendar-plus-outline',
    activeIcon: 'mdi:calendar-plus',
    path: '/book',
    requiresAuth: true,
  },
  {
    name: 'history',
    label: 'Riwayat',
    icon: 'mdi:clipboard-text-outline',
    activeIcon: 'mdi:clipboard-text',
    path: '/history',
    requiresAuth: true,
  },
  {
    name: 'profile',
    label: 'Profil',
    icon: 'mdi:account-outline',
    activeIcon: 'mdi:account',
    path: '/profile',
  },
])

function navigate(item) {
  if (item.requiresAuth && !auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: item.path } })
    return
  }
  router.push(item.path)
}

function isActive(item) {
  return route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi utama">
    <button
      v-for="item in navItems"
      :key="item.name"
      class="nav-item"
      :class="{ active: isActive(item) }"
      @click="navigate(item)"
    >
      <AppIcon :icon="isActive(item) ? item.activeIcon : item.icon" :size="24" class="nav-icon" />
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--nav-height);
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px rgba(86, 1, 26, 0.08);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.75rem;
  color: var(--text-muted);
  transition: color 0.2s;
  flex: 1;
  max-width: 100px;
}

.nav-item.active {
  color: var(--primary);
}

.nav-item.active .nav-icon {
  transform: scale(1.05);
}

.nav-icon {
  transition: transform 0.2s;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 600;
}

@media (min-width: 768px) {
  .bottom-nav {
    max-width: 720px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
</style>
