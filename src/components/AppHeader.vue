<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  title: { type: String, default: 'Koko Barber' },
  showBack: { type: Boolean, default: false },
})

const emit = defineEmits(['back'])
</script>

<template>
  <header class="header">
    <button v-if="showBack" class="back-btn" aria-label="Kembali" @click="emit('back')">
      <AppIcon icon="mdi:arrow-left" :size="22" />
    </button>
    <div class="header-brand">
      <AppIcon icon="mdi:content-cut" :size="24" class="logo" />
      <h1 class="header-title">{{ title }}</h1>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  min-height: var(--header-height);
  box-shadow: var(--shadow);
}

.back-btn {
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  color: var(--accent-light);
}

.header-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
