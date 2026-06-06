<script setup>
import { useAlertStore } from '../stores/alert'
import AppIcon from './AppIcon.vue'

const alert = useAlertStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="alert.confirmModal" class="modal-overlay" @click.self="alert.closeConfirm()">
        <div class="modal card" role="dialog" aria-modal="true">
          <div class="modal-icon">
            <AppIcon icon="mdi:help-circle-outline" :size="40" color="var(--primary)" />
          </div>
          <h3 class="modal-title">{{ alert.confirmModal.title }}</h3>
          <p class="modal-message">{{ alert.confirmModal.message }}</p>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="alert.confirmModal.onCancel()">
              {{ alert.confirmModal.cancelText }}
            </button>
            <button
              class="btn btn-sm"
              :class="alert.confirmModal.variant === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="alert.confirmModal.onConfirm()"
            >
              {{ alert.confirmModal.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(26, 26, 26, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 380px;
  padding: 1.5rem;
  text-align: center;
}

.modal-icon {
  margin-bottom: 0.75rem;
}

.modal-title {
  font-size: 1.1rem;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.modal-message {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-actions .btn {
  flex: 1;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn-danger:hover {
  filter: brightness(1.1);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(8px);
}
</style>
