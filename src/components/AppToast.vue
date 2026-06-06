<script setup>
import { useAlertStore } from '../stores/alert'
import AppIcon from './AppIcon.vue'

const alert = useAlertStore()

const icons = {
  success: 'mdi:check-circle',
  error: 'mdi:alert-circle',
  warning: 'mdi:alert',
  info: 'mdi:information',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in alert.toasts"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          role="alert"
        >
          <AppIcon :icon="icons[t.type]" :size="20" />
          <span class="toast-message">{{ t.message }}</span>
          <button class="toast-close" aria-label="Tutup" @click="alert.dismissToast(t.id)">
            <AppIcon icon="mdi:close" :size="18" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--header-height) + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(420px, calc(100% - 2rem));
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid;
  pointer-events: auto;
}

.toast--success {
  border-color: var(--success);
  color: var(--success);
}

.toast--error {
  border-color: var(--danger);
  color: var(--danger);
}

.toast--warning {
  border-color: var(--warning);
  color: var(--warning);
}

.toast--info {
  border-color: var(--primary);
  color: var(--primary);
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
}

.toast-close {
  color: var(--text-muted);
  padding: 0.15rem;
  border-radius: 4px;
}

.toast-close:hover {
  background: var(--border);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
