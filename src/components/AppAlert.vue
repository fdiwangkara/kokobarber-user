<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  dismissible: { type: Boolean, default: false },
})

const emit = defineEmits(['dismiss'])

const icons = {
  success: 'mdi:check-circle-outline',
  error: 'mdi:alert-circle-outline',
  warning: 'mdi:alert-outline',
  info: 'mdi:information-outline',
}
</script>

<template>
  <div class="app-alert" :class="`app-alert--${type}`" role="alert">
    <AppIcon :icon="icons[type]" :size="22" class="app-alert-icon" />
    <div class="app-alert-content">
      <strong v-if="title" class="app-alert-title">{{ title }}</strong>
      <p v-if="message" class="app-alert-message">
        <slot>{{ message }}</slot>
      </p>
      <slot v-else />
    </div>
    <button v-if="dismissible" class="app-alert-dismiss" aria-label="Tutup" @click="emit('dismiss')">
      <AppIcon icon="mdi:close" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.app-alert {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  border: 1px solid;
  margin-bottom: 1rem;
}

.app-alert--info {
  background: rgba(86, 1, 26, 0.05);
  border-color: rgba(86, 1, 26, 0.15);
  color: var(--primary);
}

.app-alert--success {
  background: rgba(45, 106, 79, 0.08);
  border-color: rgba(45, 106, 79, 0.2);
  color: var(--success);
}

.app-alert--warning {
  background: rgba(184, 134, 11, 0.1);
  border-color: rgba(184, 134, 11, 0.25);
  color: var(--warning);
}

.app-alert--error {
  background: rgba(155, 34, 38, 0.08);
  border-color: rgba(155, 34, 38, 0.2);
  color: var(--danger);
}

.app-alert-icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.app-alert-content {
  flex: 1;
  min-width: 0;
}

.app-alert-title {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.app-alert-message {
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.app-alert--info .app-alert-message,
.app-alert--success .app-alert-message,
.app-alert--warning .app-alert-message,
.app-alert--error .app-alert-message {
  color: inherit;
  opacity: 0.9;
}

.app-alert-dismiss {
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;
}

.app-alert-dismiss:hover {
  opacity: 1;
}
</style>
