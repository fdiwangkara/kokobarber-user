import { defineStore } from 'pinia'
import { ref } from 'vue'

let toastId = 0

export const useAlertStore = defineStore('alert', () => {
  const toasts = ref([])
  const confirmModal = ref(null)

  function toast(message, type = 'info', duration = 3500) {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => dismissToast(id), duration)
    return id
  }

  function success(message) {
    return toast(message, 'success')
  }

  function error(message) {
    return toast(message, 'error', 4500)
  }

  function warning(message) {
    return toast(message, 'warning', 4000)
  }

  function info(message) {
    return toast(message, 'info')
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function confirm(options) {
    return new Promise((resolve) => {
      confirmModal.value = {
        title: options.title ?? 'Konfirmasi',
        message: options.message ?? '',
        confirmText: options.confirmText ?? 'Ya',
        cancelText: options.cancelText ?? 'Batal',
        variant: options.variant ?? 'primary',
        onConfirm: () => {
          confirmModal.value = null
          resolve(true)
        },
        onCancel: () => {
          confirmModal.value = null
          resolve(false)
        },
      }
    })
  }

  function closeConfirm() {
    if (confirmModal.value?.onCancel) confirmModal.value.onCancel()
  }

  return {
    toasts,
    confirmModal,
    toast,
    success,
    error,
    warning,
    info,
    dismissToast,
    confirm,
    closeConfirm,
  }
})
